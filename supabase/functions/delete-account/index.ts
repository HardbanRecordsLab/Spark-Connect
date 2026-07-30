import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Settings previously claimed "permanently delete all your data" and only
// called supabase.auth.signOut() -- nothing was ever actually deleted, so
// a returning user's account, matches, messages and photos were all still
// there. This function does the real thing: purge storage objects, then
// delete the auth user, which cascades through every FK'd table
// (profiles.id references auth.users(id) ON DELETE CASCADE, and every
// other user-owned table references profiles(id) ON DELETE CASCADE too).
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const uid = user.id;

  try {
    // Best-effort storage cleanup — failures here must not block account
    // deletion (an orphaned file is a lesser problem than a fake "deleted"
    // account that's still fully intact).
    for (const bucket of ["avatars", "photos"]) {
      const { data: files } = await supabase.storage.from(bucket).list(uid);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${uid}/${f.name}`);
        await supabase.storage.from(bucket).remove(paths);
      }
    }

    const { error: delErr } = await supabase.auth.admin.deleteUser(uid);
    if (delErr) throw delErr;

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
