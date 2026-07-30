// useRouletteMatch — real random video matchmaking.
//
// Approach: roulette_sessions is a tiny waiting-pool table (see
// migration 20260730000002/...04). To find a match, first try to
// atomically claim someone else's open "waiting" row (a plain UPDATE
// with a WHERE clause that only succeeds if nobody else claimed it
// first — Postgres's row locking makes this race-safe without any
// extra coordination). If nobody is waiting, become the waiter
// yourself and listen for realtime UPDATE on your own row, which
// fires the moment someone else claims it.

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface RoulettePeer {
  id: string;
  displayName: string;
  photos: string[];
  age: number | null;
  city: string | null;
}

export type RouletteStatus = 'idle' | 'searching' | 'matched';

// eventId scopes the waiting pool to a speed-dating event (only
// candidates/waiters with the same event_id are considered) instead
// of ordinary Roulette (event_id IS NULL).
export function useRouletteMatch(userId: string | null | undefined, eventId?: string | null) {
  const [status, setStatus] = useState<RouletteStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [peer, setPeer] = useState<RoulettePeer | null>(null);

  const sessionRef = useRef<{ id: string; claimed: boolean } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cleanupChannel = () => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  };
  useEffect(() => () => cleanupChannel(), []);

  const loadPeerProfile = async (peerId: string) => {
    const { data } = await db.from('profiles').select('id, display_name, photos, age, city').eq('id', peerId).maybeSingle();
    if (data) setPeer({ id: data.id, displayName: data.display_name ?? 'Ktoś', photos: data.photos ?? [], age: data.age, city: data.city });
  };

  const search = useCallback(async () => {
    if (!userId) return;
    setStatus('searching');
    setPeer(null);
    cleanupChannel();

    let candidateQuery = db
      .from('roulette_sessions')
      .select('id, user_a')
      .eq('status', 'waiting')
      .is('user_b', null)
      .neq('user_a', userId)
      .order('created_at', { ascending: true })
      .limit(5);
    candidateQuery = eventId ? candidateQuery.eq('event_id', eventId) : candidateQuery.is('event_id', null);
    const { data: candidates } = await candidateQuery;

    for (const c of candidates ?? []) {
      const { data: claimed } = await db
        .from('roulette_sessions')
        .update({ user_b: userId, status: 'active' })
        .eq('id', c.id).eq('status', 'waiting').is('user_b', null)
        .select('id, user_a')
        .maybeSingle();
      if (claimed) {
        sessionRef.current = { id: claimed.id, claimed: true };
        setSessionId(claimed.id);
        await loadPeerProfile(claimed.user_a);
        setStatus('matched');
        return;
      }
    }

    const { data: mine } = await db
      .from('roulette_sessions')
      .insert({ user_a: userId, status: 'waiting', event_id: eventId ?? null })
      .select('id')
      .single();
    if (!mine) { setStatus('idle'); return; }

    sessionRef.current = { id: mine.id, claimed: false };
    setSessionId(mine.id);

    const channel = supabase
      .channel(`roulette:${mine.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'roulette_sessions', filter: `id=eq.${mine.id}` },
        async (payload: { new: { status: string; user_b: string | null } }) => {
          if (payload.new.status === 'active' && payload.new.user_b) {
            if (sessionRef.current) sessionRef.current.claimed = true;
            await loadPeerProfile(payload.new.user_b);
            setStatus('matched');
            cleanupChannel();
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
  }, [userId, eventId]);

  // Leaves whatever state we're currently in — deletes an unclaimed
  // waiting row, or marks an active session ended.
  const leave = useCallback(async () => {
    cleanupChannel();
    const s = sessionRef.current;
    sessionRef.current = null;
    setSessionId(null);
    setPeer(null);
    setStatus('idle');
    if (!s) return;
    if (s.claimed) {
      await db.from('roulette_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', s.id);
    } else {
      await db.from('roulette_sessions').delete().eq('id', s.id).eq('status', 'waiting');
    }
  }, []);

  const skip = useCallback(async () => {
    await leave();
    search();
  }, [leave, search]);

  return { status, sessionId, peer, search, skip, leave };
}
