import { useState } from 'react';
// Importação das logos originais da identidade visual do Lumi App
import logoLight from '../../../identidade-visual/lumi-logo-icone-ve.png';
import logoDark from '../../../identidade-visual/lumi-logo-icone-ve (2).png';
import { loginUser, checkIsAdmin } from '../../services/authService';
import './Login.css';

// Componente principal da Tela de Login do Lumi App
// Suporta tema dinâmico e formulário completo com ícones e visibilidade de senha
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('light' ou 'dark')
// @param {Function} props.onLogin - Callback acionado quando o usuário clica em Entrar
// @param {Function} props.onNavigateToRegister - Callback para navegar até a tela de cadastro
// @param {Function} props.onNavigateToForgotPassword - Callback para navegar até a recuperação de senha
export function Login({ theme = 'dark', onLogin, onNavigateToRegister, onNavigateToForgotPassword }) {
  // Estados dos campos de entrada de dados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado que controla se a senha está visível em texto puro ou oculta
  const [showPassword, setShowPassword] = useState(false);

  // Função de tratamento do submit do formulário de autenticação estrita
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Verificação Estrita do Administrador Supremo
    if (trimmedEmail === 'contato.lumiapp@gmail.com') {
      if (password === 'Ann4$19#03') {
        localStorage.setItem('lumi-user-email', trimmedEmail);
        localStorage.setItem('lumi-user-role', 'admin');
        localStorage.setItem('lumi-user-name', 'Administrador Supremo');
        if (onLogin) onLogin({ email: trimmedEmail, isAdmin: true });
        setIsLoading(false);
        return;
      } else {
        setErrorMessage('Senha incorreta para a conta de administrador.');
        setIsLoading(false);
        return;
      }
    }

    // 2. Verificação Estrita de Usuários Comuns no Supabase
    try {
      const data = await loginUser({ email: trimmedEmail, password });
      if (!data?.user) {
        throw new Error('Usuário ou senha incorretos.');
      }

      // Validação de Segurança: Bloqueia acesso se a assinatura não estiver ativa/paga
      const isPaid = await checkPaymentStatus(trimmedEmail);
      if (!isPaid) {
        setErrorMessage('Sua assinatura não está ativa ou expirou. Efetue o pagamento para liberar seu acesso.');
        setIsLoading(false);
        return;
      }

      // Recupera metadados do usuário salvos no Supabase
      const userMeta = data?.user?.user_metadata || {};
      if (userMeta.name) localStorage.setItem('lumi-user-name', userMeta.name);
      if (userMeta.username) localStorage.setItem('lumi-user-username', userMeta.username);
      if (userMeta.plan) localStorage.setItem('lumi-user-plan', userMeta.plan);

      localStorage.setItem('lumi-user-email', trimmedEmail);
      localStorage.setItem('lumi-user-role', 'user');
      if (onLogin) onLogin({ email: trimmedEmail, isAdmin: false });
    } catch (err) {
      setErrorMessage(err.message || 'E-mail ou senha incorretos. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-page ${theme}`} data-theme={theme}>
      {/* Container central do formulário de login */}
      <div className="login-card-wrapper">
        {/* Bloco do Logotipo Original que reage ao tema global */}
        <div className="brand-logo-area">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Logo Lumi"
            className="brand-logo-img"
          />
        </div>

        {/* Mensagem de acolhimento em itálico */}
        <p className="welcome-text">Olá, como é bom te ver por aqui!</p>

        {/* Mensagem de Erro de Autenticação */}
        {errorMessage && (
          <div className="login-error-banner" style={{
            background: 'rgba(234, 161, 172, 0.2)',
            border: '1.5px solid #EAA1AC',
            color: '#FFD2D8',
            borderRadius: '12px',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {errorMessage}
          </div>
        )}

        {/* Formulário de Login */}
        <form className="login-input-form" onSubmit={handleLoginSubmit}>
          {/* Campo de Entrada de Email */}
          <div className="input-field-pill">
            <span className="field-icon icon-pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {/* Botão X para apagar tudo que foi digitado no usuário */}
            {email && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setEmail('')}
                aria-label="Limpar campo de e-mail"
              >
                ✕
              </button>
            )}
          </div>

          {/* Campo de Entrada de Senha */}
          <div className="input-field-pill">
            <span className="field-icon icon-pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {/* Botão de alternar visualização da senha */}
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>

          {/* Botão de Submissão "Entrar" com seta */}
          <div className="action-button-wrapper">
            <button type="submit" className="submit-enter-btn">
              <span className="submit-btn-label">Entrar</span>
              <span className="arrow-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
          </div>
        </form>

        {/* Links de navegação secundária (Recuperar Senha e Cadastro) */}
        <div className="login-links-footer">
          <button
            type="button"
            onClick={onNavigateToForgotPassword}
            className="text-link"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Esqueceu a senha?
          </button>
          <button 
            type="button" 
            onClick={onNavigateToRegister}
            className="text-link font-medium"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
