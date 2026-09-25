import { useState, useEffect } from 'react';
import logoLight from '../../../identidade-visual/lumi-logo-icone-ve.png';
import logoDark from '../../../identidade-visual/lumi-logo-icone-ve (2).png';
import { checkPaymentStatus } from '../../services/authService';
import './PaymentCheckout.css';

// Componente de Checkout e Confirmação de Pagamento Kiwify
// Redireciona a usuária para o checkout oficial da Kiwify e monitora o pagamento em tempo real
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema visual ('dark' ou 'light')
// @param {Object} props.userData - Dados da usuária cadastrada { email, name, plan }
// @param {Function} props.onPaymentConfirmed - Callback acionado quando o pagamento for aprovado
// @param {Function} props.onBack - Callback para voltar ao cadastro
export function PaymentCheckout({ theme = 'dark', userData, onPaymentConfirmed, onBack }) {
  // Estado para indicar se está verificando o status do pagamento
  const [checking, setChecking] = useState(false);
  // Estado para armazenar mensagens de feedback ou erro
  const [statusMessage, setStatusMessage] = useState('Aguardando confirmação do pagamento...');

  // Definição dos links de checkout da Kiwify para cada plano
  // É possível preencher os parâmetros ?email= e &name= para facilitar o preenchimento automático
  const KIWIFY_LINKS = {
    annual: 'https://pay.kiwify.com.br/vuoMzHN', // Substituir pelo link real gerado na Kiwify
    monthly: 'https://pay.kiwify.com.br/qgrB5dy', // Substituir pelo link real gerado na Kiwify
  };

  const selectedPlanId = userData?.plan || 'annual';
  const isAnnual = selectedPlanId === 'annual';
  const planTitle = isAnnual ? 'Plano Anual' : 'Plano Mensal';
  const planPrice = isAnnual ? 'R$ 89,90' : 'R$ 14,90';
  const planPeriod = isAnnual ? '/ano' : '/mês';

  // Monta a URL da Kiwify passando os dados cadastrados
  const baseUrl = KIWIFY_LINKS[selectedPlanId] || KIWIFY_LINKS.annual;
  const kiwifyCheckoutUrl = `${baseUrl}?email=${encodeURIComponent(userData?.email || '')}&name=${encodeURIComponent(userData?.name || '')}`;

  // Abre a página de checkout da Kiwify em nova aba
  const handleOpenKiwify = () => {
    window.open(kiwifyCheckoutUrl, '_blank');
  };

  // Efeito para verificar automaticamente a liberação do pagamento via polling/Supabase
  useEffect(() => {
    let isMounted = true;

    // Intervalo para checagem a cada 5 segundos
    const interval = setInterval(async () => {
      if (!userData?.email) return;

      try {
        const isPaid = await checkPaymentStatus(userData.email);
        if (isPaid && isMounted) {
          setStatusMessage('Pagamento confirmado com sucesso! Liberando acesso...');
          clearInterval(interval);
          setTimeout(() => {
            if (onPaymentConfirmed) onPaymentConfirmed();
          }, 1500);
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userData, onPaymentConfirmed]);

  // Função para checagem manual ao clicar no botão "Já realizei o pagamento"
  const handleManualCheck = async () => {
    setChecking(true);
    setStatusMessage('Verificando com o sistema Kiwify...');
    try {
      const isPaid = await checkPaymentStatus(userData?.email);
      if (isPaid) {
        setStatusMessage('Pagamento aprovado! Seja bem-vinda ao Lumi!');
        setTimeout(() => {
          if (onPaymentConfirmed) onPaymentConfirmed();
        }, 1200);
      } else {
        setStatusMessage('Pagamento ainda não confirmado. Se acabou de pagar no PIX, aguarde alguns segundos.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Não foi possível verificar agora. Tente novamente em instantes.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={`payment-page ${theme}`} data-theme={theme}>
      <div className="payment-card-wrapper">
        {/* Bloco do Logotipo Original */}
        <div className="brand-logo-area">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Logo Lumi"
            className="brand-logo-img"
          />
        </div>

        <h1 className="payment-title">Quase lá! ✨</h1>
        <p className="payment-subtitle">
          Finalize o pagamento seguro para liberar seu acesso instantâneo ao Lumi.
        </p>

        {/* Resumo do Plano Escolhido */}
        <div className="plan-summary-card">
          <div className="plan-summary-header">
            <span className="summary-label">Plano Selecionado</span>
            <span className="summary-badge">{isAnnual ? 'Melhor Oferta ⭐' : 'Flexível'}</span>
          </div>
          <div className="summary-main">
            <h2 className="summary-plan-name">{planTitle}</h2>
            <div className="summary-price">
              <span className="price-val">{planPrice}</span>
              <span className="price-unit">{planPeriod}</span>
            </div>
          </div>
          <p className="summary-email-dest">
            Acesso vinculado a: <strong>{userData?.email}</strong>
          </p>
        </div>

        {/* Botão de Abertura do Checkout Kiwify */}
        <div className="kiwify-action-section">
          <button
            type="button"
            className="kiwify-checkout-btn"
            onClick={handleOpenKiwify}
          >
            <span>Ir para Pagamento Seguro (Kiwify)</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
          <p className="kiwify-hint">
            Aceita <strong>PIX imediato</strong> ou <strong>Cartão de Crédito</strong>.
          </p>
        </div>

        {/* Status de Verificação Automática */}
        <div className="live-status-box">
          <div className="spinner-indicator">
            <div className="pulse-dot" />
          </div>
          <p className="status-text">{statusMessage}</p>
        </div>

        {/* Botão de Verificação Manual */}
        <button
          type="button"
          className="check-paid-btn"
          onClick={handleManualCheck}
          disabled={checking}
        >
          {checking ? 'Checando pagamento...' : 'Já realizei o pagamento ↻'}
        </button>

        {/* Botão Voltar */}
        {onBack && (
          <button type="button" className="back-link-btn" onClick={onBack}>
            ← Trocar de plano ou dados
          </button>
        )}
      </div>
    </div>
  );
}

export default PaymentCheckout;
