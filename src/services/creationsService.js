// ==================================================
// SERVIÇO DE MINHAS CRIAÇÕES - LUMI APP
// Gerencia a persistência e geração de imagens PNG transparentes
// criadas pelos usuários no canvas do Lumi App
// ==================================================

const STORAGE_KEY = 'lumi-my-creations';

// Gera o PNG transparente do elemento DOM via Canvas HTML5
// @param {HTMLElement} element - Elemento do canvas a ser rasterizado
// @returns {Promise<string>} Data URL em formato image/png
export async function generateTransparentPng(element) {
  return new Promise((resolve, reject) => {
    try {
      const width = element.offsetWidth || 320;
      const height = element.offsetHeight || 320;
      const scale = window.devicePixelRatio || 2;

      // Cria canvas transparente
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // SVG transparente encapsulando o conteúdo HTML
      const html = element.outerHTML;
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:transparent;">
              ${html}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        // Limpa o canvas para garantir transparência total
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        // Retorna a imagem em PNG Base64
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

export const creationsService = {
  // Retorna todas as criações salvas no localStorage
  // @returns {Array<Object>} Lista de criações
  getCreations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Salva uma nova figurinha na lista de criações do usuário
  // @param {Object} params - Parâmetros da criação
  // @param {HTMLElement} params.domElement - Elemento do canvas a ser salvo
  // @param {string} params.title - Título ou frase da figurinha
  // @returns {Promise<{ success: boolean, item?: Object, error?: any }>}
  async saveCreation({ domElement, title }) {
    try {
      const pngDataUrl = await generateTransparentPng(domElement);
      const creations = this.getCreations();

      const newCreation = {
        id: `creation_${Date.now()}`,
        title: title || 'Minha Figurinha',
        imageData: pngDataUrl,
        createdAt: new Date().toISOString(),
      };

      creations.unshift(newCreation);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));

      return { success: true, item: newCreation };
    } catch (err) {
      console.error('Erro ao salvar criação:', err);
      return { success: false, error: err };
    }
  },

  // Exclui uma criação por ID
  // @param {string} id - Identificador da criação
  removeCreation(id) {
    const creations = this.getCreations().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));
  },
};

export default creationsService;
