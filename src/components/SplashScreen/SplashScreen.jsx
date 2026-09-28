import { useEffect, useState } from 'react';
// Importação da logo original oficial da marca Lumi
import lumiLogoOriginal from '../../../identidade-visual/lumi-logo-icone-ve.png';
import './SplashScreen.css';

// Componente de Splash Screen com animação orgânica e som cintilante de entrada
// Utiliza a imagem oficial da marca Lumi e executa a transição de revelação
// @param {Object} props - Propriedades do componente
// @param {Function} props.onFinish - Callback disparado após o término da animação
export function SplashScreen({ onFinish }) {
  // Estado para controlar a classe de saída com fade-out suave
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let audioPlayed = false;

    // Efeito sonoro harmônico e suave de abertura estilo 'luz/chime'
    const playLumiChime = () => {
      if (audioPlayed) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        // Garante que o contexto saia do estado suspenso do navegador
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        audioPlayed = true;

        // Notas cintilantes que formam um acorde brilhante e acolhedor (E5, B5, G#6)
        const notes = [659.25, 987.77, 1661.22];

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Volume e envelope de som nítido e elegante
          const startTime = ctx.currentTime + idx * 0.12;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.35, startTime + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 1.8);
        });
      } catch (err) {
        console.warn('Áudio bloqueado pelo navegador até primeira interação:', err);
      }
    };

    // Dispara o efeito sonoro de abertura
    playLumiChime();

    // Se o navegador bloquear o autoplay inicial, toca no primeiro clique ou toque
    const handleUserGesture = () => playLumiChime();
    window.addEventListener('pointerdown', handleUserGesture, { once: true });
    window.addEventListener('keydown', handleUserGesture, { once: true });

    // Inicia a transição de fade-out aos 2.6 segundos
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2600);

    // Conclui a splash e chama o callback aos 3.2 segundos
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3200);

    // Limpeza de timers e listeners ao desmontar o componente
    return () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
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
