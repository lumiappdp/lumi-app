import { useState } from 'react';
import logoLight from '../../../identidade-visual/lumi-logo-icone-ve.png';
import logoDark from '../../../identidade-visual/lumi-logo-icone-ve (2).png';
import { registerUser, checkIsAdmin } from '../../services/authService';
import './Register.css';

// Componente da Página de Cadastro do Lumi App
// Permite que novos usuários se cadastrem e escolham o plano ideal (Anual ou Mensal)
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('light' ou 'dark')
// @param {Function} props.onRegisterSuccess - Callback acionado após conclusão do cadastro
// @param {Function} props.onBackToLogin - Callback para retornar à tela de login
export function Register({ theme = 'dark', onRegisterSuccess, onBackToLogin }) {
  // Estados dos campos de entrada de dados
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado do plano selecionado pelo usuário ('annual' ou 'monthly')
  const [selectedPlan, setSelectedPlan] = useState('annual');

  // Planos disponíveis com benefícios e valores
  const plans = [
    {
      id: 'annual',
      title: 'Plano Anual',
      tag: 'Mais vantajoso ⭐',
      price: 'R$ 89,90',
      period: '/ano (equivale a R$ 7,49/mês)',
      description: 'Acesso total a todos os packs, fontes exclusivas e atualizações semanais.',
    },
    {
      id: 'monthly',
      title: 'Plano Mensal',
      tag: 'Flexível',
      price: 'R$ 14,90',
      period: '/mês',
      description: 'Acesso completo a todas as figurinhas com cobrança mês a mês.',
    },
  ];

  // Manipulador de submissão do formulário de cadastro validado com Supabase
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const formattedUsername = cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`;

    // Validação de senha mínima
    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    const isAdmin = checkIsAdmin(trimmedEmail);

    try {
      const data = await registerUser({
        name: name.trim(),
        username: formattedUsername,
        email: trimmedEmail,
        password,
        plan: selectedPlan,
      });

      if (!data?.user) {
        throw new Error('Não foi possível concluir o cadastro.');
      }

      // Salva sessão localmente
      localStorage.setItem('lumi-user-name', name.trim());
      localStorage.setItem('lumi-user-username', formattedUsername);
      localStorage.setItem('lumi-user-email', trimmedEmail);
      localStorage.setItem('lumi-user-plan', selectedPlan);
      localStorage.setItem('lumi-user-role', isAdmin ? 'admin' : 'user');

      if (onRegisterSuccess) {
        onRegisterSuccess({ 
          name: name.trim(), 
          username: formattedUsername,
          email: trimmedEmail, 
          plan: selectedPlan, 
          isAdmin 
        });
      }
    } catch (err) {
      console.error('Erro no cadastro:', err);
      if (err.message && err.message.toLowerCase().includes('already registered')) {
        setErrorMessage('Este e-mail já está cadastrado. Faça login ou utilize outro.');
      } else {
        setErrorMessage(err.message || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`register-page ${theme}`} data-theme={theme}>
      <div className="register-card-wrapper">
        {/* Bloco do Logotipo Original */}
        <div className="brand-logo-area">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Logo Lumi"
            className="brand-logo-img"
          />
        </div>

        <h1 className="register-title">Crie sua conta</h1>
        <p className="register-subtitle">Escolha seu plano e desbloqueie todas as figurinhas</p>

        {/* Alerta de erro de cadastro */}
        {errorMessage && (
          <div className="register-error-banner" style={{
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

        {/* Formulário de Cadastro */}
        <form className="register-form" onSubmit={handleRegisterSubmit}>
          {/* Campo Nome Completo */}
          <div className="input-field-pill">
            <span className="field-icon icon-pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            {name && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setName('')}
                aria-label="Limpar nome"
              >
                ✕
              </button>
            )}
          </div>

          {/* Campo Nome de Usuário (@handle) */}
          <div className="input-field-pill">
            <span className="field-icon icon-pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Nome de usuário (ex: annaflavia)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              required
              autoComplete="username"
            />
            {username && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setUsername('')}
                aria-label="Limpar nome de usuário"
              >
                ✕
              </button>
            )}
          </div>

          {/* Campo Email */}
          <div className="input-field-pill">
            <span className="field-icon icon-pink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
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
            {email && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setEmail('')}
                aria-label="Limpar e-mail"
              >
                ✕
              </button>
            )}
          </div>

          {/* Campo Senha */}
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
              placeholder="Crie uma senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
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

          {/* Seção de Escolha de Planos */}
          <div className="plan-selection-section">
            <h2 className="plan-section-title">Escolha seu plano:</h2>
            <div className="plan-cards-grid">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    className={`plan-card-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="plan-header-row">
                      <span className="plan-title">{plan.title}</span>
                      <span className="plan-tag-badge">{plan.tag}</span>
                    </div>
                    <div className="plan-price-row">
                      <span className="plan-price-value">{plan.price}</span>
                      <span className="plan-price-period">{plan.period}</span>
                    </div>
                    <p className="plan-desc">{plan.description}</p>
                    
                    {/* Indicador de Seleção Visual */}
                    <div className="plan-radio-circle">
                      {isSelected && <div className="plan-radio-inner" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão de Finalização de Cadastro */}
          <div className="action-button-wrapper">
            <button type="submit" className="submit-enter-btn">
              <span className="submit-btn-label">Cadastrar e começar</span>
              <span className="arrow-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
          </div>
        </form>

        {/* Link para voltar ao Login */}
        <div className="login-links-footer">
          <button 
            type="button" 
            className="text-link font-medium back-to-login-btn"
            onClick={onBackToLogin}
          >
            Já possui uma conta? <span className="underline-text">Entrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
