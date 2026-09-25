# Arquitetura e Especificação Técnica - Lumi App

## 1. Visão Geral
O **Lumi App** é um aplicativo de criação e descoberta de figurinhas, frases e elementos visuais para Instagram Stories (*Descobrir → Escolher → Copiar → Colar no Story*). Desenvolvido com foco em estética premium (estilo iOS), alta performance e responsividade em Android, iOS, Tablets, Web e Desktop (PWA).

---

## 2. Tecnologias Principais
- **Base / Frontend**: React 18+ (JavaScript) com Vite.
- **Estilização**: CSS Vanilla com Design Tokens centralizados (`src/styles/variables.css`).
- **Tema Padrão**: Dark Mode (`#231721`) com persistência em `localStorage` e suporte a Light Mode.
- **Empacotamento / Deploy**: PWA (Web/Desktop) e suporte nativo via Capacitor.

---

## 3. Estrutura de Pastas
```text
lumi-app/
├── docs/                         # Documentações de arquitetura e padrões de código
│   ├── arquitetura.md
│   └── padroes_codigo.md
├── identidade-visual/            # Logotipos oficiais e ativos da marca
├── public/                       # Arquivos estáticos
└── src/
    ├── assets/                   # Ícones e imagens
    ├── components/               # Componentes reutilizáveis
    │   └── SplashScreen/         # Splash screen animada de inicialização
    ├── pages/                    # Telas da aplicação
    │   ├── Login/                # Autenticação com e-mail/senha
    │   ├── Register/             # Cadastro com seletor de planos (Anual/Mensal)
    │   ├── Home/                 # Feed principal e abas de filtros
    │   ├── CategoryDetail/       # Visualização detalhada de categoria
    │   ├── Favorites/            # Lista de figurinhas favoritadas
    │   ├── CreateSticker/        # Canvas interativo para criação de stickers
    │   └── Profile/              # Perfil, preferências de tema e configurações
    ├── services/                 # Regras de negócio desacopladas
    │   ├── clipboardService.js   # Cópia para área de transferência em PNG
    │   ├── recentService.js      # Histórico de figurinhas copiadas
    │   ├── favoritesService.js   # Persistência de favoritos
    │   └── creationsService.js   # Armazenamento das criações do usuário
    ├── styles/                   # Design tokens e variáveis de cor
    │   └── variables.css
    ├── App.jsx                   # Roteamento e gerenciamento de estado global
    ├── index.css                 # Reset e tipografia global
    └── main.jsx                  # Ponto de entrada do React
```

---

## 4. Módulos e Telas

### 4.1. Abertura (Splash Screen)
- Duração: 3.2s com animação de traçado e revelação orgânica da logo oficial `lumi-logo-icone-ve.png`.

### 4.2. Autenticação (Login)
- Formulário em pílula com controle de visibilidade de senha.
- Navegação para a Home (`onLogin`) e direcionamento para a tela de Cadastro.

### 4.3. Cadastro e Seleção de Planos (Register)
- Formulário de dados cadastrais (Nome, E-mail, Senha).
- **Seletor de Planos**:
  - **Plano Anual**: R$ 89,90/ano (Mais vantajoso ⭐).
  - **Plano Mensal**: R$ 14,90/mês (Flexível).
- Armazenamento da preferência em `localStorage` e ativação direta da conta.

### 4.4. Página Inicial (Home)
- **Carrossel de Filtros Deslizável (Touch/Mouse drag)**:
  - **Nichos**: Feed categorizado (Universais, Profissões, Lojas | Comércios, Datas comemorativas, etc.).
  - **Mais usados**: Cards mais populares com cópia rápida e botão de favoritar.
  - **Recentes**: Histórico dinâmico alimentado pelo `recentService`.
  - **Eu criei**: Galeria de criações salvas do usuário (`creationsService`).
  - **Em alta 🔥**: Seleção de figurinhas em tendência.
  - **Frases**: Coleção exclusiva de tipografias e citações.
  - **Elementos**: Ilustrações vetoriais, desenhos e emojis puros.
- **Barra de Navegação Inferior (Dock iOS)**:
  - Início, Favoritos, Botão Flutuante (+ Criar), Vídeos/Mídias (*Toast "Em breve"*), e Perfil.

### 4.5. Detalhes da Categoria (CategoryDetail)
- Grade de stickers com suporte a busca em tempo real, botão de voltar ao feed e cópia direta.

### 4.6. Favoritos (Favorites)
- Lista reativa de figurinhas salvas pelo usuário com opção de desfavoritar e copiar instantaneamente.

### 4.7. Criador de Stickers (CreateSticker)
- Canvas interativo para personalização de texto, seleção de fontes elegantes, ajuste de cores, tamanhos e exportação/cópia.

### 4.8. Perfil do Usuário (Profile)
- Foto de perfil personalizável com upload e persistência local.
- Status da assinatura e identificação.
- Alternador de Tema Escuro/Claro em tempo real.
- Ações configuradas: *Desbloquear Premium*, *Política de Privacidade*, *Termos de uso*, *Instagram*, *Suporte & Ajuda via WhatsApp*, *Sair da conta* e *Apagar conta*.

---

## 5. Camada de Serviços (`src/services/`)
1. **`clipboardService.js`**: Converte stickers/canvas em formato `image/png` e copia para o Clipboard nativo com feedback via Toast.
2. **`recentService.js`**: Registra no `localStorage` os últimos stickers copiados para exibição na aba "Recentes".
3. **`favoritesService.js`**: Gerencia o estado e array de IDs favoritados.
4. **`creationsService.js`**: Salva no storage local as imagens geradas pelo canvas na aba "Eu criei".
