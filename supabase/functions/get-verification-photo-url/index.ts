// get-verification-photo-url — Supabase Edge Function
// Admin-only: generates a short-lived signed URL for a submitted
// face-verification selfie so it can be reviewed in AdminPanel.
//
// Deploy: supabase functions deploy get-verification-photo-url

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateSignedGetUrl(opts: {
  accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; key: string; expiresIn?: number;
}): Promise<string> {
  const { accountId, accessKeyId, secretAccessKey, bucket, key, expiresIn = 3600 } = opts;
  const region = "auto";
  const service = "s3";
  const now = new Date();
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzdate = now.toISOString().replace(/[:-]/g, "").slice(0, 15) + "Z";
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzdate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  });
  queryParams.sort();

  const canonicalRequest = ["GET", `/${bucket}/${key}`, queryParams.toString(), `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");

  function toHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function hmac(keyBuf: ArrayBuffer, data: string): Promise<ArrayBuffer> {
    const k = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
  }

  const hash = toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest)));
  const stringToSign = ["AWS4-HMAC-SHA256", amzdate, credentialScope, hash].join("\n");

  let signingKey: ArrayBuffer = new TextEncoder().encode(`AWS4${secretAccessKey}`).buffer;
  for (const part of [datestamp, region, service, "aws4_request"]) signingKey = await hmac(signingKey, part);
  const signature = toHex(await hmac(signingKey, stringToSign));
  queryParams.set("X-Amz-Signature", signature);

  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}?${queryParams.toString()}`;
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

  const { requestId } = await req.json() as { requestId?: string };
  if (!requestId) return new Response(JSON.stringify({ error: "requestId required" }), { status: 400, headers: cors });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: isAdmin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!isAdmin) return new Response(JSON.stringify({ error: "Admins only" }), { status: 403, headers: cors });

  const { data: reqRow } = await supabase.from("verification_requests").select("photo_key").eq("id", requestId).maybeSingle();
  if (!reqRow) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: cors });

  try {
    const signedUrl = await generateSignedGetUrl({
      accountId: Deno.env.get("R2_ACCOUNT_ID")!,
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
      bucket: Deno.env.get("R2_PRIVATE_BUCKET")!,
      key: reqRow.photo_key,
      expiresIn: 3600,
    });
    return new Response(JSON.stringify({ signedUrl }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Signed URL error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate signed URL" }), { status: 500, headers: cors });
  }
});
