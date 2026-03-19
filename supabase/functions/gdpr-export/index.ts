import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Validate auth — user can only export their own data
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
    // Collect all user data in parallel
    const [
      profileRes,
      settingsRes,
      swipesGivenRes,
      swipesReceivedRes,
      matchesRes,
      messagesRes,
      reactionsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.from("user_settings").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("swipes").select("*").eq("swiper_id", uid),
      supabase.from("swipes").select("*").eq("swiped_id", uid),
      supabase.from("matches")
        .select("*")
        .or(`user1_id.eq.${uid},user2_id.eq.${uid}`),
      supabase.from("messages").select("*").eq("sender_id", uid),
      supabase.from("reactions").select("*").eq("user_id", uid),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: uid,
      email: user.email,
      account_created: user.created_at,
      // Personal data
      profile: profileRes.data ?? null,
      privacy_settings: settingsRes.data ?? null,
      // Activity data
      swipes_given: swipesGivenRes.data ?? [],
      swipes_received_count: swipesReceivedRes.data?.length ?? 0, // count only, not who
      matches: matchesRes.data ?? [],
      messages_sent: messagesRes.data ?? [],
      reactions_given: reactionsRes.data ?? [],
      // Metadata
      gdpr_note: "This export contains all personal data held by Spark Connect for your account, as required by GDPR Article 20. Data will be permanently deleted within 30 days of an erasure request per Article 17.",
    };

    // Store export as a file in Supabase Storage for 7 days
    const filename = `gdpr-export-${uid}-${Date.now()}.json`;
    const jsonBytes = new TextEncoder().encode(JSON.stringify(exportData, null, 2));

    const { data: uploadData, error: uploadErr } = await supabase
      .storage
      .from("gdpr-exports")
      .upload(filename, jsonBytes, {
        contentType: "application/json",
        upsert: false,
      });

    let downloadUrl = null;
    if (!uploadErr && uploadData) {
      // Create a signed URL valid for 1 hour
      const { data: signedUrl } = await supabase
        .storage
        .from("gdpr-exports")
        .createSignedUrl(filename, 3600);
      downloadUrl = signedUrl?.signedUrl ?? null;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        download_url: downloadUrl,
        // Also return inline if storage fails
        data: downloadUrl ? null : exportData,
        expires_in: "1 hour",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
