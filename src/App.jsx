import { useEffect, useState, lazy, Suspense } from 'react';
import { SplashScreen } from './components/SplashScreen/SplashScreen';
import { Home } from './pages/Home/Home';

// Carregamento sob demanda (Lazy Loading) das páginas secundárias para acelerar o carregamento inicial (FCP/LCP)
const Profile = lazy(() => import('./pages/Profile/Profile').then(m => ({ default: m.Profile })));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail/CategoryDetail').then(m => ({ default: m.CategoryDetail })));
const Favorites = lazy(() => import('./pages/Favorites/Favorites').then(m => ({ default: m.Favorites })));
const CreateSticker = lazy(() => import('./pages/CreateSticker/CreateSticker').then(m => ({ default: m.CreateSticker })));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AllSubcategories = lazy(() => import('./pages/AllSubcategories/AllSubcategories').then(m => ({ default: m.AllSubcategories })));
const PaymentCheckout = lazy(() => import('./pages/PaymentCheckout/PaymentCheckout').then(m => ({ default: m.PaymentCheckout })));
const Login = lazy(() => import('./pages/Login/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
import { logoutUser, validateSession } from './services/authService';


// Componente Raiz da Aplicação (Lumi App)
// Gerencia a navegação entre telas, autenticação, detalhes de categoria, favoritos, criação e tema global
function App() {
  // Estado para controlar a exibição da Splash Screen inicial
  const [showSplash, setShowSplash] = useState(true);

  // Estado da rota ativa da aplicação: se o usuário já estiver logado, inicia direto na 'home'
  const [currentScreen, setCurrentScreen] = useState(() => {
    const savedUserEmail = localStorage.getItem('lumi-user-email');
    return savedUserEmail ? 'home' : 'login';
  });

  // Validação segura de sessão em segundo plano ao iniciar o app
  useEffect(() => {
    async function verifyAuth() {
      const savedUserEmail = localStorage.getItem('lumi-user-email');
      if (savedUserEmail) {
        const session = await validateSession();
        // Se a sessão do Supabase expirou e não há usuário válido autenticado
        if (!session && savedUserEmail !== 'contato.lumiapp@gmail.com') {
          handleLogout();
        }
      }
    }
    verifyAuth();
  }, []);

  // Estado para armazenar o título da categoria/subcategoria selecionada pelo usuário
  const [selectedCategory, setSelectedCategory] = useState('Bebida | Comida');

  // Estado para armazenar os dados da seção/nicho para a tela 'Todas as Subcategorias'
  const [selectedSectionData, setSelectedSectionData] = useState({ title: '', cards: [] });

  // Estado global do tema: 'dark' (#231721) como padrão principal
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lumi-theme') || 'dark';
  });

  // Sincroniza o atributo data-theme no HTML raiz e persiste no localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lumi-theme', theme);
  }, [theme]);

  // Função para alternar entre Modo Escuro (padrão) e Modo Claro (opcional)
  const handleToggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Estado dos dados do usuário recém cadastrado aguardando pagamento
  const [pendingUser, setPendingUser] = useState(null);

  // Callback disparado quando o usuário realiza login
  const handleLoginSuccess = () => {
    setCurrentScreen('home');
  };

  // Callback disparado após preencher o cadastro: direciona para o Checkout Kiwify
  const handleRegisterSuccess = (userData) => {
    // Administrador supremo vai direto para a Home sem passar por pagamento
    if (userData?.isAdmin) {
      setCurrentScreen('home');
      return;
    }
    setPendingUser(userData);
    setCurrentScreen('payment');
  };

  // Callback disparado ao confirmar o pagamento com sucesso
  const handlePaymentConfirmed = () => {
    setCurrentScreen('home');
  };

  // Callback disparado ao realizar logout explícito
  const handleLogout = async () => {
    // Limpa todas as informações de sessão salvas localmente
    localStorage.removeItem('lumi-user-email');
    localStorage.removeItem('lumi-user-role');
    localStorage.removeItem('lumi-user-name');
    localStorage.removeItem('lumi-user-username');
    localStorage.removeItem('lumi-user-plan');

    // Executa encerramento de sessão no Supabase
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Erro ao encerrar sessão no Supabase:', err);
    }

    // Redireciona para a tela de autenticação
    setCurrentScreen('login');
  };

  // Função para transicionar para a página de detalhes de uma subcategoria específica (onde ficam as figurinhas)
  const handleSelectCategory = (categoryTitle) => {
    setSelectedCategory(categoryTitle || 'Bebida | Comida');
    setCurrentScreen('category-detail');
  };

  // Função para transicionar para a tela com todas as subcategorias de um nicho
  const handleSelectSection = (section) => {
    setSelectedSectionData({
      title: section.title,
      cards: section.cards || [],
    });
    setCurrentScreen('all-subcategories');
  };

  // Função para retornar para a Home
  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  // Função para alternar entre as abas principais
  const handleNavigate = (screenName) => {
    setCurrentScreen(screenName);
  };

  return (
    <div className={`app-root ${theme}`} data-theme={theme}>
      {/* Exibe a Splash Screen inicial animada */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Renderização condicional das telas com carregamento dinâmico (Code Splitting) */}
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#231721' }} />}>
        {currentScreen === 'login' && (
          <Login 
            theme={theme} 
            onLogin={handleLoginSuccess} 
            onNavigateToRegister={() => setCurrentScreen('register')}
            onNavigateToForgotPassword={() => setCurrentScreen('forgot-password')}
          />
        )}
        {currentScreen === 'forgot-password' && (
          <ForgotPassword
            theme={theme}
            onBackToLogin={() => setCurrentScreen('login')}
          />
        )}
        {currentScreen === 'register' && (
          <Register 
            theme={theme} 
            onRegisterSuccess={handleRegisterSuccess} 
            onBackToLogin={() => setCurrentScreen('login')}
          />
        )}
        {currentScreen === 'payment' && (
          <PaymentCheckout
            theme={theme}
            userData={pendingUser}
            onPaymentConfirmed={handlePaymentConfirmed}
            onBack={() => setCurrentScreen('register')}
          />
        )}
        {currentScreen === 'home' && (
          <Home 
            theme={theme} 
            onNavigate={handleNavigate} 
            onSelectCategory={handleSelectCategory}
            onSelectSection={handleSelectSection}
          />
        )}
        {currentScreen === 'all-subcategories' && (
          <AllSubcategories
            theme={theme}
            sectionTitle={selectedSectionData.title}
            subcategories={selectedSectionData.cards}
            onSelectSubcategory={handleSelectCategory}
            onBack={handleBackToHome}
          />
        )}
        {currentScreen === 'category-detail' && (
          <CategoryDetail 
            theme={theme} 
            categoryTitle={selectedCategory} 
            onBack={handleBackToHome} 
          />
        )}
        {currentScreen === 'favorites' && (
          <Favorites 
            theme={theme} 
            onNavigate={handleNavigate} 
          />
        )}
        {currentScreen === 'create-sticker' && (
          <CreateSticker 
            theme={theme} 
            onBack={handleBackToHome} 
          />
        )}
        {currentScreen === 'profile' && (
          <Profile 
            theme={theme} 
            onToggleTheme={handleToggleTheme} 
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        {currentScreen === 'admin' && (
          <AdminDashboard 
            theme={theme} 
            onBack={() => setCurrentScreen('profile')} 
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;

