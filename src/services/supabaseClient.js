import { createClient } from '@supabase/supabase-js';

// Cliente Centralizado de Conexão com o Supabase
// Gerencia a comunicação com o Banco de Dados PostgreSQL, Autenticação e Storage de Imagens
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima';

// Criação e exportação da instância única do cliente Supabase público
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
