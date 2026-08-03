import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, Profile } from '@/store/appStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Send push notification via Edge Function. Call this from the actor who
// just DID something (sent a message, completed a match) -- they're
// guaranteed to be online right now. A push triggered from the
// *recipient's* own realtime listener instead would only ever fire while
// the recipient already has the app open, which defeats the point of a
// push (reaching someone whose app is closed). The edge function itself
// authorizes this: you may push to yourself, or to anyone you're matched
// with.
export async function triggerPush(userId: string, title: string, body: string, url = '/') {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ user_id: userId, title, body, url }),
    });
  } catch { /* silent — push failure should never crash the app */ }
}

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: matches } = await db
      .from('matches')
      .select('id, user1_id, user2_id, created_at')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!matches?.length) { setConversations([]); setLoading(false); return; }

    const { data: stateRows } = await db
      .from('match_user_state').select('match_id, archived, muted').eq('user_id', userId);
    const stateByMatch = new Map<string, { archived: boolean; muted: boolean }>(
      (stateRows ?? []).map((r: { match_id: string; archived: boolean; muted: boolean }) => [r.match_id, r])
    );

    const convos: Conversation[] = [];

    for (const match of matches) {
      const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;

      const [{ data: convo }, { data: otherProfile }] = await Promise.all([
        db.from('conversations').select('id, last_message, last_message_at').eq('match_id', match.id).single(),
        db.from('profiles').select('id, display_name, avatar_url, photos, city, age, bio, interests, is_verified, donor_badge, mood_status, relationship_type, gender, orientation').eq('id', otherId).single(),
      ]);

      if (!convo || !otherProfile) continue;

      const { count } = await db
        .from('messages').select('id', { count: 'exact', head: true })
        .eq('conversation_id', convo.id).eq('is_read', false).neq('sender_id', userId);

      const profilePhotos = (otherProfile.photos?.filter((p: string) => !p.startsWith('video:')) ?? []);
      const userProfile: Profile = {
        id: otherProfile.id,
        displayName: otherProfile.display_name || 'User',
        age: otherProfile.age ?? 25,
        city: otherProfile.city ?? '',
        bio: otherProfile.bio ?? '',
        photos: profilePhotos.length > 0 ? profilePhotos : [otherProfile.avatar_url ?? 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80'],
        interests: otherProfile.interests ?? [],
        relationshipType: otherProfile.relationship_type ?? 'both',
        moodStatus: otherProfile.mood_status ?? 'Just chatting',
        distance: 0,
        isVerified: otherProfile.is_verified ?? false,
        donorBadge: false,
        chemistryScore: 85,
        gender: otherProfile.gender ?? '',
        orientation: otherProfile.orientation ?? '',
      };

      convos.push({
        id: convo.id,
        matchId: match.id,
        user: userProfile,
        lastMessage: convo.last_message ?? '',
        lastMessageAt: convo.last_message_at
          ? new Date(convo.last_message_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
          : '',
        unreadCount: count ?? 0,
        messages: [],
        isOnline: false,
        isTyping: false,
        isArchived: stateByMatch.get(match.id)?.archived ?? false,
        isMuted: stateByMatch.get(match.id)?.muted ?? false,
      });
    }

    setConversations(convos);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime: refresh on conversation or match changes
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('conversations-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, () => {
        // The match-completing swiper triggers the push (see handleMatch
        // callers of record_swipe) -- reliable regardless of whether we're
        // online right now. This listener just keeps our own list fresh.
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchConversations]);

  // Realtime: keep the conversation list / unread badges fresh on new
  // incoming messages. The push itself is triggered by the *sender*
  // (see ChatsPage.tsx's handleSend) so it reaches us reliably even if
  // this listener isn't running -- i.e. even if our app is closed.
  useEffect(() => {
    if (!userId) return;

    const msgChannel = supabase
      .channel(`new-messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as { sender_id: string; conversation_id: string };
          if (msg.sender_id === userId) return;
          fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [userId, fetchConversations]);

  const setMatchState = useCallback(async (matchId: string, updates: { archived?: boolean; muted?: boolean }) => {
    if (!userId) return { error: 'Not authenticated' };
    setConversations(prev => prev.map(c => c.matchId === matchId ? { ...c, ...(updates.archived !== undefined ? { isArchived: updates.archived } : {}), ...(updates.muted !== undefined ? { isMuted: updates.muted } : {}) } : c));
    const { error } = await db.from('match_user_state').upsert(
      { match_id: matchId, user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'match_id,user_id' }
    );
    if (error) fetchConversations();
    return { error };
  }, [userId, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations, setMatchState };
}
