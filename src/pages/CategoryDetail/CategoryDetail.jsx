import { useState, useEffect } from 'react';
import lumiHeartIcon from '../../../identidade-visual/9.png';
import { clipboardService } from '../../services/clipboardService';
import { favoritesService } from '../../services/favoritesService';
import { recentService } from '../../services/recentService';
import { usageService } from '../../services/usageService';
import { getStickers } from '../../services/stickersService';
import './CategoryDetail.css';

// Componente da Página de Detalhes da Categoria / Nicho (ex: Bebida | Comida)
// Apresenta grid de figurinhas e frases tipográficas estilizadas com badges de cor e favoritos
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('dark' ou 'light')
// @param {string} props.categoryTitle - Título da categoria (ex: 'Bebida | Comida')
// @param {Function} props.onBack - Callback para retornar à Home
export function CategoryDetail({ 
  theme = 'dark', 
  categoryTitle = 'Bebida | Comida', 
  onBack 
}) {
  // Estado para controlar a abertura da barra de busca
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Termo digitado pelo usuário na busca
  const [searchQuery, setSearchQuery] = useState('');
  // Feedback de cópia de sticker
  const [copyStatus, setCopyStatus] = useState({ id: null, message: '', isSuccess: true });
  // Lista de IDs favoritados para reatividade imediata
  const [favoriteIds, setFavoriteIds] = useState([]);
  // Lista de stickers dinâmicos carregados do Supabase
  const [supabaseStickers, setSupabaseStickers] = useState([]);

  // Carrega os favoritos e figurinhas do banco na montagem do componente
  useEffect(() => {
    const list = favoritesService.getFavorites();
    setFavoriteIds(list.map((item) => item.id));

    // Carrega figurinhas adicionais do Supabase para esta categoria
    async function loadDynamicStickers() {
      try {
        const slug = categoryTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-');

        const data = await getStickers({ categorySlug: slug });
        if (data && data.length > 0) {
          setSupabaseStickers(data);
        }
      } catch (err) {
        console.log('Sem stickers adicionais no Supabase:', err);
      }
    }
    loadDynamicStickers();
  }, [categoryTitle]);

  // Alterna o status de favorito do sticker
  const handleToggleFavorite = (item, e) => {
    e.stopPropagation(); // Evita disparar a cópia ao clicar no coração
    const updated = favoritesService.toggleFavorite(item);
    setFavoriteIds(updated.map((fav) => fav.id));
  };

  // Manipulador de cópia do sticker para a área de transferência
  const handleCopySticker = async (item, event) => {
    // Identifica o elemento do card clicado para rasterização com transparência
    const cardElement = event.currentTarget.querySelector('.sticker-content-center') || event.currentTarget;

    // Feedback imediato de carregamento
    setCopyStatus({ id: item.id, message: 'Copiando...', isSuccess: true });

    // Se for uma imagem direta do Supabase
    if (item.image_url) {
      try {
        const response = await fetch(item.image_url);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        recentService.addRecent({ id: item.id, title: item.title, image_url: item.image_url, mainText: item.title });
        usageService.recordUsage(item);
        setCopyStatus({ id: item.id, message: 'Copiado para o Story! ✨', isSuccess: true });
        setTimeout(() => setCopyStatus({ id: null, message: '', isSuccess: true }), 2200);
        return;
      } catch (err) {
        console.error('Erro na cópia direta da imagem:', err);
      }
    }

    const result = await clipboardService.copyStickerImage({
      id: item.id,
      title: item.mainText || item.label || item.title,
      domElement: cardElement,
    });

    // Se copiado com sucesso, salva no histórico de recentes e contabiliza clique
    if (result.success) {
      recentService.addRecent(item);
      usageService.recordUsage(item);
    }

    setCopyStatus({ id: item.id, message: result.message, isSuccess: result.success });

    // Limpa a notificação de status após 2.5s
    setTimeout(() => {
      setCopyStatus({ id: null, message: '', isSuccess: true });
    }, 2500);
  };

  // Lista de artes tipográficas com estrutura visual fiel ao print de referência
  const stickers = [
    {
      id: 1,
      prefix: 'meu',
      mainText: 'Drink favorito.',
      suffix: '♥',
      styleVariant: 'drink-style',
      hasColorBadge: true,
      isPremium: true,
    },
    {
      id: 2,
      prefix: 'meu tipo de',
      mainText: 'INVESTIMENTO.',
      suffix: 'comida boa ✔',
      styleVariant: 'investimento-style',
      hasColorBadge: true,
      isPremium: true,
    },
    {
      id: 3,
      prefix: 'Pedi',
      mainText: 'felicidade,',
      suffix: '♥ VEIO ISSO.',
      styleVariant: 'felicidade-style',
      hasColorBadge: true,
      isPremium: true,
    },
    {
      id: 4,
      isBottle: true,
      label: 'beba água.',
      hasColorBadge: false,
      isPremium: true,
    },
    {
      id: 5,
      prefix: 'comer',
      mainText: 'sem feijão:',
      suffix: 'CASTIGO DO MONSTRO.',
      styleVariant: 'feijao-style',
      hasColorBadge: true,
      isPremium: true,
    },
    {
      id: 6,
      prefix: 'hora do',
      mainText: 'Jantar.',
      suffix: 'UMA DELÍCIA.',
      styleVariant: 'jantar-style',
      hasColorBadge: true,
      isPremium: true,
    },
    {
      id: 7,
      mainText: 'Lunch Time.',
      suffix: 'one • 3',
      styleVariant: 'lunch-style',
      hasColorBadge: true,
      isPremium: true,
    },
    {
      id: 8,
      prefix: 'pizza sem',
      mainText: 'catchup:',
      suffix: 'CASTIGO DO MONSTRO.',
      styleVariant: 'catchup-style',
      hasColorBadge: true,
      isPremium: true,
    },
  ];

  // Combina stickers locais com os que vêm do Supabase
  const allCategoryStickers = [
    ...supabaseStickers.map(stk => ({
      id: stk.id,
      mainText: stk.title,
      label: stk.title,
      image_url: stk.image_url,
      hasColorBadge: false,
    })),
    ...stickers,
  ];

  // Filtra stickers em tempo real com base no termo digitado
  const filteredStickers = allCategoryStickers.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const fullText = `${item.prefix || ''} ${item.mainText || ''} ${item.suffix || ''} ${item.label || ''} ${item.title || ''}`.toLowerCase();
    return fullText.includes(query);
  });

  return (
    <div className={`category-detail-container ${theme}`} data-theme={theme}>
      {/* Header com Navegação iOS e Campo de Busca Integrado */}
      <header className="category-header">
        {isSearchOpen ? (
          <div className="header-search-bar-wrapper">
            <div className="search-input-pill">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Buscar stickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-search-btn" 
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              type="button" 
              className="cancel-search-btn" 
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <button type="button" className="header-icon-btn back-btn" onClick={onBack} aria-label="Voltar para a página inicial">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <h1 className="category-page-title">{categoryTitle}</h1>

            <button 
              type="button" 
              className="header-icon-btn search-btn" 
              onClick={() => setIsSearchOpen(true)}
              aria-label="Pesquisar artes"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </>
        )}
      </header>

      {/* Feedback Discreto de Cópia Estilo iOS Toast */}
      {copyStatus.message && (
        <div className={`copy-toast-banner ${copyStatus.isSuccess ? 'success' : 'error'}`}>
          {copyStatus.message}
        </div>
      )}

      {/* Grade de 2 colunas com os Cards de Artes Tipográficas */}
      <main className="category-stickers-grid">
        {filteredStickers.length === 0 ? (
          <div className="no-stickers-found">
            <p>Nenhum sticker encontrado para "{searchQuery}".</p>
          </div>
        ) : (
          filteredStickers.map((item) => (
            <div 
              key={item.id} 
              className={`sticker-card ${copyStatus.id === item.id ? 'copying' : ''}`} 
              tabIndex="0" 
              role="button" 
              onClick={(e) => handleCopySticker(item, e)}
              aria-label={`Copiar sticker: ${item.mainText || item.label}`}
            >
            {/* Topo do Card: Botão de Favoritar */}
            <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
              {/* Botão de Favoritar (Coração com feedback imediato) */}
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

            {/* Conteúdo Central do Card */}
            <div className="sticker-content-center">
              {item.image_url ? (
                <div className="admin-uploaded-sticker-wrapper">
                  <img 
                    src={item.image_url} 
                    alt={item.title || item.mainText} 
                    className="dynamic-sticker-img"
                    style={{ maxWidth: '88px', maxHeight: '88px', objectFit: 'contain' }}
                  />
                </div>
              ) : item.isBottle ? (
                <div className="bottle-art-wrapper">
                  <span className="bottle-label-curved">{item.label}</span>
                  <div className="bottle-svg-icon">
                    <svg width="68" height="96" viewBox="0 0 100 140" fill="none">
                      {/* Corpo da Garrafa em Rosa Pastel Suave */}
                      <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                      {/* Tampa da garrafa */}
                      <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                      {/* Brilho de reflexo */}
                      <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className={`typography-wrapper ${item.styleVariant}`}>
                  {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                  <span className="typo-main">{item.mainText}</span>
                  {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                </div>
              )}
            </div>
          </div>
        )))}
      </main>
    </div>
  );
}

export default CategoryDetail;

