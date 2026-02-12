import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { landing_page_slug, company, sac } = body;

    // Validate required fields
    if (!landing_page_slug || !company?.name || !company?.email || !sac?.title || !sac?.description) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch landing page config
    const { data: lp, error: lpError } = await supabase
      .from("landing_pages")
      .select("id, responsible_id, is_active")
      .eq("slug", landing_page_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (lpError || !lp) {
      return new Response(
        JSON.stringify({ error: "Landing page não encontrada ou inativa" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!lp.responsible_id) {
      return new Response(
        JSON.stringify({ error: "Landing page sem responsável configurado. Contate o administrador." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let clientId = company.existing_client_id || null;

    // Create new client if needed
    if (!clientId) {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: company.name,
          document: company.cnpj || null,
          email: company.email || null,
          phone: company.phone || null,
          city: company.city || null,
          state: company.state || null,
          notes: company.contact_name ? `Contato: ${company.contact_name}` : null,
          created_by: lp.responsible_id,
        })
        .select("id")
        .single();

      if (clientError) {
        console.error("Client creation error:", clientError);
        return new Response(
          JSON.stringify({ error: "Erro ao cadastrar empresa: " + clientError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      clientId = newClient.id;
    }

    // Create SAC with service role (bypasses RLS)
    const { data: newSac, error: sacError } = await supabase
      .from("sacs")
      .insert({
        title: sac.title,
        description: sac.description,
        priority: sac.priority || "media",
        nf_number: sac.nf_number || null,
        client_id: clientId,
        created_by: lp.responsible_id,
        analyst_id: lp.responsible_id,
      })
      .select("id, number")
      .single();

    if (sacError) {
      console.error("SAC creation error:", sacError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar SAC: " + sacError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Add history entry
    await supabase.from("sac_history").insert({
      sac_id: newSac.id,
      action: "SAC criado via Landing Page",
      new_value: sac.title,
      user_id: lp.responsible_id,
    });

    return new Response(
      JSON.stringify({ success: true, protocol: newSac.number }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
