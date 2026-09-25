import { useState, useEffect } from 'react';
import lumiHeartIcon from '../../../identidade-visual/9.png';
import { clipboardService } from '../../services/clipboardService';
import { favoritesService } from '../../services/favoritesService';
import './Favorites.css';

// Componente da Página de Favoritos - Lumi App
// Exibe a lista de stickers que o usuário favoritou, permitindo cópia direta para Stories
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('dark' ou 'light')
// @param {Function} props.onNavigate - Callback para transição entre abas
export function Favorites({ theme = 'dark', onNavigate }) {
  // Lista de stickers favoritos
  const [favoritesList, setFavoritesList] = useState([]);
  // Feedback de cópia
  const [copyStatus, setCopyStatus] = useState({ id: null, message: '', isSuccess: true });

  // Carrega os stickers favoritados do localStorage
  useEffect(() => {
    const list = favoritesService.getFavorites();
    setFavoritesList(list);
  }, []);

  // Copia o sticker para o clipboard do sistema
  const handleCopySticker = async (item, event) => {
    const cardElement = event.currentTarget.querySelector('.sticker-content-center') || event.currentTarget;

    setCopyStatus({ id: item.id, message: 'Copiando...', isSuccess: true });

    const result = await clipboardService.copyStickerImage({
      id: item.id,
      title: item.mainText || item.label,
      domElement: cardElement,
    });

    setCopyStatus({ id: item.id, message: result.message, isSuccess: result.success });

    setTimeout(() => {
      setCopyStatus({ id: null, message: '', isSuccess: true });
    }, 2500);
  };

  // Desfavorita o sticker da lista
  const handleRemoveFavorite = (item, e) => {
    e.stopPropagation();
    const updated = favoritesService.toggleFavorite(item);
    setFavoritesList(updated);
  };

  return (
    <div className={`favorites-page-container ${theme}`} data-theme={theme}>
      {/* Header com Navegação iOS */}
      <header className="favorites-header">
        <h1 className="favorites-page-title">Favoritos</h1>
      </header>

      {/* Feedback Toast de Cópia */}
      {copyStatus.message && (
        <div className={`copy-toast-banner ${copyStatus.isSuccess ? 'success' : 'error'}`}>
          {copyStatus.message}
        </div>
      )}

      {/* Lista / Grade de Stickers Favoritos */}
      <main className="favorites-grid-content">
        {favoritesList.length === 0 ? (
          <div className="favorites-empty-state">
            <div className="empty-heart-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <h2>Nenhum sticker favoritado</h2>
            <p>Toque no coração dos stickers que você mais gostar para encontrá-los facilmente aqui.</p>
          </div>
        ) : (
          <div className="category-stickers-grid">
            {favoritesList.map((item) => (
              <div 
                key={item.id} 
                className={`sticker-card ${copyStatus.id === item.id ? 'copying' : ''}`} 
                tabIndex="0" 
                role="button" 
                onClick={(e) => handleCopySticker(item, e)}
                aria-label={`Copiar sticker: ${item.mainText || item.label}`}
              >
                {/* Topo do Card: Botão de Desfavoritar */}
                <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>

                  <button
                    type="button"
                    className="favorite-toggle-btn favorited"
                    onClick={(e) => handleRemoveFavorite(item, e)}
                    aria-label="Remover dos favoritos"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#EAA1AC" stroke="#EAA1AC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>

                {/* Conteúdo Central do Card */}
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
                    <div className={`typography-wrapper ${item.styleVariant}`}>
                      {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                      <span className="typo-main">{item.mainText}</span>
                      {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Dock Flutuante de Navegação Inferior */}
      <nav className="bottom-nav-bar" aria-label="Navegação principal">
        {/* Início */}
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigate && onNavigate('home')}
          aria-label="Início"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <path d="M9 22V12h6v10"></path>
          </svg>
        </button>

        {/* Favoritos Ativo no Botão Hero Central */}
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
          className="nav-item"
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
    </div>
  );
}

export default Favorites;
