import { useState, useEffect, useRef } from 'react';
import { uploadSticker, getStickers } from '../../services/stickersService';
import { 
  getAllSections, 
  getSectionsFromSupabase,
  createNicheSection, 
  updateNicheSection,
  deleteNicheSection, 
  addSubcardToSection, 
  deleteSubcardFromSection, 
  getCustomCovers,
  getCustomCoversFromSupabase
} from '../../services/categoriesService';
import { 
  getAdminUsers, 
  updateUserPaymentStatus, 
  updateUserPlan, 
  getTeamMembers, 
  addTeamMember, 
  removeTeamMember, 
  getGlobalAnnouncement, 
  saveGlobalAnnouncement,
  getUserSuggestions
} from '../../services/adminService';
import { supabase } from '../../services/supabaseClient';
import './AdminDashboard.css';

// Componente do Painel de Administração do Lumi App
// Permite ao administrador fazer upload de figurinhas para o Storage/DB, cadastrar categorias, gerenciar clientes, equipe e avisos
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('light' ou 'dark')
// @param {Function} props.onBack - Callback para retornar à tela anterior (Perfil ou Home)
export function AdminDashboard({ theme = 'dark', onBack }) {
  // Controle de abas ativas do painel admin ('stickers', 'categories', 'users', 'team', 'announcements')
  const [activeTab, setActiveTab] = useState('stickers');

  // Estados do formulário de upload de figurinha
  const [stickerTitle, setStickerTitle] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('elementos');
  const [stickerType, setStickerType] = useState('element');
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
  const [targetNicheId, setTargetNicheId] = useState(() => allSections[0]?.id || 'elementos');
  const [subcardOverlayText, setSubcardOverlayText] = useState('');
  const [subcardTagLabel, setSubcardTagLabel] = useState('');
  const [subcardImageFile, setSubcardImageFile] = useState(null);
  const [subcardPreviewUrl, setSubcardPreviewUrl] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState(null);

  // Estados para Edição de Nicho / Categoria
  const [editingNiche, setEditingNiche] = useState(null);
  const [editNicheTitle, setEditNicheTitle] = useState('');
  const [editNicheCoverFile, setEditNicheCoverFile] = useState(null);
  const [editNichePreviewUrl, setEditNichePreviewUrl] = useState('');

  // Estados para Gestão de Clientes & Suporte
  const [userList, setUserList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFeedback, setUserFeedback] = useState(null);

  // Estados para Gestão de Equipe
  const [teamList, setTeamList] = useState(() => getTeamMembers());
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [newTeamRole, setNewTeamRole] = useState('Designer');
  const [teamFeedback, setTeamFeedback] = useState(null);

  // Estados para Avisos Globais e Métricas
  const [announcement, setAnnouncement] = useState(() => getGlobalAnnouncement());
  const [announcementFeedback, setAnnouncementFeedback] = useState(null);
  const [userSuggestionsList, setUserSuggestionsList] = useState(() => getUserSuggestions());

  // Carrega seções sincronizadas diretamente do Supabase
  const loadSections = async () => {
    try {
      const data = await getSectionsFromSupabase();
      if (data && data.length > 0) {
        setAllSections(data);
        // Garante que o select do formulário de subcard aponte para um nicho real existente
        setTargetNicheId(prev => {
          const exists = data.some(s => s.id === prev);
          return exists ? prev : data[0].id;
        });
      }
      const covers = await getCustomCoversFromSupabase();
      if (covers) setCustomCovers(covers);
    } catch (err) {
      console.warn('Erro ao carregar seções no Admin:', err);
    }
  };

  // Carrega lista de usuários para a aba de Suporte
  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUserList(data);
    } catch (err) {
      console.warn('Erro ao listar usuários:', err);
    }
  };

  // Carrega seções e dados ao montar o painel
  useEffect(() => {
    loadSections();
    loadStickers();
    loadUsers();
  }, []);

  // Alterna o status de pagamento do usuário (Ativo <-> Inativo)
  const handleToggleUserStatus = async (user) => {
    const isCurrentlyActive = user.payment_status === 'active' || user.payment_status === 'paid';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    try {
      await updateUserPaymentStatus(user.email, newStatus);
      setUserList(prev => prev.map(u => u.email === user.email ? { ...u, payment_status: newStatus } : u));
      setUserFeedback({ type: 'success', message: `Status de ${user.email} alterado para ${newStatus.toUpperCase()} com sucesso!` });
    } catch (err) {
      setUserFeedback({ type: 'error', message: err.message || 'Erro ao alterar status.' });
    }
  };

  // Altera o plano do usuário (Mensal / Anual)
  const handleChangeUserPlan = async (user, newPlan) => {
    try {
      await updateUserPlan(user.email, newPlan);
      setUserList(prev => prev.map(u => u.email === user.email ? { ...u, plan: newPlan } : u));
      setUserFeedback({ type: 'success', message: `Plano de ${user.email} atualizado para ${newPlan === 'annual' ? 'Anual' : 'Mensal'}.` });
    } catch (err) {
      setUserFeedback({ type: 'error', message: err.message || 'Erro ao atualizar plano.' });
    }
  };

  // Cadastra novo membro da equipe
  const handleAddTeamSubmit = (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamEmail.trim()) return;

    try {
      const updated = addTeamMember({
        name: newTeamName,
        email: newTeamEmail,
        role: newTeamRole
      });
      setTeamList(updated);
      setNewTeamName('');
      setNewTeamEmail('');
      setTeamFeedback({ type: 'success', message: 'Membro adicionado à equipe com sucesso!' });
    } catch (err) {
      setTeamFeedback({ type: 'error', message: err.message || 'Erro ao adicionar membro.' });
    }
  };

  // Remove membro da equipe
  const handleRemoveTeam = (memberId, name) => {
    if (!window.confirm(`Deseja remover ${name} da equipe?`)) return;
    const updated = removeTeamMember(memberId);
    setTeamList(updated);
    setTeamFeedback({ type: 'success', message: `${name} removido da equipe.` });
  };

  // Salva o aviso global do App
  const handleSaveAnnouncementSubmit = (e) => {
    e.preventDefault();
    saveGlobalAnnouncement(announcement);
    setAnnouncementFeedback({ type: 'success', message: 'Aviso global salvo e publicado em tempo real!' });
    setTimeout(() => setAnnouncementFeedback(null), 3500);
  };

  // Manipulador para criar novo Nicho
  const handleCreateNicheSubmit = async (e) => {
    e.preventDefault();
    if (!newNicheTitle.trim()) return;

    setCategoryFeedback(null);
    try {
      await createNicheSection(newNicheTitle);
      await loadSections();
      setNewNicheTitle('');
      setCategoryFeedback({ type: 'success', message: `Nicho "${newNicheTitle}" criado com sucesso!` });
    } catch (err) {
      setCategoryFeedback({ type: 'error', message: err.message || 'Erro ao criar nicho.' });
    }
  };

  // Manipulador para excluir Nicho
  const handleDeleteNiche = async (sectionId, title) => {
    if (!window.confirm(`Tem certeza de que deseja excluir o nicho "${title}" e todos os seus subcards?`)) return;
    try {
      const updated = await deleteNicheSection(sectionId);
      setAllSections(updated);
      setCategoryFeedback({ type: 'success', message: `Nicho "${title}" removido com sucesso.` });
      await loadSections();
    } catch (err) {
      setCategoryFeedback({ type: 'error', message: err.message || 'Erro ao excluir nicho.' });
    }
  };

  // Abre modal / formulário para editar Nicho
  const handleOpenEditNiche = (niche) => {
    setEditingNiche(niche);
    setEditNicheTitle(niche.title || '');
    setEditNicheCoverFile(null);
    setEditNichePreviewUrl(niche.cards?.[0]?.bgImage || '');
  };

  // Fecha o modal de edição
  const handleCloseEditNiche = () => {
    setEditingNiche(null);
    setEditNicheTitle('');
    setEditNicheCoverFile(null);
    setEditNichePreviewUrl('');
  };

  // Salva alterações do Nicho no Supabase e localmente
  const handleSaveEditNicheSubmit = async (e) => {
    e.preventDefault();
    if (!editingNiche) return;

    setIsUploading(true);
    setCategoryFeedback(null);

    try {
      const updated = await updateNicheSection(editingNiche.id, {
        title: editNicheTitle,
        coverFileOrUrl: editNicheCoverFile,
      });

      setAllSections(updated);
      setCategoryFeedback({ type: 'success', message: 'Nicho atualizado com sucesso!' });
      handleCloseEditNiche();
      await loadSections();
    } catch (err) {
      setCategoryFeedback({ type: 'error', message: err.message || 'Erro ao atualizar nicho.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Manipulador para adicionar Subcard
  const handleAddSubcardSubmit = async (e) => {
    e.preventDefault();
    const cleanLabel = subcardTagLabel.trim();
    if (!cleanLabel || !targetNicheId) return;

    setIsUploading(true);
    setCategoryFeedback(null);
    try {
      await addSubcardToSection(targetNicheId, {
        overlayText: subcardOverlayText.trim() || cleanLabel,
        tagLabel: cleanLabel,
        fileOrUrl: subcardImageFile,
      });

      await loadSections();
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
  const handleDeleteSubcard = async (sectionId, cardId, text) => {
    if (!window.confirm(`Deseja remover o card "${text}"?`)) return;
    try {
      const updated = await deleteSubcardFromSection(sectionId, cardId);
      setAllSections(updated);
      setCategoryFeedback({ type: 'success', message: `Card "${text}" removido com sucesso.` });
      await loadSections();
    } catch (err) {
      setCategoryFeedback({ type: 'error', message: err.message || 'Erro ao remover card.' });
    }
  };

  // Lista dinâmica de categorias alimentada diretamente pelos nichos reais cadastrados
  // Garante que o slug corresponda a uma categoria pai existente no Supabase e embute a subcategoria como tag
  const dynamicCategories = [
    { slug: 'elementos', title: 'Elementos & Desenhos (Aba Elementos)', subtag: 'elementos' },
    ...allSections.map(sec => ({ 
      slug: sec.slug || sec.id, 
      title: sec.title, 
      subtag: (sec.title || '').toLowerCase() 
    })),
    ...allSections.flatMap(sec => (sec.cards || []).map(c => {
      const cardTitle = c.tagLabel || c.overlayText || '';
      return {
        slug: sec.slug || sec.id,
        title: `${sec.title} → ${cardTitle}`,
        subtag: cardTitle.toLowerCase().trim()
      };
    }))
  ];

  const [recentStickers, setRecentStickers] = useState([]);
  const [selectedStickerIds, setSelectedStickerIds] = useState([]);
  const fileInputRef = useRef(null);

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

    const selectedOption = dynamicCategories.find((cat, idx) => `${cat.slug}_${idx}` === selectedCategorySlug || cat.slug === selectedCategorySlug);
    const targetSlug = selectedOption ? selectedOption.slug : (selectedCategorySlug || 'elementos');
    const autoSubtag = selectedOption?.subtag ? selectedOption.subtag : '';

    const userTags = tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean);

    // Mescla tags do usuário com a tag automática da subcategoria sem duplicar
    const finalTags = Array.from(new Set([...userTags, ...(autoSubtag ? [autoSubtag] : [])]));

    try {
      // Faz upload de cada arquivo selecionado
      for (const file of selectedFiles) {
        const title = stickerTitle || file.name.replace(/\.[^/.]+$/, '');
        await uploadSticker({
          file,
          title,
          categorySlug: targetSlug,
          tags: finalTags,
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
          Figurinhas
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Nichos
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            loadUsers();
          }}
        >
          Clientes
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Equipe
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Avisos & Métricas
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
                {dynamicCategories.map((cat, idx) => (
                  <option key={`${cat.slug}_${idx}`} value={`${cat.slug}_${idx}`}>{cat.title}</option>
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

            {/* Campo Tags de Busca com Chips Rápidos */}
            <div className="admin-field-group">
              <label>Palavras-chave (Tags para busca separadas por vírgula)</label>
              
              {/* Botões de atalho de tags frequentes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {['branco', 'preto', 'sombra', 'fundo', 'linha', 'moldura', 'minimalista', 'frase', 'engajamento', 'stories', 'polaroid', 'seta', 'loja', 'rotina'].map((presetTag) => (
                  <button
                    key={presetTag}
                    type="button"
                    onClick={() => {
                      const currentTags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
                      if (!currentTags.includes(presetTag)) {
                        setTagsInput(currentTags.length > 0 ? `${tagsInput}, ${presetTag}` : presetTag);
                      }
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(234, 161, 172, 0.3)',
                      borderRadius: '16px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      color: 'inherit',
                      cursor: 'pointer'
                    }}
                  >
                    +{presetTag}
                  </button>
                ))}
              </div>

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
              {isUploading ? 'Enviando para o Supabase...' : 'Publicar no Aplicativo'}
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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
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

            {/* Nome da Subcategoria (Campo Principal Obrigatório) */}
            <div className="admin-field-group">
              <label>Nome da Subcategoria / Tema</label>
              <input
                type="text"
                placeholder="Ex: Advocacia, Odonto, Medicina, Stories, Fotografia..."
                value={subcardTagLabel}
                onChange={(e) => setSubcardTagLabel(e.target.value)}
                required
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

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditNiche(sec)}
                        style={{
                          background: 'rgba(234, 161, 172, 0.15)',
                          border: '1px solid #EAA1AC',
                          color: '#EAA1AC',
                          borderRadius: '8px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                        Editar
                      </button>

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
                            {card.tagLabel || card.overlayText}
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

      {/* Conteúdo da Aba 3: Gestão de Clientes & Suporte Imediato */}
      {activeTab === 'users' && (
        <section className="admin-content-section">
          {userFeedback && (
            <div className={`admin-feedback-alert ${userFeedback.type}`}>
              {userFeedback.message}
            </div>
          )}

          <div className="admin-form-card">
            <h2 className="admin-section-heading">Gestão de Clientes & Acesso</h2>
            <p style={{ color: '#A0909C', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              Libere ou bloqueie o acesso de clientes instantaneamente em caso de PIX direto ou suporte.
            </p>

            {/* Campo de Busca de Clientes */}
            <div className="admin-field-group">
              <label>Buscar Cliente por E-mail ou Nome</label>
              <input
                type="text"
                placeholder="Ex: cliente@gmail.com ou Maria..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>

            {/* Lista de Usuários */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {userList
                .filter(u => {
                  if (!userSearchTerm) return true;
                  const term = userSearchTerm.toLowerCase();
                  return (u.email || '').toLowerCase().includes(term) || (u.name || '').toLowerCase().includes(term);
                })
                .map((u) => {
                  const isActive = u.payment_status === 'active' || u.payment_status === 'paid';
                  return (
                    <div 
                      key={u.id || u.email}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(181, 206, 107, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`,
                        borderRadius: '16px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#FFF' }}>{u.name || 'Usuário Sem Nome'}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#A0909C' }}>{u.email}</div>
                        </div>

                        {/* Badge de Status */}
                        <span 
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 'bold',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '20px',
                            background: isActive ? 'rgba(181, 206, 107, 0.15)' : 'rgba(255, 77, 77, 0.15)',
                            color: isActive ? '#B5CE6B' : '#FF8080',
                            border: `1px solid ${isActive ? '#B5CE6B' : '#FF4D4D'}`
                          }}
                        >
                          {isActive ? 'ACESSO ATIVO' : 'BLOQUEADO'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {/* Seletor de Plano */}
                        <select
                          value={u.plan || 'annual'}
                          onChange={(e) => handleChangeUserPlan(u, e.target.value)}
                          className="admin-select"
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', width: 'auto' }}
                        >
                          <option value="annual">Plano Anual</option>
                          <option value="monthly">Plano Mensal</option>
                        </select>

                        {/* Botão de Liberação / Bloqueio Manual */}
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          style={{
                            background: isActive ? 'rgba(255, 77, 77, 0.15)' : 'rgba(181, 206, 107, 0.15)',
                            border: `1px solid ${isActive ? '#FF4D4D' : '#B5CE6B'}`,
                            color: isActive ? '#FF8080' : '#B5CE6B',
                            borderRadius: '8px',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? 'Bloquear Acesso' : 'Liberar Acesso Instantâneo'}
                        </button>
                      </div>
                    </div>
                  );
                })}

              {userList.length === 0 && (
                <p style={{ color: '#A0909C', textAlign: 'center', fontSize: '0.88rem' }}>
                  Nenhum usuário cadastrado encontrado no banco.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Conteúdo da Aba 4: Gestão de Equipe & Designers */}
      {activeTab === 'team' && (
        <section className="admin-content-section">
          {teamFeedback && (
            <div className={`admin-feedback-alert ${teamFeedback.type}`}>
              {teamFeedback.message}
            </div>
          )}

          {/* Card: Cadastrar Membro da Equipe */}
          <form className="admin-form-card" onSubmit={handleAddTeamSubmit}>
            <h2 className="admin-section-heading">Adicionar Membro na Equipe</h2>
            <p style={{ color: '#A0909C', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Permita que designers e assistentes ajudem no upload de figurinhas.
            </p>

            <div className="admin-field-group">
              <label>Nome do Colaborador</label>
              <input
                type="text"
                placeholder="Ex: Ana Designer"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
            </div>

            <div className="admin-field-group">
              <label>E-mail do Colaborador</label>
              <input
                type="email"
                placeholder="Ex: ana.design@gmail.com"
                value={newTeamEmail}
                onChange={(e) => setNewTeamEmail(e.target.value)}
                required
              />
            </div>

            <div className="admin-field-group">
              <label>Função / Permissão</label>
              <select
                value={newTeamRole}
                onChange={(e) => setNewTeamRole(e.target.value)}
                className="admin-select"
              >
                <option value="Designer">Designer (Upload de Figurinhas & Capas)</option>
                <option value="Suporte">Suporte ao Cliente</option>
                <option value="Admin">Administrador Geral</option>
              </select>
            </div>

            <button type="submit" className="admin-submit-btn" style={{ marginTop: '0.5rem' }}>
              + Cadastrar Colaborador
            </button>
          </form>

          {/* Lista de Membros da Equipe */}
          <div className="admin-gallery-card">
            <h3 className="admin-section-heading">Equipe Ativa ({teamList.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {teamList.map(member => (
                <div 
                  key={member.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(234,161,172,0.2)',
                    borderRadius: '14px',
                    padding: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>{member.name}</strong>
                    <div style={{ color: '#A0909C', fontSize: '0.78rem' }}>{member.email}</div>
                    <span style={{ fontSize: '0.72rem', color: '#EAA1AC', fontWeight: 'bold' }}>{member.role}</span>
                  </div>

                  {member.email !== 'contato.lumiapp@gmail.com' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTeam(member.id, member.name)}
                      style={{
                        background: 'rgba(255,77,77,0.15)',
                        border: '1px solid #FF4D4D',
                        color: '#FF8080',
                        borderRadius: '8px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Conteúdo da Aba 5: Avisos Globais & Métricas */}
      {activeTab === 'announcements' && (
        <section className="admin-content-section">
          {announcementFeedback && (
            <div className={`admin-feedback-alert ${announcementFeedback.type}`}>
              {announcementFeedback.message}
            </div>
          )}

          {/* Cards de Métricas em Tempo Real */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div className="admin-form-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#EAA1AC' }}>
                {recentStickers.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#A0909C', marginTop: '0.2rem' }}>
                Figurinhas Ativas
              </div>
            </div>

            <div className="admin-form-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#B5CE6B' }}>
                {allSections.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#A0909C', marginTop: '0.2rem' }}>
                Nichos Criados
              </div>
            </div>

            <div className="admin-form-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FFF' }}>
                {userList.filter(u => u.payment_status === 'active' || u.payment_status === 'paid').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#A0909C', marginTop: '0.2rem' }}>
                Assinantes Ativos
              </div>
            </div>
          </div>

          {/* Formulário de Aviso Global no App */}
          <form className="admin-form-card" onSubmit={handleSaveAnnouncementSubmit}>
            <h2 className="admin-section-heading">Banner de Aviso Global no App</h2>
            <p style={{ color: '#A0909C', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
              Exibe uma barra elegante de novidades ou comunicado importante no topo da Home de todos os celulares.
            </p>

            <div className="admin-field-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={announcement.active}
                  onChange={(e) => setAnnouncement(prev => ({ ...prev, active: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#EAA1AC' }}
                />
                <span style={{ fontSize: '0.92rem', color: '#FFF', fontWeight: 'bold' }}>
                  Ativar Aviso Global no Aplicativo
                </span>
              </label>
            </div>

            <div className="admin-field-group" style={{ marginTop: '1rem' }}>
              <label>Mensagem do Aviso</label>
              <input
                type="text"
                placeholder="Ex: ✨ 50 Novas figurinhas de Casamento adicionadas hoje!"
                value={announcement.text}
                onChange={(e) => setAnnouncement(prev => ({ ...prev, text: e.target.value }))}
                required={announcement.active}
              />
            </div>

            <div className="admin-field-group">
              <label>Tipo do Aviso</label>
              <select
                value={announcement.type || 'novidade'}
                onChange={(e) => setAnnouncement(prev => ({ ...prev, type: e.target.value }))}
                className="admin-select"
              >
                <option value="novidade">Novidade & Lançamento (Destaque Rosé)</option>
                <option value="alerta">Aviso Importante / Comunicado (Dourado)</option>
              </select>
            </div>

            <button type="submit" className="admin-submit-btn" style={{ marginTop: '0.5rem' }}>
              Salvar e Publicar Aviso
            </button>
          </form>

          {/* Lista de Sugestões Enviadas pelos Clientes */}
          <div className="admin-gallery-card">
            <h3 className="admin-section-heading">
              Sugestões e Pedidos dos Clientes ({userSuggestionsList.length})
            </h3>
            
            {userSuggestionsList.length === 0 ? (
              <p style={{ color: '#A0909C', textAlign: 'center', fontSize: '0.88rem' }}>
                Nenhuma sugestão enviada por clientes até o momento.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {userSuggestionsList.map((sug) => (
                  <div
                    key={sug.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(234,161,172,0.2)',
                      borderRadius: '14px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#EAA1AC', background: 'rgba(234,161,172,0.15)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                        {sug.type || 'Geral'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#A0909C' }}>
                        {sug.created_at ? new Date(sug.created_at).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>

                    <p style={{ color: '#FFF', fontSize: '0.9rem', margin: '0.3rem 0', lineHeight: 1.4 }}>
                      "{sug.suggestion_text || sug.message}"
                    </p>

                    <div style={{ fontSize: '0.75rem', color: '#A0909C' }}>
                      Por: {sug.user_name || 'Anônimo'} {sug.user_email ? `(${sug.user_email})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Modal Flutuante de Edição do Nicho */}
      {editingNiche && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={handleCloseEditNiche}
        >
          <div 
            style={{
              background: '#1F151E',
              border: '1px solid rgba(234,161,172,0.3)',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFF' }}>Editar Nicho</h3>
              <button 
                type="button" 
                onClick={handleCloseEditNiche}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A0909C',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditNicheSubmit}>
              {/* Campo: Nome do Nicho */}
              <div className="admin-field-group" style={{ marginBottom: '1rem' }}>
                <label>Nome do Nicho</label>
                <input
                  type="text"
                  value={editNicheTitle}
                  onChange={(e) => setEditNicheTitle(e.target.value)}
                  required
                />
              </div>

              {/* Campo: Nova Imagem de Capa do Nicho */}
              <div className="admin-field-group" style={{ marginBottom: '1.2rem' }}>
                <label>Alterar Capa Principal</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditNicheCoverFile(file);
                      setEditNichePreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                {editNichePreviewUrl && (
                  <div style={{ marginTop: '0.75rem', maxWidth: '140px', borderRadius: '12px', overflow: 'hidden' }}>
                    <img src={editNichePreviewUrl} alt="Preview da Capa" style={{ width: '100%', display: 'block' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseEditNiche}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="admin-submit-btn"
                  style={{ flex: 1, margin: 0 }}
                >
                  {isUploading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
