// ==================================================
// SERVIÇO DE FAVORITOS - LUMI APP
// Gerencia a persistência local e reatividade dos stickers favoritos
// ==================================================

const FAVORITES_STORAGE_KEY = 'lumi-favorites';

export const favoritesService = {
  /**
   * Obtém a lista atual de stickers favoritados salvos localmente
   * @returns {Array<Object>} Lista de stickers favoritos
   */
  getFavorites() {
    try {
      const data = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Erro ao ler favoritos do localStorage:', error);
      return [];
    }
  },

  /**
   * Alterna o estado de favorito de um sticker (adiciona se não existir, remove se já existir)
   * @param {Object} sticker - Objeto contendo os dados do sticker
   * @returns {Array<Object>} Lista atualizada de favoritos
   */
  toggleFavorite(sticker) {
    try {
      const list = this.getFavorites();
      const exists = list.some((item) => item.id === sticker.id);
      let updated;

      if (exists) {
        updated = list.filter((item) => item.id !== sticker.id);
      } else {
        updated = [...list, sticker];
      }

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.warn('Erro ao atualizar favoritos:', error);
      return this.getFavorites();
    }
  },

  /**
   * Verifica se determinado sticker está favoritado
   * @param {number|string} stickerId - Identificador do sticker
   * @returns {boolean}
   */
  isFavorite(stickerId) {
    const list = this.getFavorites();
    return list.some((item) => item.id === stickerId);
  },
};

export default favoritesService;
