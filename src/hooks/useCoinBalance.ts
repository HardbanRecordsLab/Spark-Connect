// useCoinBalance — server-authoritative coin balance + spend/earn.
// All changes go through the adjust_coin_balance RPC (see migration
// 20260729000002_profiles_security_hardening.sql) — the database
// rejects any direct client UPDATE of profiles.coin_balance, so this
// hook is the only supported way to move coins for a user.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useCoinBalance(userId: string | null | undefined) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) { setBalance(null); return; }
    setLoading(true);
    const { data } = await db.from('profiles').select('coin_balance').eq('id', userId).maybeSingle();
    setBalance(data?.coin_balance ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Spend coins (e.g. gifts, tips). Returns false if the balance was
  // insufficient — the RPC rejects the change atomically server-side,
  // it isn't just a client-side check.
  const spend = useCallback(async (amount: number, reason?: string): Promise<boolean> => {
    if (!userId || amount <= 0) return false;
    const { data, error } = await db.rpc('adjust_coin_balance', { p_delta: -amount, p_reason: reason ?? null });
    if (error) return false;
    setBalance(data as number);
    return true;
  }, [userId]);

  // Credit coins after a VERIFIED earning event (e.g. a payment
  // provider's server-side webhook, or a signup bonus granted by
  // trusted server logic) — never call this directly from a client
  // "payment succeeded" callback with no real verification behind it,
  // that would just let anyone mint free coins for themselves.
  const earn = useCallback(async (amount: number, reason?: string): Promise<number | null> => {
    if (!userId || amount <= 0) return null;
    const { data, error } = await db.rpc('adjust_coin_balance', { p_delta: amount, p_reason: reason ?? null });
    if (error) return null;
    setBalance(data as number);
    return data as number;
  }, [userId]);

  // Earn a small, server-capped amount of coins for watching a
  // rewarded ad (see migration 20260730000001_ad_coin_rewards.sql —
  // 20 coins/watch, hard cap of 5 claims/day enforced in the RPC
  // itself via rate_limits, not just a client-side timer). Throws a
  // readable error (e.g. daily limit reached) the caller can show.
  const claimAdReward = useCallback(async (): Promise<{ balance: number } | { error: string }> => {
    if (!userId) return { error: 'Musisz być zalogowany/a' };
    const { data, error } = await db.rpc('claim_ad_coins');
    if (error) return { error: error.message?.includes('limit') ? 'Dzienny limit reklam osiągnięty — wróć jutro po więcej coinów.' : 'Nie udało się przyznać nagrody.' };
    setBalance(data as number);
    return { balance: data as number };
  }, [userId]);

  return { balance, loading, spend, earn, claimAdReward, refetch };
}
