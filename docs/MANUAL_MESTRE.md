# 📖 MANUAL MESTRE DO DESENVOLVEDOR & OPERAÇÃO - LUMI APP

> **Documento Oficial Principal de Engenharia, Arquitetura, Manutenção e Resolução de Problemas**  
> *Versão do Projeto: 2.0 (Produção)*  
> *Última Atualização: 2026*

---

## 📑 SUMÁRIO GERAL

1. [Visão Geral e Propósito do Aplicativo](#1-visão-geral-e-propósito-do-aplicativo)
2. [Stack Tecnológica e Dependências](#2-stack-tecnológica-e-dependências)
3. [Guia de Inicialização e Comandos do Projeto](#3-guia-de-inicialização-e-comandos-do-projeto)
4. [Estrutura Completa de Pastas e Arquivos](#4-estrutura-completa-de-pastas-e-arquivos)
5. [Módulos e Telas da Aplicação](#5-módulos-e-telas-da-aplicação)
6. [Camada de Serviços e Regras de Negócio (Services)](#6-camada-de-serviços-e-regras-de-negócio-services)
7. [Guia de Modificações Frequentes (Como Fazer)](#7-guia-de-modificações-frequentes-como-fazer)
   - [7.1 Como alterar os preços e links da Kiwify](#71-como-alterar-os-preços-e-links-da-kiwify)
   - [7.2 Como cadastrar ou alterar e-mails de Administradores](#72-como-cadastrar-ou-alterar-e-mails-de-administradores)
   - [7.3 Como trocar o Logotipo Oficial ou Imagens da Marca](#73-como-trocar-o-logotipo-oficial-ou-imagens-da-marca)
   - [7.4 Como alterar a paleta de cores e o tema (Dark / Light)](#74-como-alterar-a-paleta-de-cores-e-o-tema-dark--light)
   - [7.5 Como gerenciar Nichos, Seções e Figurinhas](#75-como-gerenciar-nichos-seções-e-figurinhas)
8. [Integrações de Backend e Pagamentos](#8-integrações-de-backend-e-pagamentos)
   - [8.1 Supabase (PostgreSQL, Auth e Storage)](#81-supabase-postgresql-auth-e-storage)
   - [8.2 Kiwify (Webhooks e Liberação de Assinatura)](#82-kiwify-webhooks-e-liberação-de-assinatura)
   - [8.3 EmailJS (Recuperação de Senha)](#83-emailjs-recuperação-de-senha)
9. [Segurança e Row Level Security (RLS)](#9-segurança-e-row-level-security-rls)
10. [Guia de Resolução de Problemas (Troubleshooting)](#10-guia-de-resolução-de-problemas-troubleshooting)
    - [10.1 Usuário pagou mas não teve acesso liberado](#101-usuário-pagou-mas-não-teve-acesso-liberado)
    - [10.2 Erro de build no Vite ou falha de importação](#102-erro-de-build-no-vite-ou-falha-de-importação)
    - [10.3 Imagens ou figurinhas não carregam](#103-imagens-ou-figurinhas-não-carregam)
    - [10.4 Limpeza de cache persistente](#104-limpeza-de-cache-persistente)
11. [Boas Práticas e Padrões de Código](#11-boas-práticas-e-padrões-de-código)

---

## 1. VISÃO GERAL E PROPÓSITO DO APLICATIVO

O **Lumi App** é um ecossistema SaaS e PWA desenvolvido para criadores de conteúdo, marcas, profissionais liberais e influencers. Seu objetivo principal é fornecer uma galeria refinada de figurinhas, elementos visuais e frases elegantes com **cópia direta em PNG transparente** para colagem imediata nos Instagram Stories (*Descobrir → Escolher → Copiar → Colar no Story*).

O app foi projetado com estética nativa inspirada no design system do **iOS (Apple)**:
- Microanimações orgânicas e feedback tátil elástico.
- Dark mode padrão profundo (`#231721`) e suporte a Light mode.
- Dock inferior flutuante com botão de ação rápida hero.
- Total responsividade em celulares (iOS/Android), tablets e desktop.

---

## 2. STACK TECNOLÓGICA E DEPENDÊNCIAS

| Tecnologia | Versão | Finalidade |
| :--- | :---: | :--- |
| **React** | `^19.2.8` | Biblioteca principal de interface e componentes reativos |
| **Vite** | `^8.3.0` | Bundler e servidor de desenvolvimento ultra-rápido |
| **JavaScript (ES6+)** | Moderno | Linguagem base sem necessidade de compilação pesada |
| **Vanilla CSS** | Moderno | Estilização pura com variáveis CSS e sem sobrecarga de frameworks |
| **@supabase/supabase-js** | `^2.117.2` | Cliente SDK do Supabase (Auth, Postgres, Realtime, RPC) |
| **@emailjs/browser** | `^4.4.1` | Envio de e-mails transacionais para recuperação de senha gratuita |
| **Oxlint** | `^1.81.0` | Linter de alto desempenho para garantia de qualidade |

---

## 3. GUIA DE INICIALIZAÇÃO E COMANDOS DO PROJETO

Todos os comandos devem ser executados no terminal na raiz do projeto (`c:\PESSOAL\lumi-app`):

### 🚀 1. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
- Inicia o servidor local com Hot Module Replacement (HMR) geralmente em `http://localhost:5173/`.
- Usado para desenvolvimento diário e testes em tempo real.

### 📦 2. Gerar o Pacote de Produção (Build)
```bash
npm run build
```
- Compila e minifica todos os módulos, CSS e scripts na pasta `dist/`.
- Executa a separação de arquivos (Code Splitting) com chunks dedicados (`vendor`, `supabase`).

### 🔍 3. Testar a Versão de Produção Localmente (Preview)
```bash
npm run preview
```
- Serve os arquivos reais compilados da pasta `dist/` em `http://localhost:4173/`.
- **Importante**: Sempre rode esse comando para executar testes no **Google Lighthouse** e verificar a pontuação máxima de performance.

### 🧹 4. Verificar Qualidade do Código (Lint)
```bash
npm run lint
```
- Analisa o código procurando erros de sintaxe ou variáveis não utilizadas.

---

## 4. ESTRUTURA COMPLETA DE PASTAS E ARQUIVOS

```text
lumi-app/
├── .env                          # Variáveis de ambiente secretas (Supabase, EmailJS)
├── index.html                    # HTML raiz com meta tags de SEO, viewport e fontes
├── package.json                  # Dependências e scripts de execução
├── vite.config.js                # Configurações de build e chunks do Vite
├── public/                       # Arquivos estáticos servidos na raiz
│   ├── robots.txt                # Instruções para robôs de busca (SEO)
│   └── favicon.ico               # Ícone do navegador
├── docs/                         # Documentação oficial do sistema
│   ├── MANUAL_MESTRE.md          # Este documento (Manual Central)
│   ├── arquitetura.md            # Especificação técnica detalhada
│   └── padroes_codigo.md         # Padrões de código e comentários
├── identidade-visual/            # Logotipos originais e variações da marca Lumi
│   ├── lumi-logo-ve.png          # Logo horizontal Lumi
│   ├── lumi-logo-icone-ve.png    # Ícone oficial da marca (Fundo Escuro)
│   └── 9.png                     # Símbolo do coração Lumi
└── src/
    ├── main.jsx                  # Ponto de montagem do React no DOM
    ├── App.jsx                   # Roteador central com Lazy Loading e validação de sessão
    ├── App.css                   # Estilos globais da estrutura de rotas
    ├── index.css                 # Reset de CSS, fontes Google e estilos base
    ├── components/               # Componentes reutilizáveis em várias telas
    │   ├── SplashScreen/         # Splash screen animada inicial (1.4s)
    │   └── StickerPreviewModal/  # Modal com zoom e cópia do sticker
    ├── pages/                    # Módulos de telas completas
    │   ├── Login/                # Autenticação e bloqueio de inadimplentes
    │   ├── Register/             # Cadastro com seletor de planos e senha forte
    │   ├── ForgotPassword/       # Recuperação de senha em 3 etapas com código
    │   ├── PaymentCheckout/      # Tela de pagamento com links Kiwify e polling
    │   ├── Home/                 # Feed com carrosséis de nichos e dock inferior
    │   ├── AllSubcategories/     # Galeria completa de subcards de um nicho
    │   ├── CategoryDetail/       # Visualização e cópia de figurinhas por subcategoria
    │   ├── Favorites/            # Lista de figurinhas salvas como favoritas
    │   ├── CreateSticker/        # Canvas interativo para criação de frases
    │   ├── Profile/              # Perfil, preferências, foto e suporte
    │   ├── Admin/                # Painel de controle do Administrador Supremo
    │   └── Legal/                # Modais de Termos de Uso e Política de Privacidade
    ├── services/                 # Camada de lógica e integração com APIs
    │   ├── supabaseClient.js     # Conexão com o banco Supabase
    │   ├── authService.js        # Login, logout, RLS, status de pagamento e avatar
    │   ├── adminService.js       # Gestão de usuários, avisos e equipe
    │   ├── categoriesService.js  # Gestão de nichos, seções e capas
    │   ├── stickersService.js    # Busca e envio de figurinhas do Supabase
    │   ├── creationsService.js   # Galeria "Eu criei" com sincronização em nuvem
    │   ├── clipboardService.js   # Cópia em PNG para o Story do Instagram
    │   ├── recentService.js      # Histórico de figurinhas copiadas
    │   ├── favoritesService.js   # Persistência de favoritos
    │   └── usageService.js       # Registro de mais usados e cliques
    └── styles/
        └── variables.css         # Design Tokens (Cores, Fontes, Sombras, Raios)
```

---

## 5. MÓDULOS E TELAS DA APLICAÇÃO

### 5.1 SplashScreen (`src/components/SplashScreen/`)
- Exibe o logotipo oficial animado por **1.4s** com áudio harmônico gerado pela Web Audio API.
- Possui dimensões explícitas para garantir FCP e LCP rápidos no Lighthouse.

### 5.2 Login (`src/pages/Login/`)
- Acesso com e-mail e senha.
- Se a conta for de cliente comum, verifica a assinatura no Supabase. Se inativa, bloqueia e exibe o botão **"💳 Renovar / Ativar Assinatura"** redirecionando para a Kiwify.
- Botão `✕` para limpar texto e ícone para exibir/ocultar senha.

### 5.3 Cadastro (`src/pages/Register/`)
- Coleta Nome, Nome de Usuário `@handle`, E-mail, Senha e escolha do Plano (**Anual** ou **Mensal**).
- Validação de **senha forte** (mínimo 8 caracteres, letras, números e caracteres especiais) com checklist visual em tempo real.
- Redireciona o usuário comum para a tela de pagamento e o Administrador direto para a Home.

### 5.4 Recuperação de Senha (`src/pages/ForgotPassword/`)
- Etapa 1: Digitar e-mail cadastrado.
- Etapa 2: Digitar código OTP de 6 dígitos recebido por e-mail.
- Etapa 3: Definir nova senha forte e confirmação.

### 5.5 Checkout (`src/pages/PaymentCheckout/`)
- Apresenta o resumo do plano escolhido e botão para abrir a Kiwify.
- Executa verificação periódica (polling a cada 5 segundos) no Supabase para liberar o acesso assim que o pagamento for aprovado.

### 5.6 Home (`src/pages/Home/`)
- Feed com carrossel superior de abas:
  - **Nichos**: Carrosséis com capas limpas dos subcards de cada segmento.
  - **Mais usados**: Figurinhas mais populares com estatísticas.
  - **Recentes**: Últimas figurinhas copiadas.
  - **Eu criei / Minha Galeria**: Figurinhas importadas do celular ou criadas no canvas, salvas no Supabase.
  - **Em alta 🔥**: Destaques da semana.
  - **Elementos**: Ilustrações e traços vetoriais.
- Dock inferior estilo iOS com botão central de criação rápida.

### 5.7 Painel do Administrador (`src/pages/Admin/`)
- Exclusivo para o Administrador Supremo (`contato.lumiapp@gmail.com`).
- **Figurinhas**: Upload de imagens com título, categoria e tags, além de exclusão em massa.
- **Nichos**: Criação de nichos e subcards com capas personalizadas.
- **Clientes**: Listagem de usuários cadastrados com botão de liberação/bloqueio manual em 1 clique.
- **Avisos Globais**: Publicação de banners no topo da Home para todos os usuários.

---

## 6. CAMADA DE SERVIÇOS E REGRAS DE NEGÓCIO (SERVICES)

Toda a lógica que não envolve interface gráfica reside na pasta `src/services/`:

1. **`authService.js`**:
   - `registerUser()`: Cadastra usuário no Supabase Auth e grava perfil inicial.
   - `loginUser()`: Autentica credenciais.
   - `checkPaymentStatus(email)`: Retorna `true` se o status for `active`, `paid` ou `renewed`.
   - `validateSession()`: Valida o token JWT ativo em segundo plano.
   - `updateUserAvatar()` / `getUserAvatar()`: Sincroniza a foto de perfil com a nuvem.

2. **`clipboardService.js`**:
   - Converte elementos ou URLs de imagem em `Blob (image/png)` e grava na área de transferência com `navigator.clipboard.write()`.

3. **`categoriesService.js`**:
   - Gerencia a lista de seções principais, subcards e imagens de capa personalizadas sincronizadas com o banco.

4. **`creationsService.js`**:
   - Rasteriza o canvas do usuário em PNG transparente e envia para a tabela `user_gallery` do Supabase.

5. **`stickersService.js`**:
   - Consulta o catálogo de figurinhas cadastradas por slug de categoria ou termo de busca.

---

## 7. GUIA DE MODIFICAÇÕES FREQUENTES (COMO FAZER)

### 7.1 Como alterar os preços e links da Kiwify
1. Abra o arquivo [`src/pages/PaymentCheckout/PaymentCheckout.jsx`](file:///c:/PESSOAL/lumi-app/src/pages/PaymentCheckout/PaymentCheckout.jsx).
2. Localize o objeto `KIWIFY_LINKS`:
   ```javascript
   const KIWIFY_LINKS = {
     annual: 'https://pay.kiwify.com.br/vuoMzHN', // Link do seu checkout Anual
     monthly: 'https://pay.kiwify.com.br/qgrB5dy', // Link do seu checkout Mensal
   };
   ```
3. Para alterar os valores exibidos visualmente na tela de cadastro, edite o array `plans` em [`src/pages/Register/Register.jsx`](file:///c:/PESSOAL/lumi-app/src/pages/Register/Register.jsx).

---

### 7.2 Como cadastrar ou alterar e-mails de Administradores
O Administrador Supremo possui acesso irrestrito sem verificação de pagamento.
1. Abra [`src/services/authService.js`](file:///c:/PESSOAL/lumi-app/src/services/authService.js).
2. Altere a constante `ADMIN_SUPREMO_EMAIL`:
   ```javascript
   export const ADMIN_SUPREMO_EMAIL = 'contato.lumiapp@gmail.com';
   ```
3. Caso queira adicionar outros membros na equipe de suporte, acesse a aba **Equipe** no Painel Administrativo dentro do próprio app.

---

### 7.3 Como trocar o Logotipo Oficial ou Imagens da Marca
1. Coloque os novos arquivos PNG na pasta [`identidade-visual/`](file:///c:/PESSOAL/lumi-app/identidade-visual/):
   - `lumi-logo-ve.png`: Logotipo horizontal para o topo da Home.
   - `lumi-logo-icone-ve.png`: Ícone para a Splash Screen e tela de Login.
2. O app já está configurado para ler automaticamente esses arquivos com redimensionamento responsivo.

---

### 7.4 Como alterar a paleta de cores e o tema (Dark / Light)
1. Abra o arquivo [`src/styles/variables.css`](file:///c:/PESSOAL/lumi-app/src/styles/variables.css).
2. Modifique as variáveis principais:
   ```css
   :root {
     --bg-primary: #231721;      /* Fundo escuro oficial Lumi */
     --accent-pink: #EAA1AC;     /* Rosa suave oficial Lumi */
     --accent-pink-dark: #D48995;
     --text-primary: #FFFFFF;
   }
   ```

---

### 7.5 Como gerenciar Nichos, Seções e Figurinhas
- Não é necessário mexer no código para adicionar novos nichos ou figurinhas!
- Basta logar com a conta `contato.lumiapp@gmail.com`, acessar **Perfil ➔ Painel do Administrador**:
  - Na aba **Figurinhas**: Faça upload de figurinhas PNG transparentes com tags.
  - Na aba **Nichos**: Crie novas seções (ex: *Maternidade*, *Arquitetura*, *Gospel*) e adicione subcards com imagens de capa.

---

## 8. INTEGRAÇÕES DE BACKEND E PAGAMENTOS

### 8.1 Supabase (PostgreSQL, Auth e Storage)
As chaves públicas e a URL do Supabase estão configuradas no arquivo [`.env`](file:///c:/PESSOAL/lumi-app/.env):
```env
VITE_SUPABASE_URL=https://tmhwhlawwuwzzfjxaxaz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_MmbLbUbyaSgVFhBUXOpaaw_...
```

**Tabelas Principais no Banco:**
- `profiles`: Armazena dados dos usuários, plano (`plan`), status de pagamento (`payment_status`) e foto (`avatar_url`).
- `stickers`: Catálogo de figurinhas publicadas pela administração.
- `categories`: Seções e nichos com seus respectivos subcards.
- `user_gallery`: Figurinhas pessoais salvas por cada usuário.

---

### 8.2 Kiwify (Webhooks e Liberação de Assinatura)
- **URL do Webhook cadastrada na Kiwify**: Aponta para a Edge Function do Supabase.
- **Eventos escutados**:
  - `order_approved`: Atualiza `payment_status = 'active'`.
  - `subscription_canceled` / `refunded`: Atualiza `payment_status = 'inactive'`.

---

### 8.3 EmailJS (Recuperação de Senha)
Utilizado para enviar e-mails de código de recuperação de senha de forma 100% gratuita. Configurado no arquivo [`.env`](file:///c:/PESSOAL/lumi-app/.env):
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

---

## 9. SEGURANÇA E ROW LEVEL SECURITY (RLS)

O banco de dados PostgreSQL do Supabase está blindado com **Row Level Security (RLS)** ativo. Isso impede que qualquer pessoa com a chave anônima altere dados indevidos.

### Políticas Ativas:
1. **Perfis (`profiles`)**:
   - Cada usuário só pode ler e atualizar seu próprio registro (`auth.uid() = id`).
   - Apenas o e-mail do Administrador Supremo (`contato.lumiapp@gmail.com`) pode ler todos os perfis e alterar o `payment_status`.
2. **Figurinhas (`stickers`)**:
   - Leitura pública liberada para todos.
   - Criação, edição e exclusão permitidas estritamente para o Administrador Supremo.
3. **Galeria Pessoal (`user_gallery`)**:
   - Cada usuário só enxerga e apaga as figurinhas associadas ao seu próprio e-mail (`user_email`).

---

## 10. GUIA DE RESOLUÇÃO DE PROBLEMAS (TROUBLESHOOTING)

### 10.1 Usuário pagou mas não teve acesso liberado
- **Causa**: O Webhook da Kiwify pode ter demorado alguns segundos para disparar ou o e-mail digitado no checkout foi diferente do e-mail cadastrado no app.
- **Solução Rápida**:
  1. Acesse o app com o e-mail de Administrador.
  2. Vá em **Perfil ➔ Painel do Administrador ➔ Clientes**.
  3. Localize o e-mail do cliente e clique no botão **"Liberar Acesso"** (isso atualiza o status para `active` imediatamente).

---

### 10.2 Erro de build no Vite ou falha de importação
- **Sintoma**: Mensagem `Build failed with error` no terminal ao executar `npm run build`.
- **Como Resolver**:
  1. Verifique se alguma variável ou importação foi declarada duas vezes no mesmo arquivo.
  2. Execute `npm run lint` para apontar o arquivo e linha exatos do erro.
  3. Após corrigir, execute `npm run build` novamente.

---

### 10.3 Imagens ou figurinhas não carregam
- **Causa**: URL da imagem corrompida ou bloqueio de CORS do Storage.
- **Como Resolver**:
  1. No painel do Supabase, certifique-se de que o Bucket de Storage (ex: `stickers` ou `covers`) está configurado como **Public**.
  2. Verifique se a URL da imagem começa com `https://`.

---

### 10.4 Limpeza de cache persistente
- **Sintoma**: Alterou dados no banco mas o app continua mostrando a versão antiga no celular.
- **Como Resolver**:
  - No app, o usuário pode acessar **Perfil ➔ Sincronizar Catálogo & Limpar Cache** para recarregar todos os dados do servidor.

---

## 11. BOAS PRÁTICAS E PADRÕES DE CÓDIGO

1. **Nunca alterar código em produção sem testar no preview**: Sempre execute `npm run build && npm run preview` para garantir que o bundle está compilando sem erros.
2. **Sempre documentar blocos de código com comentários didáticos** acima das funções e componentes (`JSDoc`).
3. **Nunca utilizar emojis de texto** na interface do usuário (ex: 📲, ✨, 🔥, 🎨, ⭐, 👑). Utilize sempre **ícones vetoriais SVG**.
4. **Respeitar o protocolo de segurança**: Nunca desative o RLS no Supabase.
