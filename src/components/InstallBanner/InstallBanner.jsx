import { useState, useEffect } from 'react';
import './InstallBanner.css';

// Componente do Banner de Instalação do PWA
// Identifica o dispositivo da usuária (Android / iOS) e permite instalar o Lumi App com 1 toque
// @param {Object} props
// @param {Function} props.onOpenGuide - Função para abrir o modal com tutorial passo a passo
export function InstallBanner({ onOpenGuide }) {
  // Evento nativo de prompt de instalação capturado pelo navegador
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // Controla a visibilidade do banner
  const [isVisible, setIsVisible] = useState(false);
  // Detecta se o dispositivo é iOS
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Verifica se o app já está rodando em modo instalado (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // Verifica se a usuária fechou o banner recentemente (não incomodar por 3 dias)
    const isDismissed = localStorage.getItem('lumi-pwa-dismissed');
    if (isDismissed) {
      const dismissedTime = parseInt(isDismissed, 10);
      if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Detecta iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    if (isAppleDevice) {
      setIsVisible(true);
    }

    // Captura o evento nativo de instalação do Android / Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Manipulador do clique no botão de instalação
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Dispara o prompt nativo de instalação do Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // No iOS ou navegadores sem prompt automático, abre o tutorial explicativo
      if (onOpenGuide) onOpenGuide();
    }
  };

  // Fecha o banner e salva a preferência
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('lumi-pwa-dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="install-pwa-banner">
      <div className="install-pwa-left">
        <span className="install-pwa-icon">📲</span>
        <div className="install-pwa-text">
          <strong className="install-pwa-title">Instalar o Lumi App</strong>
          <span className="install-pwa-sub">
            {isIos ? 'Adicione à tela inicial para tela cheia' : 'Acesse com 1 toque no celular'}
          </span>
        </div>
      </div>

      <div className="install-pwa-actions">
        <button 
          type="button" 
          className="install-pwa-btn"
          onClick={handleInstallClick}
        >
          {deferredPrompt ? 'Instalar' : 'Como instalar'}
        </button>
        <button 
          type="button" 
          className="install-pwa-close" 
          onClick={handleDismiss}
          aria-label="Fechar banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default InstallBanner;
