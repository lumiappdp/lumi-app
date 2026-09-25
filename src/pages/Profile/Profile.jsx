import { useState, useRef } from 'react';
import { checkIsAdmin, deleteAccountUser } from '../../services/authService';
import { LegalModal } from '../Legal/LegalModal';
import { LEGAL_DOCS } from '../Legal/legalContent';
import './Profile.css';

// Componente da Página de Perfil do Usuário
// Exibe informações da conta, status da assinatura, foto de perfil personalizável e preferências do app
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('light' ou 'dark')
// @param {Function} props.onToggleTheme - Função para alternar entre Modo Claro e Escuro
// @param {Function} props.onNavigate - Callback para transicionar entre telas ('home' ou 'profile')
// @param {Function} props.onLogout - Callback para realizar logout e voltar ao login
export function Profile({ theme = 'dark', onToggleTheme, onNavigate, onLogout }) {
  // Referência para o input de arquivo oculto
  const fileInputRef = useRef(null);

  // Estado para controlar qual modal legal/suporte está aberto
  const [activeModalDoc, setActiveModalDoc] = useState(null);

  // Estado da foto de perfil com persistência no localStorage
  const [profilePhoto, setProfilePhoto] = useState(() => {
    return localStorage.getItem('lumi-profile-photo') || null;
  });

  // Manipulador para carregar e salvar a nova foto de perfil
  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result;
        setProfilePhoto(base64Image);
        localStorage.setItem('lumi-profile-photo', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  // Recupera e-mail e dados do usuário logado
  const userEmail = localStorage.getItem('lumi-user-email') || '';
  const isSuperAdmin = userEmail.toLowerCase() === 'contato.lumiapp@gmail.com';
  const userFullName = localStorage.getItem('lumi-user-name') || '';
  const rawUsername = localStorage.getItem('lumi-user-username');
  const userUsername = rawUsername 
    ? (rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`)
    : (isSuperAdmin ? '@admin' : (userFullName ? `@${userFullName.toLowerCase().replace(/\s+/g, '')}` : '@lumier'));
  const userPlan = localStorage.getItem('lumi-user-plan') === 'monthly' ? 'Plano mensal' : 'Plano anual';

  // Lista de itens de menu do perfil com exibição EXCLUSIVA do Painel Admin para contato.lumiapp@gmail.com
  const menuItems = [
    ...(isSuperAdmin ? [{
      id: 'admin',
      label: 'Painel do Administrador 👑',
      onClick: () => onNavigate && onNavigate('admin'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAA1AC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    }] : []),
    {
      id: 'install-guide',
      label: 'Como instalar no celular 📲',
      onClick: () => setActiveModalDoc(LEGAL_DOCS.install),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAA1AC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      ),
    },
    {
      id: 'privacy',
      label: 'Política de Privacidade',
      onClick: () => setActiveModalDoc(LEGAL_DOCS.privacy),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
    },
    {
      id: 'terms',
      label: 'Termos de uso',
      onClick: () => setActiveModalDoc(LEGAL_DOCS.terms),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
    },
    {
      id: 'lgpd',
      label: 'LGPD & Privacidade',
      onClick: () => setActiveModalDoc(LEGAL_DOCS.lgpd),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    },
    {
      id: 'support',
      label: 'Suporte & Ajuda',
      onClick: () => setActiveModalDoc(LEGAL_DOCS.support),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      id: 'instagram',
      label: 'Instagram Oficial',
      onClick: () => window.open('https://instagram.com/lumiapp', '_blank'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      ),
    },
    {
      id: 'logout',
      label: 'Sair da conta',
      onClick: onLogout,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      ),
    },
    {
      id: 'delete-account',
      label: 'Apagar conta',
      isDanger: true,
      onClick: async () => {
        if (isAdmin) {
          alert('A conta do Administrador Supremo não pode ser excluída.');
          return;
        }

        const confirmed = window.confirm(
          'Atenção: Tem certeza de que deseja apagar sua conta? Todos os seus dados, favoritos e acesso serão permanentemente excluídos.'
        );

        if (confirmed) {
          try {
            await deleteAccountUser(userEmail);
            localStorage.clear();
            if (onLogout) onLogout();
            alert('Sua conta foi excluída com sucesso.');
          } catch (err) {
            alert(err.message || 'Erro ao excluir conta. Tente novamente.');
          }
        }
      },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      ),
    },
  ];

  return (
    <div className={`profile-container ${theme}`} data-theme={theme}>
      {/* Input de arquivo invisível para seleção de foto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Topo / Header */}
      <header className="profile-header">
        <h1 className="profile-page-title">Perfil</h1>
      </header>

      {/* Bloco do Avatar e Informações da Conta */}
      <section className="profile-user-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-circle">
            {profilePhoto ? (
              <img 
                src={profilePhoto} 
                alt="Foto de perfil do usuário" 
                className="profile-user-avatar-img" 
              />
            ) : (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          <button 
            type="button" 
            className="avatar-edit-badge" 
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            aria-label="Alterar foto de perfil"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>

        {/* Nome de usuário @ em destaque e plano ativo */}
        <h2 className="user-name">{userUsername}</h2>
        {userFullName && <p className="user-fullname-sub" style={{ fontSize: '0.85rem', color: '#8E8E93', marginTop: '-0.2rem', marginBottom: '0.3rem' }}>{userFullName}</p>}
        <p className="user-subscription">Assinatura: {userPlan}</p>
      </section>

      {/* Lista de Configurações e Ações */}
      <section className="profile-menu-list">
        {/* Item: Alternar Tema Escuro Funcional Conectado ao App */}
        <div className="menu-item-row toggle-row">
          <div className="menu-item-left">
            <span className="menu-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </span>
            <span className="menu-item-label">Tema escuro</span>
          </div>
          <label className="theme-toggle-label" title="Alternar Modo Claro / Escuro">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={onToggleTheme}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Demais opções do menu */}
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-item-row ${item.isDanger ? 'danger-item' : ''}`}
            onClick={item.onClick || (() => console.log('Clicou em:', item.label))}
          >
            <div className="menu-item-left">
              <span className="menu-item-icon">{item.icon}</span>
              <span className="menu-item-label">{item.label}</span>
            </div>
            <span className="menu-item-chevron">›</span>
          </button>
        ))}
      </section>

      {/* Barra de Navegação Inferior Estilo Dock iOS com Botão Hero Central */}
      <nav className="bottom-nav-bar" aria-label="Navegação principal">
        {/* Início */}
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigate && onNavigate('home')}
          aria-label="Início"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <path d="M9 22V12h6v10"></path>
          </svg>
        </button>

        {/* Botão Hero Central de Favoritos */}
        <button 
          type="button" 
          className="floating-action-plus" 
          onClick={() => onNavigate && onNavigate('favorites')}
          aria-label="Favoritos"
          title="Favoritos"
        >
          <svg width="25" height="25" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Perfil Ativo */}
        <button
          type="button"
          className="nav-item active"
          onClick={() => onNavigate && onNavigate('profile')}
          aria-label="Perfil de Usuário"
          title="Perfil"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </nav>

      {/* Modal Institucional e Legal do Lumi App */}
      {activeModalDoc && (
        <LegalModal
          theme={theme}
          docData={activeModalDoc}
          onClose={() => setActiveModalDoc(null)}
        />
      )}
    </div>
  );
}

export default Profile;
