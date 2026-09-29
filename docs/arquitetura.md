# Arquitetura e Especificação Técnica - Lumi App

## 1. Visão Geral
O **Lumi App** é uma plataforma SaaS e PWA focada em criadores de conteúdo e profissionais, permitindo a descoberta, personalização e cópia instantânea de figurinhas, frases e elementos visuais de alta qualidade diretamente para os Instagram Stories (*Descobrir → Escolher → Copiar → Colar no Story*). Desenvolvido com foco em estética premium (estilo iOS), alta performance e responsividade em Android, iOS, Tablets, Web e Desktop (PWA).

---

## 2. Stack Tecnológica
- **Base / Frontend**: React 18+ (JavaScript Moderno ES6+), Vite 8+.
- **Estilização**: CSS Vanilla Modular com Design Tokens centralizados (`src/styles/variables.css`).
- **Tema Padrão**: Dark Mode (`#231721`) com persistência em `localStorage` e suporte a Light Mode.
- **Backend & Database**: Supabase (PostgreSQL, Auth com JWT, Row Level Security, Edge Functions).
- **Pagamentos**: Integração de Webhooks com Kiwify (Planos Mensal e Anual com liberação em tempo real).
- **Deploy**: PWA (Web, Desktop, iOS e Android via Capacitor).

---

## 3. Estrutura do Projeto
```text
lumi-app/
├── docs/                         # Documentações de arquitetura e padrões de código
│   ├── arquitetura.md
│   └── padroes_codigo.md
├── identidade-visual/            # Logotipos oficiais e ativos da marca
├── public/                       # Arquivos estáticos (robots.txt, manifest)
└── src/
    ├── components/               # Componentes reutilizáveis
    │   ├── SplashScreen/         # Splash screen animada com áudio harmônico (1.4s)
    │   └── StickerPreviewModal/  # Modal de visualização ampliada e cópia de stickers
    ├── pages/                    # Módulos de telas da aplicação
    │   ├── Login/                # Login com verificação estrita e botão de renovação Kiwify
    │   ├── Register/             # Cadastro com seletor de planos e validação de senha forte
    │   ├── ForgotPassword/       # Fluxo de recuperação de senha por e-mail (OTP)
    │   ├── PaymentCheckout/      # Checkout e monitoramento em tempo real do Kiwify
    │   ├── Home/                 # Feed principal com carrosséis e dock iOS
    │   ├── AllSubcategories/     # Galeria completa de subcategorias de um nicho
    │   ├── CategoryDetail/       # Visualização e cópia de figurinhas por subcategoria
    │   ├── Favorites/            # Lista de figurinhas favoritadas pelo usuário
    │   ├── CreateSticker/        # Canvas interativo para criação de stickers
    │   ├── Profile/              # Perfil, preferências, foto sincronizada e suporte
    │   └── Admin/                # Painel de controle do Administrador Supremo
    ├── services/                 # Camada de serviços desacoplada
    │   ├── supabaseClient.js     # Cliente de conexão Supabase
    │   ├── authService.js        # Autenticação, RLS, status de assinatura e avatares
    │   ├── adminService.js       # Gestão de usuários, avisos globais e equipe
    │   ├── categoriesService.js  # Gestão dinâmica de nichos e capas de subcards
    │   ├── stickersService.js    # Catálogo dinâmico de figurinhas no Supabase
    │   ├── creationsService.js   # Galeria pessoal ("Eu criei") com nuvem Supabase
    │   ├── clipboardService.js   # Cópia para o clipboard em formato PNG transparente
    │   ├── recentService.js      # Histórico de stickers copiados
    │   ├── favoritesService.js   # Gerenciamento de figurinhas favoritas
    │   └── usageService.js       # Contagem de cliques e mais usados
    ├── styles/                   # Tokens e temas globais
    │   └── variables.css
    ├── App.jsx                   # Roteamento central com Code Splitting (React.lazy)
    ├── index.css                 # Reset global e fontes
    └── main.jsx                  # Ponto de entrada da aplicação
```

---

## 4. Módulos e Telas

### 4.1. Abertura (Splash Screen)
- Duração otimizada de 1.4s (fade-out aos 1.1s) com áudio harmônico sintetizado (E5, B5, G#6) e renderização ágil da logo oficial com dimensões explícitas para máxima nota no Lighthouse.

### 4.2. Autenticação (Login)
- Formulário em pílula com controle de visibilidade de senha e botões de apagar com 1 clique (`✕`).
- Validação estrita de pagamento ativo (`checkPaymentStatus`). Em caso de inadimplência ou plano vencido, bloqueia o acesso e exibe botão direto para o checkout da Kiwify.

### 4.3. Cadastro e Seleção de Planos (Register)
- Formulário de dados cadastrais (Nome, Nome de Usuário `@handle`, E-mail, Senha).
- Validação de **senha forte** (mínimo 8 dígitos, letras, números e caracteres especiais) com checklist visual em tempo real.
- **Seletor de Planos**:
  - **Plano Anual**: R$ 89,90/ano (Mais vantajoso).
  - **Plano Mensal**: R$ 14,90/mês (Flexível).

### 4.4. Recuperação de Senha (ForgotPassword)
- Fluxo em 3 etapas com e-mail cadastrado, verificação de código e redefinição de senha segura via Supabase Auth.

### 4.5. Checkout e Pagamento (PaymentCheckout)
- Redirecionamento para o checkout oficial da Kiwify com parâmetros pré-preenchidos.
- Monitoramento em tempo real (polling a cada 5s) e botão de checagem manual para liberação instantânea.

### 4.6. Página Inicial (Home)
- **Carrossel de Filtros Deslizável (Touch/Mouse drag)**:
  - **Nichos**: Feed de carrosséis categorizados com capas nítidas sem poluição visual.
  - **Mais usados**: Figurinhas mais populares com estatísticas e botão de favoritar.
  - **Recentes**: Histórico dinâmico alimentado pelo `recentService`.
  - **Eu criei**: Galeria pessoal sincronizada na nuvem (`creationsService`).
  - **Em alta 🔥**: Seleção de figurinhas em tendência.
  - **Elementos**: Ilustrações vetoriais e artes diretas do Supabase.
- **Barra de Navegação Inferior (Dock iOS)**:
  - Início, Favoritos, Botão Flutuante (+ Criar), e Perfil.

### 4.7. Painel Administrativo (AdminDashboard)
- Acesso exclusivo para a conta Master (`contato.lumiapp@gmail.com`).
- Upload e exclusão em lote de figurinhas no Supabase com tags.
- Criação e edição de nichos e subcards sem campos obrigatórios desnecessários.
- Gestão de clientes com liberação/bloqueio manual em 1 clique.
- Disparo de avisos globais e métricas.

---

## 5. Camada de Segurança e RLS (Supabase)
- **Row Level Security (RLS)**:
  - `profiles`: Cada usuário acessa apenas seu próprio perfil (`auth.uid() = id`). Apenas o Administrador Supremo pode alterar o status de pagamento e planos.
  - `stickers`: Leitura pública para usuários autenticados e gravação/exclusão restrita ao Admin.
  - `user_gallery`: Cada usuário acessa e gerencia exclusivamente suas próprias figurinhas.
- **Sessão Segura**: Validação em segundo plano de tokens JWT via `validateSession()`.
