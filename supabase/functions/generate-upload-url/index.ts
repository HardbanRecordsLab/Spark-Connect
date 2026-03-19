// generate-upload-url — Supabase Edge Function
// Generates a presigned PUT URL for Cloudflare R2 so the browser
// can upload files directly without exposing R2 secret keys in JS.
//
// Deploy: supabase functions deploy generate-upload-url
// Secrets needed (set via: supabase secrets set KEY=value):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//   R2_PUBLIC_BUCKET   (e.g. spark-avatars)
//   R2_CHAT_BUCKET     (e.g. spark-chat-media)
//   R2_PRIVATE_BUCKET  (e.g. spark-private)
//   R2_PUBLIC_URL      (e.g. https://media.hardbanrecordslab.online)
//   R2_CHAT_URL        (e.g. https://chat.hardbanrecordslab.online)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── HMAC-SHA256 helper (Web Crypto — available in Deno) ───────────────────────
async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function toUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// ── AWS Signature v4 presigned URL ────────────────────────────────────────────
async function generatePresignedUrl(opts: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 120
}): Promise<string> {
  const { accountId, accessKeyId, secretAccessKey, bucket, key, contentType } = opts;
  const expiresIn = opts.expiresIn ?? 120;

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";

  const now = new Date();
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const amzdate = now.toISOString().replace(/[:-]/g, "").slice(0, 15) + "Z"; // YYYYMMDDTHHmmssZ

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzdate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": signedHeaders,
    "x-amz-checksum-crc32": "", // will be replaced
  });
  // Remove empty param
  queryParams.delete("x-amz-checksum-crc32");

  // Add content type as query param so it's validated on upload
  queryParams.set("X-Amz-Content-Type", contentType);
  // Sort params alphabetically for canonical string
  queryParams.sort();

  const canonicalRequest = [
    "PUT",
    `/${bucket}/${key}`,
    queryParams.toString(),
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzdate,
    credentialScope,
    hex(await crypto.subtle.digest("SHA-256", toUint8Array(canonicalRequest))),
  ].join("\n");

  // Derive signing key: HMAC(HMAC(HMAC(HMAC("AWS4"+secret,date),region),service),"aws4_request")
  let signingKey: ArrayBuffer = toUint8Array(`AWS4${secretAccessKey}`).buffer;
  for (const part of [datestamp, region, service, "aws4_request"]) {
    signingKey = await hmac(signingKey, part);
  }
  const signature = hex(await hmac(signingKey, stringToSign));

  queryParams.set("X-Amz-Signature", signature);

  return `${endpoint}/${bucket}/${key}?${queryParams.toString()}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Verify auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });

  const body = await req.json() as {
    bucket: "avatars" | "chat-media" | "private";
    filename: string;
    contentType: string;
  };

  const { bucket: bucketAlias, filename, contentType } = body;

  // Map alias → real bucket name and public URL base
  const R2_ACCOUNT_ID      = Deno.env.get("R2_ACCOUNT_ID")!;
  const R2_ACCESS_KEY_ID   = Deno.env.get("R2_ACCESS_KEY_ID")!;
  const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;

  const BUCKET_MAP: Record<string, { bucket: string; publicUrl: string | null }> = {
    "avatars":    { bucket: Deno.env.get("R2_PUBLIC_BUCKET")!,  publicUrl: Deno.env.get("R2_PUBLIC_URL")! },
    "chat-media": { bucket: Deno.env.get("R2_CHAT_BUCKET")!,    publicUrl: Deno.env.get("R2_CHAT_URL")! },
    "private":    { bucket: Deno.env.get("R2_PRIVATE_BUCKET")!, publicUrl: null }, // signed URLs only
  };

  const mapped = BUCKET_MAP[bucketAlias];
  if (!mapped) return new Response(JSON.stringify({ error: "Unknown bucket" }), { status: 400, headers: cors });

  // Sanitize filename and scope to user
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ["jpg","jpeg","png","webp","gif","mp4","mov","webm","m4a","ogg","mp3"].includes(ext) ? ext : "bin";
  const key = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${safeExt}`;

  // Validate content type
  const allowedTypes = [
    "image/jpeg","image/png","image/webp","image/gif",
    "video/mp4","video/quicktime","video/webm",
    "audio/mpeg","audio/ogg","audio/mp4","audio/webm",
  ];
  if (!allowedTypes.includes(contentType)) {
    return new Response(JSON.stringify({ error: "Content type not allowed" }), { status: 400, headers: cors });
  }

  // Max size check (passed as header from client — actual enforcement is in R2 bucket policy)
  const maxBytes = bucketAlias === "chat-media" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

  try {
    const presignedUrl = await generatePresignedUrl({
      accountId:       R2_ACCOUNT_ID,
      accessKeyId:     R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket:          mapped.bucket,
      key,
      contentType,
      expiresIn: 120,
    });

    const publicUrl = mapped.publicUrl ? `${mapped.publicUrl}/${key}` : null;

    return new Response(JSON.stringify({
      presignedUrl,  // PUT to this URL with Content-Type header
      publicUrl,     // Store this in DB (null for private bucket)
      key,           // R2 object key (needed for signed URL requests)
      maxBytes,
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("R2 presign error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate upload URL" }), { status: 500, headers: cors });
  }
});
