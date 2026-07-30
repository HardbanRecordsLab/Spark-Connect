// Video call signaling — a thin layer on top of Supabase Realtime
// broadcast (no DB table needed). Each logged-in user listens on
// their own channel `call:user:<their id>` for two event types:
//   - "ring"     — someone is calling them (payload carries matchId +
//                  the caller's profile so we can show who's calling)
//   - "declined" — the callee rejected an outgoing call
// The actual media connection is LiveKit's job (see VideoCallOverlay);
// this only carries the "hey, incoming call" notification since
// LiveKit itself has no concept of ringing a specific user.

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/appStore';
import type { CallPeer } from '@/store/appStore';

interface RingPayload {
  matchId: string;
  user: CallPeer;
}

export function useIncomingCallListener(userId: string | null | undefined) {
  const setIncomingCall = useAppStore(s => s.setIncomingCall);
  const endVideoCall = useAppStore(s => s.endVideoCall);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`call:user:${userId}`)
      .on('broadcast', { event: 'ring' }, ({ payload }) => {
        setIncomingCall(payload as RingPayload);
      })
      .on('broadcast', { event: 'declined' }, () => {
        // The person we called doesn't want to pick up — close our
        // own overlay rather than leaving it hanging forever.
        endVideoCall();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, setIncomingCall, endVideoCall]);
}

export function ringUser(toUserId: string, matchId: string, caller: CallPeer) {
  const channel = supabase.channel(`call:user:${toUserId}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({ type: 'broadcast', event: 'ring', payload: { matchId, user: caller } });
      // A send-only channel doesn't need to stay open.
      setTimeout(() => supabase.removeChannel(channel), 2000);
    }
  });
}

export function declineCall(toUserId: string, matchId: string) {
  const channel = supabase.channel(`call:user:${toUserId}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({ type: 'broadcast', event: 'declined', payload: { matchId } });
      setTimeout(() => supabase.removeChannel(channel), 2000);
    }
  });
}
