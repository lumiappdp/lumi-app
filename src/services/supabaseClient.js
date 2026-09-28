import { createClient } from '@supabase/supabase-js';

// Cliente Centralizado de Conexão com o Supabase
// Gerencia a comunicação com o Banco de Dados PostgreSQL, Autenticação e Storage de Imagens
// Chaves públicas seguras para o frontend do Lumi App com fallback para produção na Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmhwhlawwuwzzfjxaxaz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MmbLbUbyaSgVFhBUXOpaaw_4-aUQDVe';

// Criação e exportação da instância única do cliente Supabase público
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
