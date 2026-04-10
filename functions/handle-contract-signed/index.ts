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
    const { contract_id, signed_contract_id, client_name } = await req.json();

    if (!contract_id || !signed_contract_id || !client_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify contract exists
    const { data: contract, error: contractErr } = await supabase
      .from("contracts")
      .select("id, name, created_by, status")
      .eq("id", contract_id)
      .single();

    if (contractErr || !contract) {
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signed_contract exists and matches
    const { data: signed, error: signedErr } = await supabase
      .from("signed_contracts")
      .select("id, contract_id")
      .eq("id", signed_contract_id)
      .eq("contract_id", contract_id)
      .single();

    if (signedErr || !signed) {
      return new Response(
        JSON.stringify({ error: "Signed contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update contract status to signed
    await supabase
      .from("contracts")
      .update({ status: "signed" })
      .eq("id", contract_id);

    // Insert notification for contract owner
    await supabase
      .from("notifications")
      .insert([{
        created_by: contract.created_by,
        type: "contract_signed",
        title: "Contract Signed",
        message: `${client_name} signed "${contract.name}"`,
        metadata: {
          contract_id,
          signed_contract_id,
          client_name,
        },
        is_read: false,
        is_viewed_celebration: false,
      }]);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
