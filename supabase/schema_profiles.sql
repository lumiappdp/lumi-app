-- ==================================================
-- SCHEMA SQL: TABELA PROFILES E INTEGRAÇÃO KIWIFY
-- Execute este script no SQL Editor do Supabase (supabase.com)
-- ==================================================

-- 1. Criação da tabela 'profiles' (caso ainda não exista)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  username TEXT,
  plan TEXT DEFAULT 'annual',
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilita RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Leitura e Edição
CREATE POLICY "Permitir leitura para todos os autenticados" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Permitir atualização do perfil pelo próprio usuário" 
ON public.profiles FOR UPDATE 
USING (auth.jwt() ->> 'email' = email);

-- 4. Inserir ou garantir status vitalício do Administrador Supremo
INSERT INTO public.profiles (email, name, username, payment_status, plan)
VALUES ('contato.lumiapp@gmail.com', 'Administrador Supremo', '@admin', 'active', 'annual')
ON CONFLICT (email) 
DO UPDATE SET payment_status = 'active';
