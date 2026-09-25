import { useEffect, useState } from 'react';
import { SplashScreen } from './components/SplashScreen/SplashScreen';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Home } from './pages/Home/Home';
import { Profile } from './pages/Profile/Profile';
import { CategoryDetail } from './pages/CategoryDetail/CategoryDetail';
import { Favorites } from './pages/Favorites/Favorites';
import { CreateSticker } from './pages/CreateSticker/CreateSticker';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AllSubcategories } from './pages/AllSubcategories/AllSubcategories';
import { PaymentCheckout } from './pages/PaymentCheckout/PaymentCheckout';
import { ForgotPassword } from './pages/ForgotPassword/ForgotPassword';

// Componente Raiz da Aplicação (Lumi App)
// Gerencia a navegação entre telas, autenticação, detalhes de categoria, favoritos, criação e tema global
function App() {
  // Estado para controlar a exibição da Splash Screen inicial
  const [showSplash, setShowSplash] = useState(true);

  // Estado da rota ativa da aplicação ('login', 'register', 'home', 'profile', 'category-detail', 'favorites', 'create-sticker', 'admin' ou 'all-subcategories')
  const [currentScreen, setCurrentScreen] = useState('login');

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

  // Callback disparado ao realizar logout
  const handleLogout = () => {
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

      {/* Renderização condicional das telas */}
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
    </div>
  );
}

export default App;

