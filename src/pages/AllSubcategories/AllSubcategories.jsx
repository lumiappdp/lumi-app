import { useState } from 'react';
import { getCustomCovers } from '../../services/categoriesService';
import './AllSubcategories.css';

// Componente da Página "Todas as Subcategorias" do Lumi App
// Exibe a galeria completa de subcategorias/cards de um nicho específico
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('dark' ou 'light')
// @param {string} props.sectionTitle - Título do nicho selecionado (ex: 'Universais', 'Profissões')
// @param {Array} props.subcategories - Lista de cards/subcategorias disponíveis
// @param {Function} props.onSelectSubcategory - Callback ao escolher uma subcategoria específica
// @param {Function} props.onBack - Callback para retornar à Home
export function AllSubcategories({
  theme = 'dark',
  sectionTitle = 'Universais',
  subcategories = [],
  onSelectSubcategory,
  onBack,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra as subcategorias com base na busca
  const filteredList = subcategories.filter(item => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.overlayText.toLowerCase().includes(q) ||
      (item.tagLabel && item.tagLabel.toLowerCase().includes(q))
    );
  });

  const customCovers = getCustomCovers();

  return (
    <div className={`all-subcategories-page ${theme}`} data-theme={theme}>
      {/* Header com Navegação e Título do Nicho */}
      <header className="subcategories-header">
        <button type="button" className="subcategories-back-btn" onClick={onBack} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="subcategories-title">{sectionTitle}</h1>
      </header>

      {/* Barra de Busca de Subcategorias */}
      <div className="subcategories-search-container">
        <div className="subcategories-search-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder={`Buscar em ${sectionTitle}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
      </div>

      {/* Grade Completa de Subcategorias */}
      <main className="subcategories-grid">
        {filteredList.length === 0 ? (
          <p className="no-subcategories-msg">Nenhuma subcategoria encontrada para "{searchTerm}".</p>
        ) : (
          filteredList.map((item) => {
            const currentBg = customCovers[item.id] || item.bgImage;
            return (
              <div
                key={item.id}
                className="feed-card"
                style={{ backgroundImage: `url(${currentBg})` }}
                onClick={() => onSelectSubcategory && onSelectSubcategory(item.tagLabel || item.overlayText)}
                role="button"
                tabIndex="0"
                aria-label={`Ver artes de ${item.tagLabel || item.overlayText}`}
              >
                <div className="card-overlay-gradient">
                  <p className="card-custom-typography">{item.overlayText}</p>
                  {item.tagLabel && (
                    <div className="card-footer-pill">
                      {item.tagLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

export default AllSubcategories;
