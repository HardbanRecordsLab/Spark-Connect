import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AdminPanel's user list was showing a fabricated `user_XXXXXX@spark.app`
// string for every single user (profiles has no email column -- it lives
// in auth.users, which the client can't query directly). An admin trying
// to identify or contact a real user via that "email" was looking at a
// made-up value that happened to look plausible. This returns real emails
// for a given set of user ids, service-role only, admin-gated.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: adminRow } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  if (!adminRow) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
  }

  try {
    const { userIds } = await req.json() as { userIds: string[] };
    const wanted = new Set((userIds ?? []).filter(Boolean));
    const emails: Record<string, string> = {};

    // admin.listUsers is paginated; walk pages until every requested id
    // is resolved or we run out of users.
    let page = 1;
    const perPage = 1000;
    while (wanted.size > Object.keys(emails).length) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error || !data?.users?.length) break;
      for (const u of data.users) {
        if (wanted.has(u.id) && u.email) emails[u.id] = u.email;
      }
      if (data.users.length < perPage) break;
      page++;
    }

    return new Response(JSON.stringify({ emails }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors });
  }
});
