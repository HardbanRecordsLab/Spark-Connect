// check-admin — Supabase Edge Function
// Checks if a user has admin privileges by querying the admin_users table
//
// Deploy: supabase functions deploy check-admin
//
// Returns: { isAdmin: boolean, role: string | null }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...cors, "Content-Type": "application/json" } 
    });
  }

  // Extract and verify auth token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { ...cors, "Content-Type": "application/json" } 
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { 
      status: 401, 
      headers: { ...cors, "Content-Type": "application/json" } 
    });
  }

  // Query admin_users table to check admin status
  const { data: adminData, error: dbError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (dbError) {
    console.error("Database error checking admin status:", dbError);
    return new Response(JSON.stringify({ error: "Database error" }), { 
      status: 500, 
      headers: { ...cors, "Content-Type": "application/json" } 
    });
  }

  const isAdmin = !!adminData;
  const role = adminData?.role || null;

  return new Response(JSON.stringify({ isAdmin, role }), { 
    headers: { ...cors, "Content-Type": "application/json" } 
  });
});
