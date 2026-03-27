// get-private-photo-url — Supabase Edge Function
// Generates a short-lived signed URL for a private R2 photo.
// Verifies the requesting user has 'granted' access before issuing.
//
// Deploy: supabase functions deploy get-private-photo-url

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Build a presigned GET URL valid for 3600 seconds
async function generateSignedGetUrl(opts: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  expiresIn?: number;
}): Promise<string> {
  const { accountId, accessKeyId, secretAccessKey, bucket, key, expiresIn = 3600 } = opts;
  const region = "auto";
  const service = "s3";

  const now = new Date();
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzdate   = now.toISOString().replace(/[:-]/g, "").slice(0, 15) + "Z";
  const host       = `${accountId}.r2.cloudflarestorage.com`;
  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm":     "AWS4-HMAC-SHA256",
    "X-Amz-Credential":    credential,
    "X-Amz-Date":          amzdate,
    "X-Amz-Expires":       String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  });
  queryParams.sort();

  const canonicalRequest = [
    "GET",
    `/${bucket}/${key}`,
    queryParams.toString(),
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

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
  for (const part of [datestamp, region, service, "aws4_request"]) {
    signingKey = await hmac(signingKey, part);
  }
  const signature = toHex(await hmac(signingKey, stringToSign));
  queryParams.set("X-Amz-Signature", signature);

  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}?${queryParams.toString()}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

  // Authenticate user
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });

  const { key, photo_id } = await req.json() as { key?: string; photo_id?: string };

  // Use service role to bypass RLS for cross-user check
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let photoKey = key;

  // If photo_id provided, look up the key and verify access
  if (photo_id && !key) {
    const { data: photo } = await supabase
      .from("private_photos")
      .select("key, user_id")
      .eq("id", photo_id)
      .single();

    if (!photo) return new Response(JSON.stringify({ error: "Photo not found" }), { status: 404, headers: cors });

    // Own photo — always allowed
    if (photo.user_id !== user.id) {
      // Check if requester has granted access
      const { data: access } = await supabase
        .from("private_photo_requests")
        .select("status")
        .eq("requester_id", user.id)
        .eq("owner_id", photo.user_id)
        .eq("status", "granted")
        .maybeSingle();

      if (!access) {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: cors });
      }
    }

    photoKey = photo.key;
  }

  if (!photoKey) return new Response(JSON.stringify({ error: "key or photo_id required" }), { status: 400, headers: cors });

  try {
    const signedUrl = await generateSignedGetUrl({
      accountId:          Deno.env.get("R2_ACCOUNT_ID")!,
      accessKeyId:        Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey:    Deno.env.get("R2_SECRET_ACCESS_KEY")!,
      bucket:             Deno.env.get("R2_PRIVATE_BUCKET")!,
      key:                photoKey,
      expiresIn:          3600, // 1 hour
    });

    return new Response(
      JSON.stringify({ signedUrl }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Signed URL error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate signed URL" }), { status: 500, headers: cors });
  }
});
