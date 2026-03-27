import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, Profile } from '@/store/appStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Send push notification via Edge Function
async function triggerPush(userId: string, title: string, body: string, url = '/') {
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
  // Track which conversation is currently open so we don't push for it
  const activeConversationRef = useRef<string | null>(null);

  const setActiveConversation = (id: string | null) => {
    activeConversationRef.current = id;
  };

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: matches } = await db
      .from('matches')
      .select('id, user1_id, user2_id, created_at')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!matches?.length) { setConversations([]); setLoading(false); return; }

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
        fetchConversations();
        // New match push notification
        triggerPush(userId, 'Nowe dopasowanie 🔥', 'Masz nowe dopasowanie! Napisz pierwszy/a.', '/');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchConversations]);

  // Realtime: push notification on new incoming message
  useEffect(() => {
    if (!userId) return;

    const msgChannel = supabase
      .channel(`new-messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new as { sender_id: string; conversation_id: string; content: string; type: string };

          // Only push for messages FROM someone else, not from us
          if (msg.sender_id === userId) return;

          // Don't push if user is actively viewing this conversation
          if (activeConversationRef.current === msg.conversation_id) return;

          // Find sender name from conversations cache
          const senderConvo = conversations.find(c => c.id === msg.conversation_id);
          const senderName = senderConvo?.user.displayName ?? 'Nowa wiadomość';

          const body = msg.type === 'audio'
            ? '🎤 Wiadomość głosowa'
            : msg.type === 'image'
            ? '📷 Wysłał/a zdjęcie'
            : msg.type === 'video'
            ? '🎬 Wysłał/a wideo'
            : msg.type === 'gift'
            ? '🎁 Wysłał/a prezent!'
            : msg.content.length > 60
            ? msg.content.slice(0, 60) + '…'
            : msg.content;

          // Trigger push
          await triggerPush(
            userId,
            `💋 ${senderName}`,
            body,
            '/?tab=chats'
          );

          // Refresh conversation list to update unread badge
          fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [userId, conversations, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations, setActiveConversation };
}
