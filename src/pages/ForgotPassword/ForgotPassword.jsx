import { useState } from 'react';
import logoLight from '../../../identidade-visual/lumi-logo-icone-ve.png';
import logoDark from '../../../identidade-visual/lumi-logo-icone-ve (2).png';
import { sendPasswordResetEmail } from '../../services/authService';
import './ForgotPassword.css';

// Componente da Tela de Recuperação de Senha do Lumi App
// Permite que o usuário solicite um link seguro via e-mail do Supabase para redefinir a senha
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema visual ('dark' ou 'light')
// @param {Function} props.onBackToLogin - Callback para retornar à tela de login
export function ForgotPassword({ theme = 'dark', onBackToLogin }) {
  // Estado do campo de e-mail
  const [email, setEmail] = useState('');
  // Estados de controle de carregamento, sucesso e erro
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Manipulador de submissão do formulário de redefinição
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();

    try {
      await sendPasswordResetEmail(trimmedEmail);
      setIsSuccess(true);
    } catch (err) {
      console.error('Erro ao solicitar redefinição:', err);
      setErrorMessage(err.message || 'Erro ao enviar e-mail. Verifique o endereço digitado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`forgot-page ${theme}`} data-theme={theme}>
      <div className="forgot-card-wrapper">
        {/* Bloco do Logotipo Original */}
        <div className="brand-logo-area">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Logo Lumi"
            className="brand-logo-img"
          />
        </div>

        <h1 className="forgot-title">Recuperar Senha</h1>
        <p className="forgot-subtitle">
          Digite seu e-mail cadastrado para receber as instruções de redefinição de acesso.
        </p>

        {/* Mensagem de Sucesso */}
        {isSuccess ? (
          <div className="forgot-success-box">
            <div className="success-icon-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#231721" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="success-box-title">E-mail enviado!</h2>
            <p className="success-box-desc">
              Enviamos um link seguro para <strong>{email}</strong>. Verifique sua caixa de entrada e pasta de spam para criar sua nova senha.
            </p>
            <button type="button" className="forgot-submit-btn" onClick={onBackToLogin}>
              <span>Voltar ao Login</span>
            </button>
          </div>
        ) : (
          <form className="forgot-form" onSubmit={handleSubmit}>
            {/* Banner de Erro */}
            {errorMessage && (
              <div className="forgot-error-banner">
                {errorMessage}
              </div>
            )}

            {/* Campo de Entrada de Email */}
            <div className="input-field-pill">
              <span className="field-icon icon-pink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email cadastrado"
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
                  aria-label="Limpar campo de e-mail"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botão de Envio */}
            <div className="action-button-wrapper">
              <button type="submit" className="forgot-submit-btn" disabled={isSubmitting}>
                <span className="submit-btn-label">
                  {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                </span>
                <span className="arrow-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Botão para voltar */}
            <div className="forgot-links-footer">
              <button 
                type="button" 
                className="text-link font-medium back-btn"
                onClick={onBackToLogin}
              >
                ← Voltar para o Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
