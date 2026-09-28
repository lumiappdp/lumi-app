import { supabase } from './supabaseClient';

// ==================================================
// SERVIÇO ADMINISTRATIVO - LUMI APP
// Gerenciamento de Usuários, Suporte, Equipe e Avisos Globais
// ==================================================

const LOCAL_ANNOUNCEMENT_KEY = 'lumi_global_announcement';
const LOCAL_TEAM_KEY = 'lumi_admin_team';

// Busca lista de todos os usuários cadastrados no banco de dados
// @returns {Promise<Array>} Lista de perfis de usuários
export async function getAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Erro ao buscar usuários do Supabase:', err);
  }
  return [];
}

// Atualiza o status de liberação/pagamento de um usuário (liberação manual em 1 clique)
// @param {string} email - E-mail do usuário
// @param {string} newStatus - 'active', 'inactive' ou 'trial'
// @returns {Promise<Object>}
export async function updateUserPaymentStatus(email, newStatus) {
  const cleanEmail = email.trim().toLowerCase();
  
  // Atualiza no Supabase
  const { data, error } = await supabase
    .from('profiles')
    .update({ payment_status: newStatus })
    .eq('email', cleanEmail);

  if (error) {
    console.warn('Erro ao atualizar status no Supabase:', error);
  }

  return { email: cleanEmail, status: newStatus };
}

// Altera o plano do usuário (mensal / anual / vitalício)
// @param {string} email - E-mail do usuário
// @param {string} plan - 'monthly' ou 'annual'
export async function updateUserPlan(email, plan) {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .update({ plan: plan })
    .eq('email', cleanEmail);

  if (error) {
    console.warn('Erro ao atualizar plano no Supabase:', error);
  }

  return data;
}

// Obtém os membros da equipe cadastrados (Designers e Suporte)
// @returns {Array} Lista de membros da equipe
export function getTeamMembers() {
  try {
    const saved = localStorage.getItem(LOCAL_TEAM_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Erro ao ler equipe:', err);
  }
  return [
    {
      id: 'admin-master',
      name: 'Administrador Supremo',
      email: 'contato.lumiapp@gmail.com',
      role: 'Master Admin',
      createdAt: new Date().toISOString()
    }
  ];
}

// Adiciona um novo membro na equipe
// @param {Object} member - { name, email, role }
export function addTeamMember({ name, email, role = 'Designer' }) {
  const current = getTeamMembers();
  const cleanEmail = email.trim().toLowerCase();
  
  if (current.some(m => m.email.toLowerCase() === cleanEmail)) {
    throw new Error('Este e-mail já faz parte da equipe.');
  }

  const newMember = {
    id: `team-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    role,
    createdAt: new Date().toISOString()
  };

  const updated = [...current, newMember];
  localStorage.setItem(LOCAL_TEAM_KEY, JSON.stringify(updated));
  return updated;
}

// Remove um membro da equipe
// @param {string} memberId - ID do membro
export function removeTeamMember(memberId) {
  const current = getTeamMembers();
  const filtered = current.filter(m => m.id !== memberId && m.email !== 'contato.lumiapp@gmail.com');
  localStorage.setItem(LOCAL_TEAM_KEY, JSON.stringify(filtered));
  return filtered;
}

// Obtém o aviso global ativo para exibição no topo da Home
// @returns {Object} { active, text, type }
export function getGlobalAnnouncement() {
  try {
    const saved = localStorage.getItem(LOCAL_ANNOUNCEMENT_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Erro ao ler aviso global:', err);
  }
  return { active: false, text: '', type: 'novidade' };
}

// Salva e atualiza o aviso global
// @param {Object} announcement - { active, text, type }
export function saveGlobalAnnouncement(announcement) {
  try {
    localStorage.setItem(LOCAL_ANNOUNCEMENT_KEY, JSON.stringify(announcement));
  } catch (err) {
    console.error('Erro ao salvar aviso global:', err);
  }
}

const LOCAL_SUGGESTIONS_KEY = 'lumi_user_suggestions';

// Envia uma sugestão do usuário para o banco e local
// @param {Object} suggestion - { email, name, type, text }
export async function sendUserSuggestion({ email, name, type, text }) {
  const newSuggestion = {
    id: `sug-${Date.now()}`,
    user_email: email,
    user_name: name,
    type: type || 'Geral',
    suggestion_text: text,
    created_at: new Date().toISOString()
  };

  // Salva no cache local
  try {
    const saved = localStorage.getItem(LOCAL_SUGGESTIONS_KEY);
    const list = saved ? JSON.parse(saved) : [];
    localStorage.setItem(LOCAL_SUGGESTIONS_KEY, JSON.stringify([newSuggestion, ...list]));
  } catch (err) {
    console.warn('Erro ao salvar sugestão localmente:', err);
  }

  // Tenta sincronizar com o Supabase
  try {
    await supabase.from('user_suggestions').insert([{
      user_email: email,
      user_name: name,
      category_type: type || 'Geral',
      message: text
    }]);
  } catch (err) {
    console.warn('Supabase aguardando tabela user_suggestions:', err);
  }

  return newSuggestion;
}

// Obtém a lista de sugestões enviadas pelos usuários
export function getUserSuggestions() {
  try {
    const saved = localStorage.getItem(LOCAL_SUGGESTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
