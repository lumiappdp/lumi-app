import { useState, useRef } from 'react';
import { clipboardService } from '../../services/clipboardService';
import { recentService } from '../../services/recentService';
import { usageService } from '../../services/usageService';
import './StickerPreviewModal.css';

// Componente Modal para visualização ampliada e cópia de stickers
// Permite ao usuário inspecionar os detalhes do sticker antes de copiar para o Story
// @param {Object} props - Propriedades do componente
// @param {Object|null} props.sticker - Objeto de dados do sticker a ser exibido
// @param {string} props.theme - Tema ativo da aplicação ('dark' ou 'light')
// @param {boolean} props.isFavorited - Indica se o sticker atual está nos favoritos
// @param {Function} props.onToggleFavorite - Função de callback para favoritar/desfavoritar
// @param {Function} props.onClose - Função de callback para fechar a visualização
// @param {Function} [props.onAfterCopy] - Callback opcional disparado após a cópia bem-sucedida
export function StickerPreviewModal({
  sticker,
  theme = 'dark',
  isFavorited = false,
  onToggleFavorite,
  onClose,
  onAfterCopy
}) {
  // Referência do elemento do sticker para captura e rasterização
  const previewContentRef = useRef(null);
  
  // Estado local para controle do texto e feedback do botão de cópia
  const [copyStatus, setCopyStatus] = useState({ copying: false, text: 'Copiar Figurinha', success: false });

  if (!sticker) return null;

  // Executa a cópia do sticker ampliado para a área de transferência do dispositivo
  const handleCopy = async () => {
    setCopyStatus({ copying: true, text: 'Copiando...', success: false });

    let result;

    // Caso o sticker possua imagem direta em URL (Supabase Storage ou upload do usuário)
    if (sticker.image_url || sticker.imageData) {
      result = await clipboardService.copyStickerImage({
        id: sticker.id,
        title: sticker.title || sticker.mainText || sticker.label || 'Sticker Lumi',
        imageUrl: sticker.image_url || sticker.imageData,
      });
    } else {
      // Captura e rasterização do elemento tipográfico ou SVG renderizado
      result = await clipboardService.copyStickerImage({
        id: sticker.id,
        title: sticker.mainText || sticker.label || sticker.title || 'Sticker Lumi',
        domElement: previewContentRef.current,
      });
    }

    if (result.success) {
      // Registra nos recentes e contabiliza clique de uso
      recentService.addRecent(sticker);
      usageService.recordUsage(sticker);
      if (onAfterCopy) onAfterCopy(sticker);

      setCopyStatus({ copying: false, text: 'Copiado para o Story!', success: true });
      setTimeout(() => {
        setCopyStatus({ copying: false, text: 'Copiar Figurinha', success: false });
      }, 2000);
    } else {
      setCopyStatus({ copying: false, text: 'Erro ao copiar', success: false });
      setTimeout(() => {
        setCopyStatus({ copying: false, text: 'Copiar Figurinha', success: false });
      }, 2000);
    }
  };

  return (
    <div className={`sticker-preview-overlay ${theme}`} onClick={onClose} role="dialog" aria-modal="true">
      {/* Container principal do card com parada de propagação para não fechar ao clicar dentro */}
      <div 
        className="sticker-preview-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do modal: Botão de favoritar e botão de fechar */}
        <div className="preview-header-actions">
          {/* Botão de Favoritar (Coração) */}
          {onToggleFavorite ? (
            <button
              type="button"
              className={`preview-action-btn favorite-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={(e) => onToggleFavorite(sticker, e)}
              aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorited ? '#EAA1AC' : 'none'} stroke={isFavorited ? '#EAA1AC' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          ) : (
            <div />
          )}

          {/* Botão de Fechar (✕) */}
          <button 
            type="button" 
            className="preview-action-btn close-btn" 
            onClick={onClose}
            aria-label="Fechar pré-visualização"
          >
            ✕
          </button>
        </div>

        {/* Área Central: Visualização Ampliada da Figurinha */}
        <div className="preview-display-area">
          <div ref={previewContentRef} className="preview-content-scalable">
            {sticker.image_url || sticker.imageData ? (
              <img 
                src={sticker.image_url || sticker.imageData} 
                alt={sticker.title || sticker.mainText || 'Sticker'} 
                className="preview-img-large"
              />
            ) : sticker.render ? (
              <div className="preview-svg-wrapper">
                {sticker.render}
              </div>
            ) : sticker.isBottle ? (
              <div className="bottle-art-wrapper preview-bottle">
                <span className="bottle-label-curved">{sticker.label}</span>
                <div className="bottle-svg-icon">
                  <svg width="90" height="130" viewBox="0 0 100 140" fill="none">
                    <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                    <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                    <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className={`typography-wrapper preview-typography ${sticker.styleVariant || ''}`}>
                {sticker.prefix && <span className="typo-prefix">{sticker.prefix}</span>}
                {sticker.mainText && <span className="typo-main">{sticker.mainText}</span>}
                {sticker.suffix && <span className="typo-suffix">{sticker.suffix}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal: Botão de Cópia com feedback */}
        <div className="preview-footer-actions">
          <button 
            type="button" 
            className={`preview-copy-btn ${copyStatus.success ? 'success' : ''}`}
            onClick={handleCopy}
            disabled={copyStatus.copying}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>{copyStatus.text}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
