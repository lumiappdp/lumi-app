import { useState, useEffect, useRef } from 'react';
import { uploadSticker, getStickers } from '../../services/stickersService';
import { 
  getAllSections, 
  createNicheSection, 
  deleteNicheSection, 
  addSubcardToSection, 
  deleteSubcardFromSection, 
  getCustomCovers 
} from '../../services/categoriesService';
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

  // Estados para Gestão de Nichos e Subcards
  const [allSections, setAllSections] = useState(() => getAllSections());
  const [customCovers, setCustomCovers] = useState(() => getCustomCovers());
  const [newNicheTitle, setNewNicheTitle] = useState('');
  const [targetNicheId, setTargetNicheId] = useState(() => allSections[0]?.id || 'universais');
  const [subcardOverlayText, setSubcardOverlayText] = useState('');
  const [subcardTagLabel, setSubcardTagLabel] = useState('');
  const [subcardImageFile, setSubcardImageFile] = useState(null);
  const [subcardPreviewUrl, setSubcardPreviewUrl] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState(null);

  // Manipulador para criar novo Nicho
  const handleCreateNicheSubmit = async (e) => {
    e.preventDefault();
    if (!newNicheTitle.trim()) return;

    setCategoryFeedback(null);
    try {
      await createNicheSection(newNicheTitle);
      const updated = getAllSections();
      setAllSections(updated);
      setNewNicheTitle('');
      setCategoryFeedback({ type: 'success', message: `Nicho "${newNicheTitle}" criado com sucesso!` });
    } catch (err) {
      setCategoryFeedback({ type: 'error', message: err.message || 'Erro ao criar nicho.' });
    }
  };

  // Manipulador para excluir Nicho
  const handleDeleteNiche = (sectionId, title) => {
    if (!window.confirm(`Tem certeza de que deseja excluir o nicho "${title}" e todos os seus subcards?`)) return;
    const updated = deleteNicheSection(sectionId);
    setAllSections(updated);
    setCategoryFeedback({ type: 'success', message: `Nicho "${title}" removido com sucesso.` });
  };

  // Manipulador para adicionar Subcard
  const handleAddSubcardSubmit = async (e) => {
    e.preventDefault();
    if (!subcardOverlayText.trim() || !targetNicheId) return;

    setIsUploading(true);
    setCategoryFeedback(null);
    try {
      await addSubcardToSection(targetNicheId, {
        overlayText: subcardOverlayText,
        tagLabel: subcardTagLabel,
        fileOrUrl: subcardImageFile,
      });

      const updated = getAllSections();
      setAllSections(updated);
      setCustomCovers(getCustomCovers());
      setSubcardOverlayText('');
      setSubcardTagLabel('');
      setSubcardImageFile(null);
      setSubcardPreviewUrl('');
      setCategoryFeedback({ type: 'success', message: 'Subcard adicionado com sucesso ao nicho!' });
    } catch (err) {
      setCategoryFeedback({ type: 'error', message: err.message || 'Erro ao salvar subcard.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Manipulador para excluir Subcard
  const handleDeleteSubcard = (sectionId, cardId, text) => {
    if (!window.confirm(`Deseja remover o card "${text}"?`)) return;
    const updated = deleteSubcardFromSection(sectionId, cardId);
    setAllSections(updated);
    setCategoryFeedback({ type: 'success', message: `Card "${text}" removido com sucesso.` });
  };

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

      {/* Conteúdo da Aba 2: Gestão de Nichos e Subcards */}
      {activeTab === 'categories' && (
        <section className="admin-content-section">
          {/* Feedback de Criação de Nichos / Subcards */}
          {categoryFeedback && (
            <div className={`admin-feedback-alert ${categoryFeedback.type}`}>
              {categoryFeedback.message}
            </div>
          )}

          {/* Card 1: Criar Novo Nicho */}
          <form className="admin-form-card" onSubmit={handleCreateNicheSubmit}>
            <h2 className="admin-section-heading">Criar Novo Nicho (Seção Principal)</h2>
            <p className="admin-field-hint" style={{ color: '#A0909C', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
              Exemplo: Maternidade, Casamento, Estética, Odontologia, Pets...
            </p>

            <div className="admin-field-group">
              <label>Nome do Nicho</label>
              <input
                type="text"
                placeholder="Ex: Maternidade & Família"
                value={newNicheTitle}
                onChange={(e) => setNewNicheTitle(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="admin-submit-btn" style={{ marginTop: '0.5rem' }}>
              + Criar Novo Nicho
            </button>
          </form>

          {/* Card 2: Adicionar Novo Subcard a um Nicho */}
          <form className="admin-form-card" onSubmit={handleAddSubcardSubmit}>
            <h2 className="admin-section-heading">Adicionar Subcard no Nicho</h2>

            {/* Selecionar Nicho Pai */}
            <div className="admin-field-group">
              <label>Escolha o Nicho Pai</label>
              <select
                value={targetNicheId}
                onChange={(e) => setTargetNicheId(e.target.value)}
                className="admin-select"
              >
                {allSections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Texto de Sobreposição do Card */}
            <div className="admin-field-group">
              <label>Texto de Sobreposição (Frase do Card)</label>
              <input
                type="text"
                placeholder="Ex: consultório moderno, rotina do bebê..."
                value={subcardOverlayText}
                onChange={(e) => setSubcardOverlayText(e.target.value)}
                required
              />
            </div>

            {/* Tag / Subtítulo */}
            <div className="admin-field-group">
              <label>Tag / Subtítulo do Card</label>
              <input
                type="text"
                placeholder="Ex: Saúde | Clínica, Enxoval | Dicas..."
                value={subcardTagLabel}
                onChange={(e) => setSubcardTagLabel(e.target.value)}
              />
            </div>

            {/* Upload da Imagem de Capa do Subcard */}
            <div className="admin-field-group">
              <label>Imagem de Capa do Card</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSubcardImageFile(file);
                    setSubcardPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />
              {subcardPreviewUrl && (
                <div style={{ marginTop: '0.75rem', maxWidth: '140px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={subcardPreviewUrl} alt="Preview da Capa" style={{ width: '100%', display: 'block' }} />
                </div>
              )}
            </div>

            <button type="submit" disabled={isUploading} className="admin-submit-btn">
              {isUploading ? 'Salvando Subcard...' : '+ Adicionar Subcard'}
            </button>
          </form>

          {/* Lista e Gestão de Nichos Cadastrados */}
          <div className="admin-gallery-card">
            <h3 className="admin-section-heading">Nichos Ativos no App ({allSections.length})</h3>

            <div className="admin-sections-manager-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {allSections.map((sec) => (
                <div 
                  key={sec.id} 
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(234,161,172,0.15)',
                    borderRadius: '16px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>{sec.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#EAA1AC', marginLeft: '0.6rem' }}>
                        ({sec.cards?.length || 0} subcards)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNiche(sec.id, sec.title)}
                      style={{
                        background: 'rgba(255, 77, 77, 0.15)',
                        border: '1px solid #FF4D4D',
                        color: '#FF8080',
                        borderRadius: '8px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Excluir Nicho
                    </button>
                  </div>

                  {/* Subcards dentro deste Nicho */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem' }}>
                    {(sec.cards || []).map((card) => {
                      const currentBg = customCovers[card.id] || card.bgImage;
                      return (
                        <div
                          key={card.id}
                          style={{
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            height: '110px',
                            backgroundImage: `url(${currentBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '0.5rem',
                          }}
                        >
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
                          <span style={{ position: 'relative', zIndex: 2, fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                            {card.overlayText}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubcard(sec.id, card.id, card.overlayText)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(0,0,0,0.7)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 3,
                              fontSize: '11px',
                            }}
                            title="Remover subcard"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;
