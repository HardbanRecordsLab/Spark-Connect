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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, title, body, url, tag } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@ignite.app";

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY_JWK) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateKeyJwk = JSON.parse(VAPID_PRIVATE_KEY_JWK) as JsonWebKey;
    const notification = JSON.stringify({ title, body, url: url || "/", tag: tag || "ignite" });

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
