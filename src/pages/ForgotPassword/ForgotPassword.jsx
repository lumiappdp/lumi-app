import { useState } from 'react';
import logoLight from '../../../identidade-visual/lumi-logo-icone-ve.png';
import logoDark from '../../../identidade-visual/lumi-logo-icone-ve (2).png';
import { sendRecoveryOtpEmail } from '../../services/emailService';
import { resetPasswordWithOtpVerified } from '../../services/authService';
import './ForgotPassword.css';

// Componente da Tela de Recuperação de Senha com Código OTP via EmailJS
// Executa o fluxo seguro em 3 etapas (E-mail -> Código de 6 dígitos -> Nova Senha)
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema visual da aplicação ('dark' ou 'light')
// @param {Function} props.onBackToLogin - Callback para retornar à tela de login
export function ForgotPassword({ theme = 'dark', onBackToLogin }) {
  // Controle da etapa atual: 'email' | 'otp' | 'new-password' | 'success'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Etapa 1: Gera o código de 6 dígitos e envia por e-mail via EmailJS
  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    // Gera código numérico aleatório de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      await sendRecoveryOtpEmail({ email: cleanEmail, code });
      setStep('otp');
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      setErrorMessage('Não foi possível enviar o e-mail. Verifique o endereço digitado ou tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2: Valida se o código digitado coincide com o gerado
  const handleVerifyCode = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (inputCode.trim() === generatedCode.trim()) {
      setStep('new-password');
    } else {
      setErrorMessage('Código incorreto. Verifique os 6 dígitos recebidos no seu e-mail.');
    }
  };

  // Etapa 3: Salva a nova senha definida pelo usuário
  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      // Salva a nova senha no Supabase de forma segura
      await resetPasswordWithOtpVerified({ email, newPassword });
      setStep('success');
    } catch (err) {
      console.error('Erro ao salvar nova senha:', err);
      setErrorMessage(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`forgot-page ${theme}`} data-theme={theme}>
      <div className="forgot-card-wrapper">
        {/* Bloco do Logotipo Oficial */}
        <div className="brand-logo-area">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Logo Lumi"
            className="brand-logo-img"
          />
        </div>

        {/* ETAPA 1: DIGITAR E-MAIL */}
        {step === 'email' && (
          <>
            <h1 className="forgot-title">Recuperar Senha</h1>
            <p className="forgot-subtitle">
              Digite seu e-mail para receber um código de 6 dígitos.
            </p>

            {errorMessage && (
              <div className="forgot-error-banner">
                {errorMessage}
              </div>
            )}

            <form className="forgot-form" onSubmit={handleSendCode}>
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
                  placeholder="Seu e-mail cadastrado"
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
                <button type="submit" className="forgot-submit-btn" disabled={isLoading}>
                  <span className="submit-btn-label">
                    {isLoading ? 'Enviando código...' : 'Enviar Código'}
                  </span>
                  <span className="arrow-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* ETAPA 2: DIGITAR CÓDIGO DE 6 DÍGITOS */}
        {step === 'otp' && (
          <>
            <h1 className="forgot-title">Digite o Código</h1>
            <p className="forgot-subtitle">
              Enviamos um código de 6 dígitos para <strong>{email}</strong>.
            </p>

            {errorMessage && (
              <div className="forgot-error-banner">
                {errorMessage}
              </div>
            )}

            <form className="forgot-form" onSubmit={handleVerifyCode}>
              {/* Campo para o Código OTP */}
              <div className="input-field-pill">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.25rem', fontWeight: 'bold' }}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Botão de Validação */}
              <div className="action-button-wrapper">
                <button type="submit" className="forgot-submit-btn">
                  <span className="submit-btn-label">Verificar Código</span>
                  <span className="arrow-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* ETAPA 3: DEFINIR NOVA SENHA */}
        {step === 'new-password' && (
          <>
            <h1 className="forgot-title">Criar Nova Senha</h1>
            <p className="forgot-subtitle">
              Defina sua nova senha de acesso para a conta.
            </p>

            {errorMessage && (
              <div className="forgot-error-banner">
                {errorMessage}
              </div>
            )}

            <form className="forgot-form" onSubmit={handleSaveNewPassword}>
              {/* Campo de Nova Senha */}
              <div className="input-field-pill">
                <span className="field-icon icon-pink">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova senha (mínimo 6 dígitos)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
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

              {/* Confirmar Nova Senha */}
              <div className="input-field-pill">
                <span className="field-icon icon-pink">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Botão para Salvar Senha */}
              <div className="action-button-wrapper">
                <button type="submit" className="forgot-submit-btn" disabled={isLoading}>
                  <span className="submit-btn-label">
                    {isLoading ? 'Salvando senha...' : 'Salvar Nova Senha'}
                  </span>
                  <span className="arrow-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* ETAPA FINAL: SUCESSO */}
        {step === 'success' && (
          <div className="forgot-success-box">
            <div className="success-icon-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#231721" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="success-box-title">Senha alterada com sucesso!</h2>
            <p className="success-box-desc">
              Sua nova senha já está ativa. Você já pode acessar sua conta normalmente.
            </p>
            <button type="button" className="forgot-submit-btn" onClick={onBackToLogin}>
              <span>Ir para o Login</span>
            </button>
          </div>
        )}

        {/* Botão Voltar */}
        {step !== 'success' && (
          <div className="forgot-links-footer">
            <button 
              type="button" 
              className="text-link font-medium back-btn"
              onClick={onBackToLogin}
            >
              ← Voltar para o Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
