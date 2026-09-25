// ==================================================
// SERVIÇO DE STICKERS RECENTES - LUMI APP
// Gerencia a persistência e ordenação cronológica das figurinhas copiadas
// para exibição na aba "Recentes" da Home
// ==================================================

const STORAGE_KEY = 'lumi-recent-stickers';

export const recentService = {
  // Retorna a lista de stickers recentes salvos no localStorage
  // @returns {Array<Object>} Lista de stickers recentes
  getRecents() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Adiciona ou reposiciona um sticker no topo do histórico de recentes
  // @param {Object} sticker - Dados do sticker copiado
  // @returns {Array<Object>} Lista atualizada
  addRecent(sticker) {
    if (!sticker || !sticker.id) return this.getRecents();

    try {
      const recents = this.getRecents();
      // Remove ocorrência anterior para evitar duplicação e mover para o topo
      const filtered = recents.filter((item) => item.id !== sticker.id);
      
      // Cria objeto limpo para armazenamento seguro no localStorage
      const recentItem = {
        id: sticker.id,
        prefix: sticker.prefix || '',
        mainText: sticker.mainText || '',
        suffix: sticker.suffix || '',
        label: sticker.label || '',
        styleVariant: sticker.styleVariant || '',
        isBottle: Boolean(sticker.isBottle),
        usedAt: new Date().toISOString(),
      };

      filtered.unshift(recentItem);

      // Limita o histórico aos 20 itens mais recentes
      const limited = filtered.slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      return limited;
    } catch (e) {
      console.error('Erro ao registrar sticker recente:', e);
      return [];
    }
  },
};

export default recentService;
