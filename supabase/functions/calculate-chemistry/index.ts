import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Chemistry score weights ────────────────────────────────────
// Total max = 100
const W = {
  sharedInterests:  20,  // per shared interest, capped
  ageProximity:     15,  // closer age = higher score
  sameTimeActive:   15,  // both active in same hour-of-day
  mutualSuperLike:  25,  // both super-liked each other
  profileComplete:  10,  // their profile is 100% filled
  verifiedBonus:     5,  // they're face-verified
  recentActivity:   10,  // active in last 7 days
};

function clamp(val: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, val));
}

function calcSharedInterests(a: string[], b: string[]): number {
  const setB = new Set(b.map(s => s.toLowerCase()));
  const shared = a.filter(s => setB.has(s.toLowerCase())).length;
  // 3+ shared = full points, linear below
  return clamp(Math.round((shared / 3) * W.sharedInterests), 0, W.sharedInterests);
}

function calcAgeProximity(ageA: number, ageB: number): number {
  const diff = Math.abs(ageA - ageB);
  if (diff <= 2)  return W.ageProximity;
  if (diff <= 5)  return Math.round(W.ageProximity * 0.8);
  if (diff <= 10) return Math.round(W.ageProximity * 0.5);
  if (diff <= 15) return Math.round(W.ageProximity * 0.2);
  return 0;
}

function calcTimeOverlap(activeHoursA: number[], activeHoursB: number[]): number {
  const setB = new Set(activeHoursB);
  const overlap = activeHoursA.filter(h => setB.has(h)).length;
  return overlap > 0 ? W.sameTimeActive : 0;
}

function calcProfileCompleteness(profile: Record<string, unknown>): number {
  const fields = ["display_name", "age", "bio", "city", "photos", "interests", "gender", "mood_status"];
  const filled = fields.filter(f => {
    const v = profile[f];
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && v !== "";
  }).length;
  return clamp(Math.round((filled / fields.length) * W.profileComplete), 0, W.profileComplete);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // This is a nightly batch job meant to be triggered exclusively by
  // pg_cron with the service role key (see migration
  // 20260317000007 / KROK 6e in LAUNCH_GUIDE.md) — it recomputes
  // chemistry scores for every profile pair (O(n^2)) and was
  // previously callable by anyone with just the public anon key,
  // making it a cheap, unauthenticated way to hammer the database.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Forbidden — service role only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey
  );

  try {
    // Get all profiles
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, age, interests, is_verified, bio, city, photos, display_name, gender, mood_status, profile_complete")
      .eq("profile_complete", true);

    if (profErr || !profiles) throw new Error("Failed to fetch profiles: " + profErr?.message);

    // Get super likes
    const { data: superLikes } = await supabase
      .from("swipes")
      .select("swiper_id, swiped_id")
      .eq("is_super", true);

    // Get recent activity (messages sent in last 7 days → approximate active hours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: recentMsgs } = await supabase
      .from("messages")
      .select("sender_id, created_at")
      .gte("created_at", sevenDaysAgo);

    // Build active-hours map: userId → Set<hourOfDay>
    const activeHours: Record<string, number[]> = {};
    for (const msg of (recentMsgs ?? [])) {
      const h = new Date(msg.created_at).getHours();
      if (!activeHours[msg.sender_id]) activeHours[msg.sender_id] = [];
      if (!activeHours[msg.sender_id].includes(h)) activeHours[msg.sender_id].push(h);
    }

    // Build super-like lookup
    const superLikeSet = new Set<string>();
    for (const sl of (superLikes ?? [])) {
      superLikeSet.add(`${sl.swiper_id}:${sl.swiped_id}`);
    }

    // For each profile pair, compute chemistry and upsert
    const updates: { user_a: string; user_b: string; score: number }[] = [];

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const a = profiles[i];
        const b = profiles[j];

        let score = 0;

        // Shared interests
        score += calcSharedInterests(a.interests ?? [], b.interests ?? []);

        // Age proximity
        if (a.age && b.age) score += calcAgeProximity(a.age, b.age);

        // Same active hours
        score += calcTimeOverlap(activeHours[a.id] ?? [], activeHours[b.id] ?? []);

        // Mutual super likes
        const abSuper = superLikeSet.has(`${a.id}:${b.id}`);
        const baSuper = superLikeSet.has(`${b.id}:${a.id}`);
        if (abSuper && baSuper) score += W.mutualSuperLike;
        else if (abSuper || baSuper) score += Math.round(W.mutualSuperLike * 0.4);

        // Profile completeness (average of both)
        const compA = calcProfileCompleteness(a as Record<string, unknown>);
        const compB = calcProfileCompleteness(b as Record<string, unknown>);
        score += Math.round((compA + compB) / 2);

        // Verified bonus
        if (a.is_verified && b.is_verified) score += W.verifiedBonus;
        else if (a.is_verified || b.is_verified) score += Math.round(W.verifiedBonus * 0.5);

        // Recent activity (both active in last 7 days)
        const aActive = (activeHours[a.id]?.length ?? 0) > 0;
        const bActive = (activeHours[b.id]?.length ?? 0) > 0;
        if (aActive && bActive) score += W.recentActivity;
        else if (aActive || bActive) score += Math.round(W.recentActivity * 0.5);

        const finalScore = clamp(score, 40, 99); // floor 40 so no-one shows 0%
        updates.push({ user_a: a.id, user_b: b.id, score: finalScore });
      }
    }

    // Batch upsert in chunks of 500
    const CHUNK = 500;
    for (let k = 0; k < updates.length; k += CHUNK) {
      const chunk = updates.slice(k, k + CHUNK);
      await supabase.from("chemistry_scores").upsert(chunk, { onConflict: "user_a,user_b" });
    }

    return new Response(
      JSON.stringify({ ok: true, pairs: updates.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
