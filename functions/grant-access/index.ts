import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: callerAuth } = await callerClient.auth.getUser();
    const callerEmail = callerAuth?.user?.email;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerProfile } = await admin
      .from("users")
      .select("role")
      .eq("id", callerAuth?.user?.id)
      .single();

    const isAdmin =
      callerEmail === "avivbenor1@gmail.com" || callerProfile?.role === "admin";
    if (!isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    const { email, full_name } = await req.json();
    if (!email) return json({ error: "Missing email" }, 400);

    const password =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-4).toUpperCase() +
      "!1";

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: full_name ? { full_name } : undefined,
      });

    let userId = created?.user?.id;

    if (createErr) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      if (!existing) return json({ error: createErr.message }, 400);
      userId = existing.id;
    }

    const { error: upsertErr } = await admin.from("users").upsert(
      {
        id: userId,
        email,
        full_name: full_name || null,
        subscription_status: "active",
        role: "user",
      },
      { onConflict: "id" }
    );

    if (upsertErr) return json({ error: upsertErr.message }, 500);

    return json({
      success: true,
      email,
      password: createErr ? null : password,
      existed: !!createErr,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
