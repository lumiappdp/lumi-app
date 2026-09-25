// ==================================================
// SERVIÇO DE CONTAGEM DE USO DE STICKERS - LUMI APP
// Gerencia a contabilização de cliques/cópias reais de cada figurinha
// para ordenar e alimentar dinamicamente a aba "Mais usados"
// ==================================================

const USAGE_KEY = 'lumi-stickers-usage-stats';

export const usageService = {
  // Retorna o mapa de frequência de cópia de todas as figurinhas { [stickerId]: totalCliques }
  // @returns {Object} Mapa de contagem de cliques
  getUsageCounts() {
    try {
      const data = localStorage.getItem(USAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  // Incrementa em +1 a contagem de uso de um sticker específico ao ser copiado
  // @param {Object} sticker - Objeto contendo os dados do sticker copiado
  // @returns {Object} Mapa de contagens atualizado
  recordUsage(sticker) {
    if (!sticker || !sticker.id) return this.getUsageCounts();

    try {
      const counts = this.getUsageCounts();
      counts[sticker.id] = (counts[sticker.id] || 0) + 1;
      localStorage.setItem(USAGE_KEY, JSON.stringify(counts));
      return counts;
    } catch (err) {
      console.error('Erro ao registrar uso de sticker:', err);
      return {};
    }
  },

  // Obtém o total de vezes que uma figurinha específica foi copiada
  // @param {string} stickerId - Identificador único da figurinha
  // @returns {number} Quantidade total de cópias
  getCount(stickerId) {
    if (!stickerId) return 0;
    const counts = this.getUsageCounts();
    return counts[stickerId] || 0;
  },
};

export default usageService;
