// send-email — Supabase Edge Function
// Sends branded transactional emails via MailerLite API.
//
// Deploy: supabase functions deploy send-email
// Secrets: supabase secrets set MAILERLITE_API_KEY=ml_xxxxxxxxxxxx

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "no-reply@hardbanrecordslab.online";
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

// ── Templates (Bez zmian w treści) ─────────────────────────────────────────────
const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: "Witaj w Spark Connect 🔥",
    html: layout("Witaj w Spark Connect", `
      <h2>Cześć, ${d.name}! 👋</h2>
      <p>Cieszemy się że jesteś z nami. Spark Connect to pierwsza w Polsce w pełni darmowa aplikacja randkowa 18+.</p>
      <div style="text-align:center;margin:24px 0"><a href="${APP_URL}" class="btn">Uzupełnij profil →</a></div>
      <p style="font-size:13px;color:#888">Pamiętaj: Twój profil wymaga weryfikacji przez administratora zanim będzie widoczny dla innych.</p>
    `),
  }),
  "new-match": (d) => ({
    subject: `Nowe dopasowanie z ${d.matchName} 🔥`,
    html: layout("Nowe dopasowanie!", `
      <h2>Macie chemię! 💘</h2>
      <p>Ty i <strong>${d.matchName}</strong> (${d.matchAge} lat, ${d.matchCity}) polubiliście się wzajemnie.</p>
      <div style="text-align:center;margin:24px 0"><a href="${APP_URL}?tab=chats" class="btn">Napisz do ${d.matchName} →</a></div>
    `),
  }),
  "profile-view": (d) => ({
    subject: `${d.viewerName} odwiedził/a Twój profil 👀`,
    html: layout("Ktoś Cię sprawdził", `
      <h2>${d.viewerName} zajrzał/a na Twój profil 👀</h2>
      <div style="text-align:center;margin:24px 0"><a href="${APP_URL}" class="btn">Sprawdź kto Cię odwiedził →</a></div>
    `),
  }),
};

// ── MailerLite API call ────────────────────────────────────────────
async function sendEmail(opts: { to: string; subject: string; html: string }) {
  // @ts-ignore
  const apiKey = Deno.env.get("MAILERLITE_API_KEY");
  if (!apiKey) throw new Error("MAILERLITE_API_KEY not set in Supabase Secrets");

  const res = await fetch("https://connect.mailerlite.com/api/emails/transactional", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      from: {
        email: FROM_EMAIL,
        name:  FROM_NAME,
      },
      to:       opts.to,
      subject:  opts.subject,
      html:     opts.html,
      reply_to: REPLY_TO,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MailerLite error ${res.status}: ${err}`);
  }
  return res.json();
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

  const body = await req.json() as { template: string; to: string; data?: Record<string, string> };
  const tpl = templates[body.template];
  
  if (!tpl) return new Response(JSON.stringify({ error: `Unknown template: ${body.template}` }), { status: 400, headers: cors });

  try {
    const { subject, html } = tpl(body.data ?? {});
    const result = await sendEmail({ to: body.to, subject, html });
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors });
  }
});
