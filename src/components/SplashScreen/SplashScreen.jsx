import { useEffect, useState } from 'react';
// Importação da logo original oficial da marca Lumi
import lumiLogoOriginal from '../../../identidade-visual/lumi-logo-icone-ve.png';
import './SplashScreen.css';

// Componente de Splash Screen com animação orgânica
// Utiliza a imagem oficial da marca Lumi e executa a transição de revelação
// @param {Object} props - Propriedades do componente
// @param {Function} props.onFinish - Callback disparado após o término da animação
export function SplashScreen({ onFinish }) {
  // Estado para controlar a classe de saída com fade-out suave
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Inicia a transição de fade-out aos 2.6 segundos
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2600);

    // Conclui a splash e chama o callback aos 3.2 segundos
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3200);

    // Limpeza de timers ao desmontar o componente
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen-container ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="splash-logo-wrapper">
        {/* Aura de iluminação suave atrás da logo oficial */}
        <div className="splash-glow-aura" aria-hidden="true"></div>

        {/* Imagem original da Logo Lumi com animação orgânica de revelação */}
        <img
          src={lumiLogoOriginal}
          alt="Lumi App"
          className="splash-original-logo"
        />
      </div>
    </div>
  );
}

export default SplashScreen;
