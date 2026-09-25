import { supabase } from './supabaseClient';

// Serviço de Autenticação com Supabase
// Fornece funções para Login, Cadastro com Plano, Logout e Verificação de Permissões de Administrador

// E-mail oficial reservado exclusivamente para o Administrador Supremo
export const ADMIN_SUPREMO_EMAIL = 'contato.lumiapp@gmail.com';

// Verifica se um endereço de e-mail pertence ao Administrador Supremo
// @param {string} email
// @returns {boolean}
export function checkIsAdmin(email) {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_SUPREMO_EMAIL.toLowerCase();
}

// Realiza cadastro de novo usuário e salva perfil inicial com o plano selecionado e nome de usuário
// @param {Object} params
// @param {string} params.name - Nome completo do usuário
// @param {string} params.username - Nome de usuário / @handle
// @param {string} params.email - E-mail do usuário
// @param {string} params.password - Senha de acesso
// @param {string} params.plan - 'annual' ou 'monthly'
export async function registerUser({ name, username, email, password, plan = 'annual' }) {
  const isAdmin = checkIsAdmin(email);
  const formattedUsername = username 
    ? (username.startsWith('@') ? username : `@${username}`) 
    : '';

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name,
        username: formattedUsername,
        plan,
        role: isAdmin ? 'admin' : 'user',
      },
    },
  });

  if (error) throw error;
  return data;
}

// Realiza login com e-mail e senha
// @param {Object} params
// @param {string} params.email
// @param {string} params.password
export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

// Realiza logout do usuário
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Obtém os dados do usuário autenticado no momento
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Verifica o status de pagamento de um usuário (liberação automática e validação de renovação)
// @param {string} email
// @returns {Promise<boolean>}
export async function checkPaymentStatus(email) {
  if (!email) return false;
  
  const cleanEmail = email.trim().toLowerCase();

  // O Administrador Supremo tem acesso vitalício gratuito
  if (checkIsAdmin(cleanEmail)) return true;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('payment_status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !data) return false;
    
    // Status aceitos como liberados
    const activeStatuses = ['active', 'paid', 'renewed'];
    return activeStatuses.includes(data.payment_status);
  } catch (err) {
    console.error('Erro na checagem de assinatura:', err);
    return false;
  }
}

// Envia e-mail de redefinição de senha via Supabase
// @param {string} email - E-mail cadastrado do usuário
// @returns {Promise<Object>}
export async function sendPasswordResetEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });

  if (error) throw error;
  return data;
}

// Atualiza a senha de um usuário autenticado ou no fluxo de recuperação
// @param {string} newPassword - Nova senha escolhida
// @returns {Promise<Object>}
export async function updatePasswordUser(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

// Exclui a conta do usuário e limpa seus registros (Conformidade LGPD)
// @param {string} email
// @returns {Promise<boolean>}
export async function deleteAccountUser(email) {
  if (!email) return false;
  
  // Impede que a conta do Administrador Supremo seja apagada
  if (checkIsAdmin(email)) {
    throw new Error('A conta do Administrador Supremo não pode ser excluída.');
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Remove registros do perfil na tabela profiles
    await supabase
      .from('profiles')
      .delete()
      .eq('email', cleanEmail);

    // Efetua logout da sessão
    await supabase.auth.signOut();
    return true;
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    throw err;
  }
}

// Obtém os dados do perfil do usuário logado e verifica se é Admin
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}

