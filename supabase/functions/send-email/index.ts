// send-email — Supabase Edge Function
// Sends branded transactional emails via SMTP (home.pl mailbox).
//
// Deploy: supabase functions deploy send-email
// Secrets:
//   supabase secrets set SMTP_HOST=poczta2663497.home.pl
//   supabase secrets set SMTP_PORT=465
//   supabase secrets set SMTP_USER=spark-connect@hardbanrecordslab.online
//   supabase secrets set SMTP_PASSWORD=xxxxxxxx

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "spark-connect@hardbanrecordslab.online";
const FROM_NAME  = "Spark Connect";
const REPLY_TO   = "spark-connect@hardbanrecordslab.online";
const APP_URL    = "https://spark-connect.hardbanrecordslab.online";
const LOGO_URL   = `${APP_URL}/icon-192.png`;

// ── Email HTML wrapper (Zoptymalizowany pod MailerLite) ─────────────────────────
function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e8e6de}
  .wrap{max-width:560px;margin:0 auto;padding:32px 16px}
  .card{background:#141420;border:1px solid #2a2a3a;border-radius:16px;padding:32px;margin:24px 0}
  .logo{text-align:center;margin-bottom:24px}
  .logo img{width:64px;height:64px;border-radius:16px}
  .logo h1{margin:8px 0 0;font-size:22px;background:linear-gradient(135deg,#ff4d6d,#ff8c42);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  h2{font-size:20px;margin:0 0 12px;color:#fff}
  p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#b0aeb8}
  .btn{display:inline-block;background:linear-gradient(135deg,#ff1a4e,#ff6b35);color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin:8px 0}
  .footer{text-align:center;font-size:12px;color:#555;margin-top:24px}
  .footer a{color:#ff4d6d;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">
    <img src="${LOGO_URL}" alt="Spark Connect"/>
    <h1>Spark Connect 🔥</h1>
  </div>
  <div class="card">${body}</div>
  <div class="footer">
    <p>© 2026 Spark Connect · <a href="${APP_URL}/privacy">Polityka Prywatności</a> · <a href="${APP_URL}/terms">Regulamin</a></p>
    <p>Masz pytania? <a href="mailto:${REPLY_TO}">${REPLY_TO}</a></p>
  </div>
</div>
</body>
</html>`;
}

// HTML-escape any value interpolated into a template — data.* used to be
// inserted into the email body raw, so any caller could inject arbitrary
// markup into a mail sent from a trusted domain.
function esc(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ── Templates (Bez zmian w treści) ─────────────────────────────────────────────
const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: "Witaj w Spark Connect 🔥",
    html: layout("Witaj w Spark Connect", `
      <h2>Cześć, ${esc(d.name)}! 👋</h2>
      <p>Cieszemy się że jesteś z nami. Spark Connect to pierwsza w Polsce w pełni darmowa aplikacja randkowa 18+.</p>
      <div style="text-align:center;margin:24px 0"><a href="${APP_URL}" class="btn">Uzupełnij profil →</a></div>
      <p style="font-size:13px;color:#888">Pamiętaj: Twój profil wymaga weryfikacji przez administratora zanim będzie widoczny dla innych.</p>
    `),
  }),
  "new-match": (d) => ({
    subject: `Nowe dopasowanie z ${esc(d.matchName)} 🔥`,
    html: layout("Nowe dopasowanie!", `
      <h2>Macie chemię! 💘</h2>
      <p>Ty i <strong>${esc(d.matchName)}</strong> (${esc(d.matchAge)} lat, ${esc(d.matchCity)}) polubiliście się wzajemnie.</p>
      <div style="text-align:center;margin:24px 0"><a href="${APP_URL}?tab=chats" class="btn">Napisz do ${esc(d.matchName)} →</a></div>
    `),
  }),
  "profile-view": (d) => ({
    subject: `${esc(d.viewerName)} odwiedził/a Twój profil 👀`,
    html: layout("Ktoś Cię sprawdził", `
      <h2>${esc(d.viewerName)} zajrzał/a na Twój profil 👀</h2>
      <div style="text-align:center;margin:24px 0"><a href="${APP_URL}" class="btn">Sprawdź kto Cię odwiedził →</a></div>
    `),
  }),
};

// ── SMTP (home.pl mailbox) ───────────────────────────────────────
async function sendEmail(opts: { to: string; subject: string; html: string }) {
  // @ts-ignore
  const host = Deno.env.get("SMTP_HOST");
  // @ts-ignore
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  // @ts-ignore
  const username = Deno.env.get("SMTP_USER");
  // @ts-ignore
  const password = Deno.env.get("SMTP_PASSWORD");

  if (!host || !username || !password) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASSWORD not set in Supabase Secrets");
  }

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      // Port 465 is implicit TLS; 587 is STARTTLS — denomailer's `tls`
      // flag means "connect with TLS from the start", so only set it
      // for the 465 case.
      tls: port === 465,
      auth: { username, password },
    },
  });

  try {
    await client.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: opts.to,
      replyTo: REPLY_TO,
      subject: opts.subject,
      content: "auto",
      html: opts.html,
    });
  } finally {
    await client.close();
  }

  return { id: crypto.randomUUID() };
}

// ── Handler ────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

  const supabase = createClient(
    // @ts-ignore
    Deno.env.get("SUPABASE_URL")!,
    // @ts-ignore
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

  const body = await req.json() as { template: string; to?: string; data?: Record<string, string> };
  const tpl = templates[body.template];

  if (!tpl) return new Response(JSON.stringify({ error: `Unknown template: ${body.template}` }), { status: 400, headers: cors });

  // The recipient is always the authenticated caller's own verified email —
  // never the client-supplied `to`. This used to accept an arbitrary
  // recipient, turning this into an open relay for phishing emails sent
  // from a trusted domain. When a template needs to notify someone ELSE
  // (e.g. "X viewed your profile"), that must be triggered server-side
  // (cron/DB trigger/service role), not by the viewer's own client.
  if (!user.email) {
    return new Response(JSON.stringify({ error: "No verified email on account" }), { status: 400, headers: cors });
  }

  try {
    const { subject, html } = tpl(body.data ?? {});
    const result = await sendEmail({ to: user.email, subject, html });
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors });
  }
});
