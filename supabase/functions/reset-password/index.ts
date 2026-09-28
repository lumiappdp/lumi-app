import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ==================================================
// SUPABASE EDGE FUNCTION: RESET PASSWORD -> LUMI APP
// Atualiza a senha de um usuário no Supabase Auth de forma segura
// utilizando privilégios administrativos (service_role) após OTP validado
// ==================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Resposta para preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // Inicializa o cliente com privilégios de Service Role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: "E-mail e nova senha são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Busca todos os usuários cadastrados no Auth para localizar pelo e-mail
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    
    if (userError) throw userError;

    const targetUser = userData.users.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "Nenhum usuário encontrado com este e-mail." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Atualiza a senha do usuário diretamente no Supabase Auth
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "Senha atualizada com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro na redefinição de senha:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao atualizar senha." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
