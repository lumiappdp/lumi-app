import { useState, useRef } from 'react';
import { clipboardService } from '../../services/clipboardService';
import { creationsService } from '../../services/creationsService';
import './CreateSticker.css';

// Componente da Página de Criação de Figurinhas - Lumi App
// Canvas transparente com editor tipográfico e catálogo de figurinhas adicionáveis
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('dark' ou 'light')
// @param {Function} props.onBack - Callback para retornar à tela anterior
export function CreateSticker({ theme = 'dark', onBack }) {
  // Referência do elemento do canvas para renderização/cópia
  const canvasContentRef = useRef(null);

  // Controle de estado: modo de edição tipográfica ativo
  const [isTextEditing, setIsTextEditing] = useState(false);
  // Controle de estado: visualização do catálogo "Pesquisar figurinhas" aberta
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  // Ferramenta ativa selecionada no carrossel inferior
  const [activeTool, setActiveTool] = useState('alinhamento');

  // Figurinhas ilustradas adicionadas ao canvas
  const [canvasElements, setCanvasElements] = useState([]);

  // Propriedades do texto do sticker
  const [stickerText, setStickerText] = useState('Digite seu texto...');
  const [textAlign, setTextAlign] = useState('center');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontFamily, setFontFamily] = useState('Playfair Display');
  const [fontSize, setFontSize] = useState(28);
  const [hasShadow, setHasShadow] = useState(false);
  const [hasOutline, setHasOutline] = useState(false);
  const [bgColor, setBgColor] = useState('transparent');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.3);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Feedback de status de cópia ou salvamento
  const [copyStatus, setCopyStatus] = useState('');

  // Referência e estados para arraste (drag / swipe) no carrossel de tipografia
  const typoCarouselRef = useRef(null);
  const [isTypoDragging, setIsTypoDragging] = useState(false);
  const [typoStartX, setTypoStartX] = useState(0);
  const [typoScrollLeft, setTypoScrollLeft] = useState(0);
  const typoHasDragged = useRef(false);

  // Início do arraste no carrossel de ferramentas
  const handleTypoMouseDown = (e) => {
    if (!typoCarouselRef.current) return;
    setIsTypoDragging(true);
    typoHasDragged.current = false;
    setTypoStartX(e.pageX - typoCarouselRef.current.offsetLeft);
    setTypoScrollLeft(typoCarouselRef.current.scrollLeft);
  };

  // Fim do arraste
  const handleTypoMouseLeaveOrUp = () => {
    setIsTypoDragging(false);
  };

  // Movimento de arraste
  const handleTypoMouseMove = (e) => {
    if (!isTypoDragging || !typoCarouselRef.current) return;
    e.preventDefault();
    typoHasDragged.current = true;
    const x = e.pageX - typoCarouselRef.current.offsetLeft;
    const walk = (x - typoStartX) * 1.5;
    typoCarouselRef.current.scrollLeft = typoScrollLeft - walk;
  };

  // Paleta de cores disponíveis para o texto e fundo
  const colorPalette = [
    '#FFFFFF', '#000000', '#EAA1AC', '#B5CE6B', '#7D9371', 
    '#58448A', '#FFD60A', '#FF453A', '#30D158', '#0A84FF', '#BF5AF2'
  ];

  // Fontes disponíveis no catálogo
  const fontFamilies = [
    { label: 'Playfair', value: 'Playfair Display, Georgia, serif' },
    { label: 'Cursiva', value: 'Caveat, cursive, sans-serif' },
    { label: 'Moderna', value: 'Inter, system-ui, sans-serif' },
    { label: 'Elegante', value: 'Cinzel, Georgia, serif' },
  ];

  // Catálogo de figurinhas/ilustrações da tela "Pesquisar figurinhas" conforme o print
  const stickerCatalog = [
    {
      id: 'bubble-rect',
      label: 'Balão Mensagem',
      render: (
        <svg width="74" height="54" viewBox="0 0 100 70" fill="none">
          <path d="M10 5 C10 2, 20 0, 30 0 L80 0 C90 0, 100 2, 100 15 L100 45 C100 55, 90 58, 80 58 L30 58 L12 70 L18 58 L10 58 C2 58, 0 50, 0 40 L0 15 C0 5, 5 5, 10 5 Z" fill="#FFFFFF" />
        </svg>
      )
    },
    {
      id: 'bubble-oval',
      label: 'Balão Pílula',
      render: (
        <svg width="84" height="48" viewBox="0 0 120 60" fill="none">
          <path d="M25 0 L95 0 C110 0, 120 12, 120 30 C120 48, 110 60, 95 60 L30 60 L10 65 L18 52 C5 48, 0 40, 0 30 C0 12, 10 0, 25 0 Z" fill="#FFFFFF" />
        </svg>
      )
    },
    {
      id: 'burger',
      label: 'Hambúrguer',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          {/* Pão de Cima */}
          <path d="M15 45 C15 15, 85 15, 85 45 Z" fill="#E5984A" stroke="#FFFFFF" strokeWidth="2.5" />
          {/* Gergelim */}
          <circle cx="35" cy="30" r="2" fill="#FFF2D6" />
          <circle cx="50" cy="24" r="2" fill="#FFF2D6" />
          <circle cx="65" cy="32" r="2" fill="#FFF2D6" />
          {/* Queijo Amarelo */}
          <polygon points="12 46, 88 46, 50 62" fill="#FFC83B" />
          {/* Carne */}
          <rect x="14" y="52" width="72" height="14" rx="7" fill="#6E3A20" stroke="#FFFFFF" strokeWidth="2" />
          {/* Alface */}
          <path d="M10 66 C20 70, 30 64, 40 68 C50 72, 60 64, 70 68 C80 72, 90 66, 90 66" stroke="#48BB78" strokeWidth="6" strokeLinecap="round" />
          {/* Pão de Baixo */}
          <rect x="18" y="72" width="64" height="15" rx="7" fill="#E5984A" stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>
      )
    },
    {
      id: 'fries',
      label: 'Batata Frita',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          {/* Palitos de Batata */}
          <rect x="30" y="10" width="8" height="40" rx="3" fill="#F6E05E" />
          <rect x="42" y="6" width="8" height="45" rx="3" fill="#ECC94B" />
          <rect x="54" y="12" width="8" height="40" rx="3" fill="#F6E05E" />
          <rect x="66" y="18" width="8" height="35" rx="3" fill="#ECC94B" />
          {/* Embalagem Vermelha */}
          <path d="M22 45 L30 92 C32 96, 68 96, 70 92 L78 45 Z" fill="#E53E3E" stroke="#FFFFFF" strokeWidth="3" />
          {/* Emblema Carinha */}
          <circle cx="50" cy="68" r="11" fill="#F6E05E" />
          <path d="M45 68 Q50 74 55 68" stroke="#744210" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="46" cy="64" r="1.5" fill="#744210" />
          <circle cx="54" cy="64" r="1.5" fill="#744210" />
        </svg>
      )
    },
    {
      id: 'airplane',
      label: 'Avião',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          {/* Asas e Corpo do Avião */}
          <path d="M50 15 L58 45 L90 60 L90 68 L58 60 L58 80 L68 88 L68 94 L50 90 L32 94 L32 88 L42 80 L42 60 L10 68 L10 60 L42 45 Z" fill="#E2E8F0" stroke="#3182CE" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'storm-cloud',
      label: 'Nuvem e Raio',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          {/* Nuvem Branca */}
          <path d="M25 60 C15 60, 10 50, 18 40 C15 30, 28 20, 40 25 C48 15, 68 15, 75 25 C85 25, 92 35, 88 45 C95 52, 90 60, 80 60 Z" fill="#FFFFFF" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
          {/* Raio Amarelo */}
          <polygon points="50 56, 42 74, 52 74, 46 92, 64 68, 54 68" fill="#F6E05E" stroke="#D69E2E" strokeWidth="1.5" />
        </svg>
      )
    },
    {
      id: 'cherries',
      label: 'Cerejas',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          {/* Folha Verde */}
          <path d="M45 25 C45 10, 70 12, 75 28 C60 32, 45 25, 45 25 Z" fill="#48BB78" stroke="#FFFFFF" strokeWidth="1.5" />
          {/* Hastes */}
          <path d="M50 25 Q38 45 32 60" stroke="#38A169" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M50 25 Q62 45 68 62" stroke="#38A169" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Cereja Esquerda */}
          <circle cx="32" cy="68" r="16" fill="#E53E3E" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="28" cy="62" r="4" fill="#FEB2B2" />
          {/* Cereja Direita */}
          <circle cx="68" cy="70" r="16" fill="#C53030" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="64" cy="64" r="4" fill="#FEB2B2" />
        </svg>
      )
    },
    {
      id: 'thought-cloud',
      label: 'Nuvem de Sonho',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <circle cx="28" cy="82" r="5" fill="#FFFFFF" />
          <circle cx="38" cy="70" r="7" fill="#FFFFFF" />
          <path d="M38 52 C28 52, 22 42, 30 32 C26 22, 38 12, 50 16 C58 8, 76 8, 82 18 C92 18, 98 28, 94 38 C100 45, 96 52, 88 52 Z" fill="#FFFFFF" />
        </svg>
      )
    },
  ];

  // Adiciona a figurinha selecionada no canvas e fecha a tela de busca
  const handleSelectSticker = (item) => {
    setCanvasElements((prev) => [...prev, item]);
    setIsStickerPickerOpen(false);
  };

  // Remove um elemento do canvas ao clicar sobre ele
  const handleRemoveElement = (indexToRemove) => {
    setCanvasElements((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Salva o sticker transparente nas criações do usuário
  const handleSaveSticker = async () => {
    if (!canvasContentRef.current) return;

    setCopyStatus('Salvando...');

    const result = await creationsService.saveCreation({
      domElement: canvasContentRef.current,
      title: stickerText || 'Minha Figurinha',
    });

    if (result.success) {
      setCopyStatus('Salvo em Minhas criações! 💾');
    } else {
      setCopyStatus('Erro ao salvar figurinha.');
    }

    setTimeout(() => {
      setCopyStatus('');
    }, 2500);
  };

  // Copia o sticker transparente diretamente para a área de transferência
  const handleCopySticker = async () => {
    if (!canvasContentRef.current) return;

    setCopyStatus('Copiando...');

    const result = await clipboardService.copyStickerImage({
      domElement: canvasContentRef.current,
      title: stickerText || 'Minha Figurinha',
    });

    setCopyStatus(result.message);

    setTimeout(() => {
      setCopyStatus('');
    }, 2500);
  };

  // Trata o clique nas ferramentas da barra inferior
  const handleToolClick = (toolId) => {
    setActiveTool(toolId);

    if (toolId === 'negrito') setIsBold(prev => !prev);
    if (toolId === 'italico') setIsItalic(prev => !prev);
    if (toolId === 'sublinhado') setIsUnderline(prev => !prev);
    if (toolId === 'sombra') setHasShadow(prev => !prev);
    if (toolId === 'contorno') setHasOutline(prev => !prev);
  };

  // Ciclo de alinhamento de texto (esquerda -> centro -> direita)
  const handleCycleAlignment = () => {
    if (textAlign === 'left') setTextAlign('center');
    else if (textAlign === 'center') setTextAlign('right');
    else setTextAlign('left');
  };

  return (
    <div className={`create-sticker-container ${theme} ${isTextEditing ? 'editing-mode' : ''}`} data-theme={theme}>
      {/* SE O CATÁLOGO DE FIGURINHAS ESTIVER ABERTO (TELA: PESQUISAR FIGURINHAS) */}
      {isStickerPickerOpen ? (
        <div className="sticker-picker-full-screen">
          {/* Header da Tela de Busca de Figurinhas */}
          <header className="create-header">
            <button 
              type="button" 
              className="create-back-btn" 
              onClick={() => setIsStickerPickerOpen(false)} 
              aria-label="Voltar para a criação"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h1 className="create-page-title">Pesquisar figurinhas</h1>
          </header>

          {/* Grade de 2 colunas de figurinhas conforme o print */}
          <main className="sticker-picker-grid-container">
            {stickerCatalog.map((stk) => (
              <div 
                key={stk.id} 
                className="sticker-picker-item-card" 
                onClick={() => handleSelectSticker(stk)}
                role="button"
                tabIndex="0"
                aria-label={`Adicionar ${stk.label}`}
              >
                <div className="picker-graphic-center">
                  {stk.render}
                </div>
              </div>
            ))}
          </main>
        </div>
      ) : (
        /* TELA NORMAL DO CANVAS DE CRIAÇÃO */
        <>
          {/* Header com Navegação ou Botão "Concluído" */}
          <header className="create-header">
            {!isTextEditing ? (
              <>
                <button type="button" className="create-back-btn" onClick={onBack} aria-label="Voltar para o início">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <h1 className="create-page-title">Crie sua figurinha</h1>
              </>
            ) : (
              <div className="editing-header-actions">
                <button 
                  type="button" 
                  className="done-editing-pill-btn" 
                  onClick={() => setIsTextEditing(false)}
                  aria-label="Concluir edição de texto"
                >
                  Concluído
                </button>
              </div>
            )}
          </header>

          {/* Feedback Toast de Cópia e Salvamento */}
          {copyStatus && (
            <div className="copy-toast-banner">
              {copyStatus}
            </div>
          )}

          {/* Área de Trabalho / Canvas com Grade Quadriculada Transparente */}
          <div className="checkerboard-canvas-wrapper">
            {/* Slider Lateral Esquerdo de Tamanho da Fonte */}
            {isTextEditing && (
              <div className="vertical-size-slider-wrapper">
                <input
                  type="range"
                  min="16"
                  max="52"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="vertical-size-range-input"
                  aria-label="Tamanho da fonte"
                />
              </div>
            )}

            {/* Ações Superiores Direitas (Salvar e Copiar) */}
            {!isTextEditing && (
              <div className="canvas-top-actions">
                {/* Botão de Salvar em Minhas Criações */}
                <button 
                  type="button" 
                  className="canvas-circle-tool-btn" 
                  onClick={handleSaveSticker}
                  aria-label="Salvar figurinha em Minhas criações"
                  title="Salvar em Minhas criações"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </button>

                {/* Botão de Copiar para Stories */}
                <button 
                  type="button" 
                  className="canvas-circle-tool-btn" 
                  onClick={handleCopySticker}
                  aria-label="Copiar para Stories"
                  title="Copiar figurinha"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            )}

            {/* Conteúdo Central Editável do Canvas (Texto + Figurinhas adicionadas) */}
            <div className="canvas-interactive-body">
              <div className="sticker-live-render-box" ref={canvasContentRef}>
                {/* Figurinhas selecionadas no catálogo renderizadas no canvas */}
                {canvasElements.length > 0 && (
                  <div className="canvas-stickers-cluster">
                    {canvasElements.map((el, index) => (
                      <div 
                        key={index} 
                        className="canvas-placed-sticker-item"
                        onClick={() => handleRemoveElement(index)}
                        title="Toque para remover figurinha"
                      >
                        {el.render}
                      </div>
                    ))}
                  </div>
                )}

                {/* Texto do Sticker */}
                <textarea
                  className="sticker-live-textarea"
                  value={stickerText}
                  onChange={(e) => setStickerText(e.target.value)}
                  placeholder="Digite sua frase aqui..."
                  rows="3"
                  style={{
                    textAlign,
                    color: textColor,
                    fontFamily,
                    fontSize: `${fontSize}px`,
                    letterSpacing: `${letterSpacing}px`,
                    opacity,
                    lineHeight,
                    fontWeight: isBold ? '700' : 'normal',
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textDecoration: isUnderline ? 'underline' : 'none',
                    backgroundColor: bgColor,
                    textShadow: hasShadow ? '0 4px 14px rgba(0,0,0,0.95)' : 'none',
                    WebkitTextStroke: hasOutline ? '1px #000000' : 'none',
                    padding: bgColor !== 'transparent' ? '0.4rem 0.8rem' : '0.2rem',
                    borderRadius: bgColor !== 'transparent' ? '12px' : '0',
                  }}
                />
              </div>
            </div>

            {/* Ferramentas Inferiores (Quando NÃO estiver editando) */}
            {!isTextEditing ? (
              <div className="canvas-bottom-actions">
                {/* Botão Tt abre editor de texto */}
                <button 
                  type="button" 
                  className="canvas-circle-tool-btn" 
                  onClick={() => setIsTextEditing(true)}
                  aria-label="Editar tipografia"
                  title="Abrir editor de texto"
                >
                  <span className="tool-btn-text-icon">Tᴛ</span>
                </button>

                {/* Botão Carinha abre a tela "Pesquisar figurinhas" */}
                <button 
                  type="button" 
                  className="canvas-circle-tool-btn" 
                  onClick={() => setIsStickerPickerOpen(true)}
                  aria-label="Pesquisar e adicionar figurinhas"
                  title="Adicionar figurinhas à criação"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>
              </div>
            ) : (
              /* Barra de Ferramentas de Tipografia */
              <div className="typography-editor-control-panel">
                <div className="typo-submenu-bar">
                  {activeTool === 'alinhamento' && (
                    <div className="submenu-options-row">
                      <button type="button" className={`submenu-pill-btn ${textAlign === 'left' ? 'active' : ''}`} onClick={() => setTextAlign('left')}>Esquerda</button>
                      <button type="button" className={`submenu-pill-btn ${textAlign === 'center' ? 'active' : ''}`} onClick={() => setTextAlign('center')}>Centro</button>
                      <button type="button" className={`submenu-pill-btn ${textAlign === 'right' ? 'active' : ''}`} onClick={() => setTextAlign('right')}>Direita</button>
                    </div>
                  )}

                  {activeTool === 'cor' && (
                    <div className="submenu-colors-scroll">
                      {colorPalette.map((c) => (
                        <button 
                          key={c} 
                          type="button" 
                          className={`color-palette-dot ${textColor === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setTextColor(c)}
                        />
                      ))}
                    </div>
                  )}

                  {activeTool === 'fonte' && (
                    <div className="submenu-options-row">
                      {fontFamilies.map((f) => (
                        <button 
                          key={f.label} 
                          type="button" 
                          className={`submenu-pill-btn ${fontFamily === f.value ? 'active' : ''}`}
                          onClick={() => setFontFamily(f.value)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTool === 'fundo' && (
                    <div className="submenu-colors-scroll">
                      <button 
                        type="button" 
                        className={`submenu-pill-btn ${bgColor === 'transparent' ? 'active' : ''}`}
                        onClick={() => setBgColor('transparent')}
                      >
                        Sem fundo
                      </button>
                      {colorPalette.map((c) => (
                        <button 
                          key={c} 
                          type="button" 
                          className={`color-palette-dot ${bgColor === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setBgColor(c)}
                        />
                      ))}
                    </div>
                  )}

                  {activeTool === 'espaco' && (
                    <div className="submenu-slider-row">
                      <span>Espaçamento:</span>
                      <input 
                        type="range" 
                        min="-2" 
                        max="10" 
                        value={letterSpacing} 
                        onChange={(e) => setLetterSpacing(Number(e.target.value))} 
                      />
                    </div>
                  )}

                  {activeTool === 'opacidade' && (
                    <div className="submenu-slider-row">
                      <span>Opacidade:</span>
                      <input 
                        type="range" 
                        min="0.2" 
                        max="1" 
                        step="0.05"
                        value={opacity} 
                        onChange={(e) => setOpacity(Number(e.target.value))} 
                      />
                    </div>
                  )}

                  {activeTool === 'linhas' && (
                    <div className="submenu-slider-row">
                      <span>Altura linhas:</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="2.2" 
                        step="0.1"
                        value={lineHeight} 
                        onChange={(e) => setLineHeight(Number(e.target.value))} 
                      />
                    </div>
                  )}
                </div>

                {/* Carrossel Horizontal das 12 Ferramentas com Arraste Lateral Suave */}
                <div 
                  ref={typoCarouselRef}
                  className={`typography-tools-carousel ${isTypoDragging ? 'is-dragging' : ''}`}
                  onMouseDown={handleTypoMouseDown}
                  onMouseLeave={handleTypoMouseLeaveOrUp}
                  onMouseUp={handleTypoMouseLeaveOrUp}
                  onMouseMove={handleTypoMouseMove}
                >
                  <button 
                    type="button" 
                    className={`typo-tool-btn ${activeTool === 'alinhamento' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleCycleAlignment();
                    }}
                  >
                    <span className="tool-btn-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="21" y1="6" x2="3" y2="6"></line>
                        <line x1="17" y1="12" x2="7" y2="12"></line>
                        <line x1="19" y1="18" x2="5" y2="18"></line>
                      </svg>
                    </span>
                    <span className="tool-btn-label">Alinhamento</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${activeTool === 'cor' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('cor');
                    }}
                  >
                    <span className="tool-btn-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path>
                      </svg>
                    </span>
                    <span className="tool-btn-label">Cor da Fonte</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${activeTool === 'fonte' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('fonte');
                    }}
                  >
                    <span className="tool-btn-icon text-bold-icon">ABC</span>
                    <span className="tool-btn-label">Fonte</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${hasShadow ? 'enabled' : ''} ${activeTool === 'sombra' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('sombra');
                    }}
                  >
                    <span className="tool-btn-icon">☁</span>
                    <span className="tool-btn-label">Sombra</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${hasOutline ? 'enabled' : ''} ${activeTool === 'contorno' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('contorno');
                    }}
                  >
                    <span className="tool-btn-icon">🔲</span>
                    <span className="tool-btn-label">Contorno</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${activeTool === 'fundo' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('fundo');
                    }}
                  >
                    <span className="tool-btn-icon">🏷</span>
                    <span className="tool-btn-label">Fundo</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${activeTool === 'espaco' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('espaco');
                    }}
                  >
                    <span className="tool-btn-icon">↔</span>
                    <span className="tool-btn-label">Espaço letras</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${activeTool === 'opacidade' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('opacidade');
                    }}
                  >
                    <span className="tool-btn-icon">👁</span>
                    <span className="tool-btn-label">Opacidade</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${activeTool === 'linhas' ? 'active' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('linhas');
                    }}
                  >
                    <span className="tool-btn-icon">↕</span>
                    <span className="tool-btn-label">Espessura linhas</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${isBold ? 'enabled' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('negrito');
                    }}
                  >
                    <span className="tool-btn-icon text-bold-icon">B</span>
                    <span className="tool-btn-label">Negrito</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${isItalic ? 'enabled' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('italico');
                    }}
                  >
                    <span className="tool-btn-icon text-italic-icon">I</span>
                    <span className="tool-btn-label">Itálico</span>
                  </button>

                  <button 
                    type="button" 
                    className={`typo-tool-btn ${isUnderline ? 'enabled' : ''}`} 
                    onClick={() => {
                      if (!typoHasDragged.current) handleToolClick('sublinhado');
                    }}
                  >
                    <span className="tool-btn-icon text-underline-icon">U</span>
                    <span className="tool-btn-label">Sublinhado</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CreateSticker;
