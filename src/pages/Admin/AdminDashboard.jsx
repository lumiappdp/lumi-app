import { useState, useEffect, useRef } from 'react';
import { uploadSticker, getStickers, getCategories } from '../../services/stickersService';
import { supabase } from '../../services/supabaseClient';
import './AdminDashboard.css';

// Componente do Painel de Administração do Lumi App
// Permite ao administrador fazer upload de figurinhas para o Storage/DB, cadastrar categorias e gerenciar o catálogo
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('light' ou 'dark')
// @param {Function} props.onBack - Callback para retornar à tela anterior (Perfil ou Home)
export function AdminDashboard({ theme = 'dark', onBack }) {
  // Controle de abas ativas do painel admin ('stickers' ou 'categories')
  const [activeTab, setActiveTab] = useState('stickers');

  // Estados do formulário de upload de figurinha
  const [stickerTitle, setStickerTitle] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('bebida-comida');
  const [stickerType, setStickerType] = useState('sticker');
  const [tagsInput, setTagsInput] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  // Lista de categorias e figurinhas cadastradas
  const [categoriesList, setCategoriesList] = useState([
    { slug: 'bebida-comida', title: 'Bebida | Comida' },
    { slug: 'universais', title: 'Universais' },
    { slug: 'profissoes', title: 'Profissões' },
    { slug: 'lojas-comercios', title: 'Lojas | Comércios' },
    { slug: 'datas-comemorativas', title: 'Datas comemorativas' },
    { slug: 'repost', title: 'Repost' },
    { slug: 'minimalistas', title: 'Minimalistas' },
    { slug: 'frases', title: 'Frases' },
    { slug: 'elementos', title: 'Elementos' },
  ]);
  const [recentStickers, setRecentStickers] = useState([]);
  const [selectedStickerIds, setSelectedStickerIds] = useState([]);
  const fileInputRef = useRef(null);

  // Carrega figurinhas cadastradas do Supabase ao montar o componente
  useEffect(() => {
    loadStickers();
  }, []);

  // Busca lista de figurinhas recentes do banco
  const loadStickers = async () => {
    try {
      const data = await getStickers();
      setRecentStickers(data);
    } catch (err) {
      console.log('Modo offline / Supabase aguardando uploads:', err);
    }
  };

  // Alterna a seleção de uma figurinha
  const handleToggleSelect = (id) => {
    setSelectedStickerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Seleciona ou desseleciona todas as figurinhas
  const handleToggleSelectAll = () => {
    if (selectedStickerIds.length === recentStickers.length) {
      setSelectedStickerIds([]);
    } else {
      setSelectedStickerIds(recentStickers.map(s => s.id));
    }
  };

  // Apaga todas as figurinhas selecionadas de uma vez
  const handleDeleteSelectedStickers = async () => {
    if (selectedStickerIds.length === 0) return;
    const count = selectedStickerIds.length;
    if (!window.confirm(`Tem certeza de que deseja apagar ${count} figurinha(s) selecionada(s)?`)) return;

    try {
      const { error } = await supabase
        .from('stickers')
        .delete()
        .in('id', selectedStickerIds);

      if (error) throw error;
      setRecentStickers(prev => prev.filter(s => !selectedStickerIds.includes(s.id)));
      setSelectedStickerIds([]);
    } catch (err) {
      alert('Erro ao apagar figurinhas: ' + err.message);
    }
  };

  // Trata a seleção de arquivos de imagem locais
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(previews);
    }
  };

  // Submissão do formulário e upload dos stickers para o Supabase
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Por favor, selecione ao menos uma imagem PNG de figurinha.');
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean);

    try {
      // Faz upload de cada arquivo selecionado
      for (const file of selectedFiles) {
        const title = stickerTitle || file.name.replace(/\.[^/.]+$/, '');
        await uploadSticker({
          file,
          title,
          categorySlug: selectedCategorySlug,
          tags,
          type: stickerType,
        });
      }

      setUploadFeedback({ type: 'success', message: 'Figurinha(s) enviada(s) com sucesso para o banco!' });
      setSelectedFiles([]);
      setPreviewUrls([]);
      setStickerTitle('');
      setTagsInput('');
      loadStickers();
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadFeedback({ 
        type: 'error', 
        message: 'Erro no upload: ' + (error.message || 'Verifique sua conexão com o Supabase') 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Exclui uma figurinha do banco
  const handleDeleteSticker = async (stickerId) => {
    if (!window.confirm('Tem certeza de que deseja remover esta figurinha?')) return;
    try {
      const { error } = await supabase.from('stickers').delete().eq('id', stickerId);
      if (error) throw error;
      setRecentStickers(prev => prev.filter(s => s.id !== stickerId));
    } catch (err) {
      alert('Erro ao excluir figurinha: ' + err.message);
    }
  };

  return (
    <div className={`admin-dashboard-page ${theme}`} data-theme={theme}>
      {/* Topo / Header com botão de voltar */}
      <header className="admin-header">
        <button type="button" className="admin-back-btn" onClick={onBack} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="admin-title-wrap">
          <h1 className="admin-title">Painel de Controle</h1>
          <span className="admin-badge">ADMIN</span>
        </div>
      </header>

      {/* Abas de Navegação Admin */}
      <nav className="admin-tabs-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setActiveTab('stickers')}
        >
          Figurinhas & Upload
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categorias & Capas
        </button>
      </nav>

      {/* Conteúdo da Aba 1: Upload de Figurinhas */}
      {activeTab === 'stickers' && (
        <section className="admin-content-section">
          <form className="admin-form-card" onSubmit={handleUploadSubmit}>
            <h2 className="admin-section-heading">Subir Nova Figurinha (PNG)</h2>

            {/* Feedback de status */}
            {uploadFeedback && (
              <div className={`admin-feedback-alert ${uploadFeedback.type}`}>
                {uploadFeedback.message}
              </div>
            )}

            {/* Área de Drop / Seleção de Arquivo */}
            <div 
              className="admin-dropzone" 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/webp,image/svg+xml"
                multiple
                style={{ display: 'none' }}
              />
              <div className="dropzone-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p className="dropzone-text">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} arquivo(s) selecionado(s)` 
                  : 'Clique para selecionar arquivos PNG com fundo transparente'}
              </p>
            </div>

            {/* Previews das Imagens Selecionadas */}
            {previewUrls.length > 0 && (
              <div className="admin-previews-grid">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="admin-preview-item">
                    <img src={url} alt="Preview" />
                  </div>
                ))}
              </div>
            )}

            {/* Campo Nome da Figurinha */}
            <div className="admin-field-group">
              <label>Nome / Título da Figurinha</label>
              <input
                type="text"
                placeholder="Ex: Bom dia especial"
                value={stickerTitle}
                onChange={(e) => setStickerTitle(e.target.value)}
                className="admin-input-pill"
              />
            </div>

            {/* Campo Categoria */}
            <div className="admin-field-group">
              <label>Categoria / Nicho</label>
              <select
                value={selectedCategorySlug}
                onChange={(e) => setSelectedCategorySlug(e.target.value)}
                className="admin-input-pill"
              >
                {categoriesList.map(cat => (
                  <option key={cat.slug} value={cat.slug}>{cat.title}</option>
                ))}
              </select>
            </div>

            {/* Campo Tipo de Elemento */}
            <div className="admin-field-group">
              <label>Tipo</label>
              <select
                value={stickerType}
                onChange={(e) => setStickerType(e.target.value)}
                className="admin-input-pill"
              >
                <option value="sticker">Figurinha Padrão</option>
                <option value="phrase">Frase / Tipografia</option>
                <option value="element">Elemento / Ilustração</option>
              </select>
            </div>

            {/* Campo Tags de Busca */}
            <div className="admin-field-group">
              <label>Palavras-chave (Tags para busca separadas por vírgula)</label>
              <input
                type="text"
                placeholder="Ex: café, manhã, stories, promoção"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="admin-input-pill"
              />
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={isUploading}
              className="admin-submit-btn"
            >
              {isUploading ? 'Enviando para o Supabase...' : 'Publicar no Aplicativo 🚀'}
            </button>
          </form>

          {/* Galeria de Figurinhas Cadastradas com Seleção Múltipla */}
          <div className="admin-gallery-card">
            <div className="admin-gallery-header-row">
              <h3 className="admin-section-heading" style={{ margin: 0 }}>
                Figurinhas no Banco ({recentStickers.length})
              </h3>

              {recentStickers.length > 0 && (
                <div className="admin-bulk-actions-wrap">
                  <button
                    type="button"
                    className="admin-select-all-btn"
                    onClick={handleToggleSelectAll}
                  >
                    {selectedStickerIds.length === recentStickers.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>

                  {selectedStickerIds.length > 0 && (
                    <button
                      type="button"
                      className="admin-bulk-delete-btn"
                      onClick={handleDeleteSelectedStickers}
                    >
                      Apagar Selecionadas ({selectedStickerIds.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {recentStickers.length === 0 ? (
              <p className="admin-empty-text">Nenhuma figurinha cadastrada ainda no Supabase.</p>
            ) : (
              <div className="admin-stickers-grid">
                {recentStickers.map(stk => {
                  const isSelected = selectedStickerIds.includes(stk.id);
                  return (
                    <div 
                      key={stk.id} 
                      className={`admin-sticker-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleSelect(stk.id)}
                    >
                      {/* Checkbox de Seleção */}
                      <div className={`admin-card-checkbox ${isSelected ? 'checked' : ''}`}>
                        {isSelected && '✓'}
                      </div>

                      <img src={stk.image_url} alt={stk.title} />
                      <span className="admin-sticker-name">{stk.title}</span>

                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSticker(stk.id);
                        }}
                        title="Excluir figurinha"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Conteúdo da Aba 2: Gestão de Categorias */}
      {activeTab === 'categories' && (
        <section className="admin-content-section">
          <div className="admin-form-card">
            <h2 className="admin-section-heading">Categorias e Capas da Home</h2>
            <p className="admin-empty-text">
              Em breve: Adição dinâmica de novos nichos e upload de capas personalizadas para cada card da Home.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;
