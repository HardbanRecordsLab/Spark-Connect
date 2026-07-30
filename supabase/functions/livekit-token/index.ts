// livekit-token — Supabase Edge Function
// Mints a short-lived LiveKit access token (JWT, HS256) for a video
// room the caller is actually authorized to join. The room name is
// always derived and verified server-side from a matchId or
// rouletteSessionId — callers can never pick an arbitrary room name,
// which would otherwise let anyone join any ongoing call.
//
// Deploy: supabase functions deploy livekit-token
// Secrets: LIVEKIT_API_KEY, LIVEKIT_API_SECRET (already configured)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signLiveKitJwt(apiKey: string, apiSecret: string, payload: Record<string, unknown>): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    iss: apiKey,
    nbf: now - 10,
    exp: now + 60 * 60, // 1 hour — a call shouldn't need a fresh token more often than that
    ...payload,
  };
  const enc = (obj: unknown) => base64url(new TextEncoder().encode(JSON.stringify(obj)));
  const unsigned = `${enc(header)}.${enc(body)}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64url(new Uint8Array(sig))}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });

  const { matchId, rouletteSessionId } = await req.json() as { matchId?: string; rouletteSessionId?: string };
  if (!matchId && !rouletteSessionId) {
    return new Response(JSON.stringify({ error: "matchId or rouletteSessionId required" }), { status: 400, headers: cors });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let roomName: string;

  if (matchId) {
    const { data: match } = await supabase.from("matches").select("id, user1_id, user2_id").eq("id", matchId).maybeSingle();
    if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) {
      return new Response(JSON.stringify({ error: "Not authorized for this match" }), { status: 403, headers: cors });
    }
    roomName = `match-${match.id}`;
  } else {
    const { data: session } = await supabase
      .from("roulette_sessions")
      .select("id, user_a, user_b, status")
      .eq("id", rouletteSessionId)
      .maybeSingle();
    if (!session || (session.user_a !== user.id && session.user_b !== user.id) || session.status !== "active") {
      return new Response(JSON.stringify({ error: "Not authorized for this session" }), { status: 403, headers: cors });
    }
    roomName = `roulette-${session.id}`;
  }

  const apiKey = Deno.env.get("LIVEKIT_API_KEY");
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
  const wsUrl = Deno.env.get("LIVEKIT_HOST") ?? Deno.env.get("VITE_LIVEKIT_HOST");
  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "LiveKit not configured" }), { status: 500, headers: cors });
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();

  const token = await signLiveKitJwt(apiKey, apiSecret, {
    sub: user.id,
    name: profile?.display_name ?? "User",
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  });

  return new Response(JSON.stringify({ token, wsUrl, roomName }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
