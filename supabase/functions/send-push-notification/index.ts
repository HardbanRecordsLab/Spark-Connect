import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal VAPID JWT generation using Web Crypto API
async function generateVapidJWT(audience: string, subject: string, privateKeyJwk: JsonWebKey): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const unsigned = `${encode(header)}.${encode(payload)}`;
  const key = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return `${unsigned}.${sigB64}`;
}

// Only these in-app deep links may be used — client-supplied URLs are
// never trusted directly (that would let anyone phish via a fake
// "new match" push pointing anywhere they like).
const ALLOWED_URLS = new Set(["/", "/?tab=chats", "/?tab=discover"]);

function sanitizeText(input: unknown, maxLen: number): string {
  const s = typeof input === "string" ? input : "";
  // eslint-disable-next-line no-control-regex
  return s.replace(/<[^>]*>/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, maxLen);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body_ = await req.json();
    const user_id: string | undefined = body_.user_id;
    const tag: string | undefined = body_.tag;
    const title = sanitizeText(body_.title, 80) || "Spark Connect";
    const notifBody = sanitizeText(body_.body, 160);
    const url = ALLOWED_URLS.has(body_.url) ? body_.url : "/";

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authorization: you may only trigger a push for yourself, or for
    // someone you're actually matched with (the two real use cases —
    // "you got a new match" / "you got a new message"). This stops
    // any authenticated stranger from pushing arbitrary notifications
    // to an arbitrary account.
    if (user_id !== caller.id) {
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user1_id.eq.${caller.id},user2_id.eq.${user_id}),and(user1_id.eq.${user_id},user2_id.eq.${caller.id})`)
        .maybeSingle();
      if (!match) {
        return new Response(JSON.stringify({ error: "Not authorized to notify this user" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch all subscriptions for this user
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (error || !subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY_JWK = Deno.env.get("VAPID_PRIVATE_KEY_JWK");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:spark-connect@hardbanrecordslab.online";

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY_JWK) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateKeyJwk = JSON.parse(VAPID_PRIVATE_KEY_JWK) as JsonWebKey;
    const notification = JSON.stringify({ title, body: notifBody, url, tag: tag || "spark-connect" });

    let sent = 0;
    const expired: string[] = [];

    for (const sub of subs) {
      try {
        const audience = new URL(sub.endpoint).origin;
        const jwt = await generateVapidJWT(audience, VAPID_SUBJECT, privateKeyJwk);
        const authHeader = `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`;

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/octet-stream",
            "TTL": "86400",
          },
          body: new TextEncoder().encode(notification),
        });

        if (response.status === 410 || response.status === 404) {
          expired.push(sub.endpoint);
        } else if (response.ok || response.status === 201) {
          sent++;
        }
      } catch {
        // skip failed subscriptions
      }
    }

    // Remove expired subscriptions
    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expired);
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
