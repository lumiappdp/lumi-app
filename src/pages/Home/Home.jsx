import { useState, useEffect, useRef } from 'react';
// Importação dos logotipos oficiais da Lumi para tema claro e escuro
import lumiLogoLight from '../../../identidade-visual/lumi-logo-ve.png';
import lumiLogoDark from '../../../identidade-visual/lumi-logo-ve.png';
import lumiHeartIcon from '../../../identidade-visual/9.png';
import { creationsService } from '../../services/creationsService';
import { clipboardService } from '../../services/clipboardService';
import { favoritesService } from '../../services/favoritesService';
import { recentService } from '../../services/recentService';
import { usageService } from '../../services/usageService';
import { getStickers } from '../../services/stickersService';
import { checkIsAdmin } from '../../services/authService';
import { 
  getCustomCovers, 
  getCustomCoversFromSupabase, 
  updateCategoryCover, 
  getAllSections,
  getSectionsFromSupabase 
} from '../../services/categoriesService';

import { InstallBanner } from '../../components/InstallBanner/InstallBanner';
import { StickerPreviewModal } from '../../components/StickerPreviewModal/StickerPreviewModal';
import { LegalModal } from '../Legal/LegalModal';
import { LEGAL_DOCS } from '../Legal/legalContent';
import './Home.css';

// Componente da Página Inicial (Home / Dashboard) do Lumi App
// Apresenta categorias com scroll horizontal, feeds de conteúdo e navegação inferior
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('light' ou 'dark')
// @param {Function} props.onNavigate - Callback para transicionar entre telas ('home' ou 'profile')
// @param {Function} props.onSelectCategory - Callback para navegar para a tela de detalhes de figurinhas
// @param {Function} props.onSelectSection - Callback para navegar para a tela de 'Todas as Subcategorias' de uma seção
export function Home({ theme = 'dark', onNavigate, onSelectCategory, onSelectSection }) {
  // Verifica se o usuário atual logado é o Administrador Supremo
  const currentUserEmail = localStorage.getItem('lumi-user-email') || '';
  const isAdmin = checkIsAdmin(currentUserEmail);

  // Estado para armazenar o mapa de capas personalizadas dos cards
  const [customCovers, setCustomCovers] = useState(() => getCustomCovers());
  // Estado para armazenar as seções e subcards dinâmicos reais cadastrados no Supabase
  const [sections, setSections] = useState(() => getAllSections());
  // Referência do input de arquivo oculto para upload de capa pelo Admin
  const fileInputRef = useRef(null);
  // Estado para guardar qual ID de card está sendo editado no momento
  const [editingCardId, setEditingCardId] = useState(null);
  // Estado da aba de filtro selecionada no topo
  const [activeTab, setActiveTab] = useState('nichos');
  
  // Estado da barra de navegação inferior
  const [activeNav, setActiveNav] = useState('home');

  // Estado para o termo digitado na busca da página inicial
  const [searchTerm, setSearchTerm] = useState('');

  // Estado com as criações salvas pelo usuário
  const [myCreations, setMyCreations] = useState([]);
  // Estado com os stickers usados recentemente
  const [recentStickers, setRecentStickers] = useState([]);
  // Estado com mapa de contagem de cliques/usos para a aba Mais Usados
  const [usageCounts, setUsageCounts] = useState(() => usageService.getUsageCounts());
  const [toastMessage, setToastMessage] = useState('');
  // Estado para controlar abertura do modal com o tutorial de instalação
  const [activeInstallModal, setActiveInstallModal] = useState(null);
  // Estado para controlar sticker ativo no modal de visualização ampliada
  const [selectedStickerForPreview, setSelectedStickerForPreview] = useState(null);
  // IDs favoritados para os stickers mais usados e recentes
  const [favoriteIds, setFavoriteIds] = useState([]);
  // Stickers dinâmicos carregados diretamente do banco Supabase
  const [databaseStickers, setDatabaseStickers] = useState([]);

  // Referência e estados para o arraste (drag / swipe) suave dos filtros horizontais
  const filtersScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const hasDragged = useRef(false);

  // Inicia o arraste com mouse
  const handleMouseDown = (e) => {
    if (!filtersScrollRef.current) return;
    setIsDragging(true);
    hasDragged.current = false;
    setStartX(e.pageX - filtersScrollRef.current.offsetLeft);
    setScrollLeftState(filtersScrollRef.current.scrollLeft);
  };

  // Finaliza o arraste com mouse
  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  // Movimenta o scroll conforme o arraste do mouse
  const handleMouseMove = (e) => {
    if (!isDragging || !filtersScrollRef.current) return;
    e.preventDefault();
    hasDragged.current = true;
    const x = e.pageX - filtersScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplicador de velocidade
    filtersScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Carrega favoritos, recentes, criações salvas, seções e figurinhas do banco
  useEffect(() => {
    if (activeTab === 'eu-criei') {
      setMyCreations(creationsService.getCreations());
    }
    if (activeTab === 'recentes') {
      setRecentStickers(recentService.getRecents());
    }
    const favs = favoritesService.getFavorites();
    setFavoriteIds(favs.map(f => f.id));

    // Busca seções e subcards dinâmicos sincronizados do Supabase
    async function loadDynamicSections() {
      try {
        const data = await getSectionsFromSupabase();
        if (data) {
          setSections(data);
        }
      } catch (err) {
        console.log('Erro ao carregar seções do Supabase:', err);
      }
    }
    loadDynamicSections();

    // Busca capas sincronizadas do Supabase
    async function loadCovers() {
      try {
        const covers = await getCustomCoversFromSupabase();
        setCustomCovers(covers);
      } catch (err) {
        console.log('Erro ao carregar capas do Supabase:', err);
      }
    }
    loadCovers();

    // Busca figurinhas salvas no Supabase
    async function loadHomeDatabaseStickers() {
      try {
        const data = await getStickers();
        if (data && data.length > 0) {
          setDatabaseStickers(data);
        }
      } catch (err) {
        console.log('Sem stickers do banco:', err);
      }
    }
    loadHomeDatabaseStickers();
  }, [activeTab]);


  // Abre a janela de seleção de arquivos do sistema para alterar a capa do card
  const handleOpenCoverUpload = (e, cardId) => {
    e.stopPropagation();
    setEditingCardId(cardId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Processa o arquivo selecionado e atualiza a capa do card
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingCardId) return;

    setToastMessage('Atualizando capa...');
    try {
      const newUrl = await updateCategoryCover(editingCardId, file);
      setCustomCovers(prev => ({
        ...prev,
        [editingCardId]: newUrl,
      }));
      setToastMessage('Capa alterada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar capa:', err);
      setToastMessage('Erro ao salvar capa. Tente novamente.');
    } finally {
      setTimeout(() => setToastMessage(''), 2500);
      setEditingCardId(null);
    }
  };

  // Figurinhas do banco filtradas para Mais Usados
  const mostUsedStickers = databaseStickers.map(s => ({
    id: s.id,
    mainText: s.title,
    image_url: s.image_url,
    label: s.title,
  }));

  // Figurinhas em alta cadastradas no Supabase
  const trendingStickers = databaseStickers
    .filter(s => s.is_trending)
    .map(s => ({
      id: s.id,
      mainText: s.title,
      image_url: s.image_url,
      label: s.title,
    }));

  // Figurinhas de frases cadastradas no Supabase
  const phrasesStickers = databaseStickers
    .filter(s => s.type === 'phrase' || s.category_slug === 'frases')
    .map(s => ({
      id: s.id,
      mainText: s.title,
      image_url: s.image_url,
      label: s.title,
    }));

  // Figurinhas de elementos e desenhos cadastrados no Supabase
  const elementsStickers = databaseStickers
    .filter(s => s.type === 'element' || s.category_slug === 'elementos')
    .map(s => ({
      id: s.id,
      label: s.title,
      isElement: true,
      image_url: s.image_url,
      render: (
        <img 
          src={s.image_url} 
          alt={s.title} 
          style={{ maxWidth: '68px', maxHeight: '68px', objectFit: 'contain' }} 
        />
      ),
    }));


  // Copia um sticker mais usado para os Stories e adiciona aos recentes e contabiliza uso
  const handleCopyMostUsedSticker = async (item, event) => {
    const targetElement = event.currentTarget.querySelector('.sticker-content-center') || event.currentTarget;
    setToastMessage('Copiando...');
    const result = await clipboardService.copyStickerImage({
      id: item.id,
      title: item.mainText || item.label,
      domElement: targetElement,
    });
    if (result.success) {
      recentService.addRecent(item);
      const updatedCounts = usageService.recordUsage(item);
      setUsageCounts(updatedCounts);
    }
    setToastMessage(result.message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Copia um sticker da lista de recentes, frases, elementos ou do banco
  const handleCopyRecentSticker = async (item, event) => {
    setToastMessage('Copiando...');

    let result;
    if (item.image_url) {
      // Cópia direta do PNG transparente hospedado no Supabase
      result = await clipboardService.copyStickerImage({
        id: item.id,
        title: item.mainText || item.label || item.title,
        imageUrl: item.image_url,
      });
    } else {
      // Cópia por rasterização do elemento tipográfico local
      const targetElement = event?.currentTarget?.querySelector('.sticker-content-center') || event?.currentTarget;
      result = await clipboardService.copyStickerImage({
        id: item.id,
        title: item.mainText || item.label,
        domElement: targetElement,
      });
    }

    if (result.success) {
      recentService.addRecent(item);
      setRecentStickers(recentService.getRecents());
      const updatedCounts = usageService.recordUsage(item);
      setUsageCounts(updatedCounts);
    }
    setToastMessage(result.message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Alterna o status de favorito nos stickers
  const handleToggleFavorite = (item, e) => {
    e.stopPropagation();
    const updated = favoritesService.toggleFavorite(item);
    setFavoriteIds(updated.map((fav) => fav.id));
  };

  // Copia a criação do usuário para os Stories
  const handleCopyCreation = async (item) => {
    setToastMessage('Copiando...');
    const result = await clipboardService.copyStickerImage({
      imageUrl: item.imageData,
      title: item.title,
    });
    setToastMessage(result.message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Exclui uma criação personalizada
  const handleDeleteCreation = (e, id) => {
    e.stopPropagation();
    creationsService.removeCreation(id);
    setMyCreations(creationsService.getCreations());
  };

  // Filtros disponíveis na barra de rolagem horizontal
  const filterPills = [
    {
      id: 'nichos',
      label: 'Nichos',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      id: 'mais-usados',
      label: 'Mais usados',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      )
    },
    {
      id: 'recentes',
      label: 'Recentes',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      id: 'em-alta',
      label: 'Em alta',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      )
    },
    {
      id: 'frases',
      label: 'Frases',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      id: 'elementos',
      label: 'Elementos',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 12h8"></path>
          <path d="M12 8v8"></path>
        </svg>
      )
    }
  ];

  // Filtro de busca inteligente para os stickers das abas
  const searchNormalized = searchTerm.toLowerCase().trim();

  const filterStickerItem = (item) => {
    if (!searchNormalized) return true;
    const itemText = `${item.prefix || ''} ${item.mainText || ''} ${item.suffix || ''} ${item.label || ''} ${item.title || ''}`.toLowerCase();
    return itemText.includes(searchNormalized);
  };

  // Lista de Mais Usados ordenada dinamicamente por cliques reais (ranking de popularidade)
  const sortedMostUsed = [...mostUsedStickers].sort((a, b) => {
    const countA = usageCounts[a.id] || 0;
    const countB = usageCounts[b.id] || 0;
    return countB - countA;
  });

  const filteredMostUsed = sortedMostUsed.filter(filterStickerItem);
  const filteredRecents = recentStickers.filter(filterStickerItem);
  const filteredTrending = trendingStickers.filter(filterStickerItem);
  const filteredPhrases = phrasesStickers.filter(filterStickerItem);
  const filteredElements = elementsStickers.filter(filterStickerItem);

  // Filtra as seções e os cards correspondentes em tempo real com proteção de array
  const safeSections = Array.isArray(sections) ? sections : [];
  const filteredSections = safeSections
    .map((sec) => {
      const cards = Array.isArray(sec.cards) ? sec.cards : [];
      if (!searchNormalized) return { ...sec, cards };
      const matchingCards = cards.filter((card) => 
        (card.overlayText || '').toLowerCase().includes(searchNormalized) ||
        (card.tagLabel && card.tagLabel.toLowerCase().includes(searchNormalized))
      );
      const isSectionMatch = (sec.title || '').toLowerCase().includes(searchNormalized);
      return isSectionMatch ? { ...sec, cards } : { ...sec, cards: matchingCards };
    })
    .filter((sec) => sec.cards && sec.cards.length > 0);

  return (
    <div className={`home-container ${theme}`} data-theme={theme}>
      {/* Toast de Notificação na Home */}
      {toastMessage && (
        <div className="home-toast-banner">
          {toastMessage}
        </div>
      )}

      {/* Input de arquivo oculto para upload de nova capa pelo Admin */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Topo com o Logotipo Oficial da Lumi */}
      <header className="home-header">
        <img src={theme === 'dark' ? lumiLogoDark : lumiLogoLight} alt="Lumi" className="home-lumi-logo" />
      </header>

      {/* Banner Inteligente de Instalação do PWA no Celular */}
      <InstallBanner onOpenGuide={() => setActiveInstallModal(LEGAL_DOCS.install)} />

      {/* Campo de Busca Funcional Estilo iOS */}
      <div className="home-search-container">
        <div className="home-search-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar categorias ou temas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar categorias ou temas"
          />
          {searchTerm && (
            <button 
              type="button" 
              className="home-clear-search-btn" 
              onClick={() => setSearchTerm('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Carrossel de Pílulas de Filtros com Suporte a Drag e Touch Swipe */}
      <section 
        ref={filtersScrollRef}
        className={`home-filters-scroll ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        aria-label="Filtros de conteúdo deslizáveis"
      >
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className={`filter-pill-btn ${activeTab === pill.id ? 'active' : ''}`}
            onClick={() => {
              if (!hasDragged.current) {
                setActiveTab(pill.id);
              }
            }}
          >
            {pill.icon}
            <span className="pill-label">{pill.label}</span>
          </button>
        ))}
      </section>

      {/* Seções de Cards ou Lista de Criações / Mais Usados */}
      <main className="home-content-sections">
        {activeTab === 'mais-usados' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Stickers mais usados</h2>
            </div>

            <div className="cards-grid">
              {filteredMostUsed.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhum sticker encontrado para "{searchTerm}".</p>
                </div>
              ) : (
                filteredMostUsed.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={() => setSelectedStickerForPreview(item)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Visualizar sticker: ${item.mainText || item.label}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar (Coração) */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central do Sticker */}
                  <div className="sticker-content-center">
                    {item.isBottle ? (
                      <div className="bottle-art-wrapper">
                        <span className="bottle-label-curved">{item.label}</span>
                        <div className="bottle-svg-icon">
                          <svg width="68" height="96" viewBox="0 0 100 140" fill="none">
                            <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                            <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                            <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                        {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                        {item.mainText && <span className="typo-main">{item.mainText}</span>}
                        {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'recentes' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Usados recentemente</h2>
            </div>

            {filteredRecents.length === 0 ? (
              <div className="home-no-results">
                <p>{searchTerm ? `Nenhum sticker recente encontrado para "${searchTerm}".` : 'Nenhum sticker usado recentemente.'}</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', opacity: 0.7 }}>
                  Copie qualquer figurinha para vê-la aqui!
                </p>
              </div>
            ) : (
              <div className="cards-grid">
                {filteredRecents.map((item) => (
                  <div
                    key={item.id}
                    className="sticker-card"
                    onClick={() => setSelectedStickerForPreview(item)}
                    role="button"
                    tabIndex="0"
                    aria-label={`Visualizar sticker: ${item.mainText || item.label}`}
                  >
                    {/* Topo do Card: Botão de Favoritar */}
                    <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                      {/* Botão de Favoritar */}
                      <button
                        type="button"
                        className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                        onClick={(e) => handleToggleFavorite(item, e)}
                        aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                    </div>

                    {/* Conteúdo Central do Sticker */}
                    <div className="sticker-content-center">
                      {item.isBottle ? (
                        <div className="bottle-art-wrapper">
                          <span className="bottle-label-curved">{item.label}</span>
                          <div className="bottle-svg-icon">
                            <svg width="68" height="96" viewBox="0 0 100 140" fill="none">
                              <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                              <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                              <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                          {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                          {item.mainText && <span className="typo-main">{item.mainText}</span>}
                          {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : activeTab === 'em-alta' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Em alta no momento</h2>
            </div>

            <div className="cards-grid">
              {filteredTrending.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhum sticker em alta encontrado para "{searchTerm}".</p>
                </div>
              ) : (
                filteredTrending.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={() => setSelectedStickerForPreview(item)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Visualizar sticker: ${item.mainText || item.label}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central do Sticker */}
                  <div className="sticker-content-center">
                    {item.isBottle ? (
                      <div className="bottle-art-wrapper">
                        <span className="bottle-label-curved">{item.label}</span>
                        <div className="bottle-svg-icon">
                          <svg width="68" height="96" viewBox="0 0 100 140" fill="none">
                            <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                            <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                            <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                        {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                        {item.mainText && <span className="typo-main">{item.mainText}</span>}
                        {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'frases' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Frases para Stories</h2>
            </div>

            <div className="cards-grid">
              {filteredPhrases.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhuma frase encontrada para "{searchTerm}".</p>
                </div>
              ) : (
                filteredPhrases.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={() => setSelectedStickerForPreview(item)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Visualizar frase: ${item.mainText}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central: Imagem do Supabase ou Tipografia Padrão */}
                  <div className="sticker-content-center">
                    {item.image_url ? (
                      <div className="admin-uploaded-sticker-wrapper">
                        <img 
                          src={item.image_url} 
                          alt={item.mainText || item.label} 
                          style={{ maxWidth: '88px', maxHeight: '88px', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                        {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                        <span className="typo-main">{item.mainText}</span>
                        {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'elementos' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Elementos & Desenhos</h2>
            </div>

            <div className="cards-grid">
              {filteredElements.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhum elemento gráfico encontrado para "{searchTerm}".</p>
                </div>
              ) : (
                filteredElements.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={() => setSelectedStickerForPreview({ id: item.id, label: item.label, render: item.render, isElement: true })}
                  role="button"
                  tabIndex="0"
                  aria-label={`Visualizar elemento: ${item.label}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central Exclusivamente com Desenho / Ilustração */}
                  <div className="sticker-content-center">
                    <div className="picker-graphic-center">
                      {item.render}
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'eu-criei' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Minhas criações</h2>
            </div>

            {myCreations.length === 0 ? (
              <div className="home-no-results">
                <p>Você ainda não salvou nenhuma figurinha.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', opacity: 0.7 }}>
                  Toque no botão <strong>+</strong> para criar sua primeira figurinha!
                </p>
              </div>
            ) : (
              <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {myCreations.map((creation) => (
                  <div 
                    key={creation.id} 
                    className="feed-card creation-card" 
                    onClick={() => setSelectedStickerForPreview({ id: creation.id, title: creation.title, imageData: creation.imageData })}
                    role="button"
                    tabIndex="0"
                    aria-label={`Visualizar ${creation.title}`}
                    style={{ 
                      background: 'rgba(58, 53, 58, 0.7)', 
                      backdropFilter: 'blur(10px)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative',
                      minHeight: '170px'
                    }}
                  >
                    {/* Botão de Excluir */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCreation(e, creation.id)}
                      aria-label="Excluir figurinha"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        borderRadius: '50%',
                        color: '#fff',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        zIndex: 10
                      }}
                    >
                      ✕
                    </button>

                    {/* Imagem transparente da criação */}
                    <img 
                      src={creation.imageData} 
                      alt={creation.title} 
                      style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} 
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : filteredSections.length === 0 ? (
          <div className="home-no-results">
            <p>Nenhuma categoria ou tema encontrado para "{searchTerm}".</p>
          </div>
        ) : (
          filteredSections.map((sec) => (
            <section key={sec.id} className="content-section">
              {/* Cabeçalho da Seção com Ação 'Ver todas as subcategorias ›' */}
              <div 
                className="section-header"
                onClick={() => onSelectSection ? onSelectSection(sec) : onSelectCategory(sec.title)}
                role="button"
                tabIndex="0"
                aria-label={`Ver todas as subcategorias de ${sec.title}`}
              >
                <h2 className="section-title">{sec.title}</h2>
                <span className="see-all-link">Ver todas ›</span>
              </div>

              {/* Carrossel Horizontal Deslizável (Scroll & Swipe para o lado) */}
              <div className="horizontal-cards-row">
                {sec.cards.map((card) => {
                  const currentBg = customCovers[card.id] || card.bgImage;
                  return (
                    <div 
                      key={card.id} 
                      className="feed-card horizontal-feed-card" 
                      style={{ backgroundImage: `url(${currentBg})` }}
                      onClick={() => onSelectCategory && onSelectCategory(card.tagLabel || sec.title)}
                      role="button"
                      tabIndex="0"
                      aria-label={`Ver artes de ${card.tagLabel || sec.title}`}
                    >
                      {/* Botão de Edição de Capa visível exclusivamente para o Admin Supremo */}
                      {isAdmin && (
                        <button
                          type="button"
                          className="admin-edit-cover-btn"
                          onClick={(e) => handleOpenCoverUpload(e, card.id)}
                          title="Alterar imagem de capa"
                          aria-label="Alterar imagem de capa"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        </button>
                      )}

                      <div className="card-overlay-gradient">
                        <p className="card-custom-typography">{card.overlayText}</p>
                        {card.tagLabel && (
                          <div className="card-footer-pill">
                            {card.tagLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Barra de Navegação Inferior Estilo Dock iOS com Botão Hero Central */}
      <nav className="bottom-nav-bar" aria-label="Navegação principal">
        {/* Início */}
        <button
          type="button"
          className={`nav-item ${activeNav === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate && onNavigate('home')}
          aria-label="Início"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <path d="M9 22V12h6v10"></path>
          </svg>
        </button>

        {/* Botão Hero Central de Favoritos em Alto Destaque */}
        <button 
          type="button" 
          className="floating-action-plus" 
          onClick={() => onNavigate && onNavigate('favorites')}
          aria-label="Favoritos"
          title="Favoritos"
        >
          <svg width="25" height="25" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Perfil de Usuário */}
        <button
          type="button"
          className={`nav-item ${activeNav === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate && onNavigate('profile')}
          aria-label="Perfil de Usuário"
          title="Perfil"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </nav>

      {/* Modal com Passo a Passo de Instalação no Celular */}
      {activeInstallModal && (
        <LegalModal 
          doc={activeInstallModal} 
          onClose={() => setActiveInstallModal(null)} 
        />
      )}

      {/* Modal de Pré-visualização Ampliada do Sticker */}
      {selectedStickerForPreview && (
        <StickerPreviewModal
          sticker={selectedStickerForPreview}
          theme={theme}
          isFavorited={favoriteIds.includes(selectedStickerForPreview.id)}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setSelectedStickerForPreview(null)}
          onAfterCopy={() => {
            if (activeTab === 'recentes') {
              setRecentStickers(recentService.getRecents());
            }
            setUsageCounts(usageService.getUsageCounts());
          }}
        />
      )}
    </div>
  );
}

export default Home;
