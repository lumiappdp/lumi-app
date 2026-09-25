import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ==================================================
// SUPABASE EDGE FUNCTION: WEBHOOK KIWIFY -> LUMI APP
// Recebe as notificações de pagamento da Kiwify e atualiza o status
// do usuário na tabela 'profiles' para 'active' / 'paid'
// ==================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log("Recebido Webhook Kiwify:", JSON.stringify(payload));

    // A Kiwify envia o status do pedido e os dados do comprador
    // Eventos comuns: 'order_approved', 'paid', 'subscription_renewed', 'refunded', 'chargedback'
    const orderStatus = payload.order_status || payload.status || "";
    const customerEmail = (payload.Customer?.email || payload.email || "").trim().toLowerCase();
    const planType = payload.Product?.name?.toLowerCase().includes("anual") ? "annual" : "monthly";

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "E-mail do cliente não fornecido no payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let paymentStatus = "pending";

    // Pagamentos aprovados / Assinaturas ativas
    if (
      orderStatus === "paid" ||
      orderStatus === "approved" ||
      orderStatus === "order_approved" ||
      orderStatus === "active" ||
      orderStatus === "completed"
    ) {
      paymentStatus = "active";
    } 
    // Reembolsos ou cancelamentos
    else if (
      orderStatus === "refunded" ||
      orderStatus === "chargedback" ||
      orderStatus === "canceled"
    ) {
      paymentStatus = "inactive";
    }

    // Atualiza ou insere o registro na tabela 'profiles'
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          email: customerEmail,
          payment_status: paymentStatus,
          plan: planType,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Erro ao atualizar profiles no Supabase:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Status do usuário ${customerEmail} atualizado para ${paymentStatus}.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro no processamento do webhook:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
