import { supabase } from './supabaseClient';

// ==================================================
// SERVIÇO DE MINHAS CRIAÇÕES & GALERIA DO USUÁRIO - LUMI APP
// Gerencia a persistência local (cache) e sincronização com a tabela user_gallery do Supabase
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

  // Sincroniza e busca as figurinhas do usuário salvas no Supabase
  // @param {string} userEmail - E-mail do usuário autenticado
  // @returns {Promise<Array<Object>>}
  async fetchUserGalleryFromCloud(userEmail) {
    if (!userEmail) return this.getCreations();
    try {
      const { data, error } = await supabase
        .from('user_gallery')
        .select('*')
        .eq('user_email', userEmail.trim().toLowerCase())
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cloudCreations = data.map(item => ({
          id: String(item.id),
          title: item.title,
          imageData: item.image_data,
          createdAt: item.created_at,
          isImported: true
        }));

        // Salva cópia em cache local
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudCreations));
        return cloudCreations;
      }
    } catch (err) {
      console.warn('Erro ao buscar galeria do Supabase:', err);
    }
    return this.getCreations();
  },

  // Salva uma nova figurinha na lista de criações do usuário e no Supabase
  // @param {Object} params - Parâmetros da criação
  // @param {HTMLElement} params.domElement - Elemento do canvas a ser salvo
  // @param {string} params.title - Título ou frase da figurinha
  // @returns {Promise<{ success: boolean, item?: Object, error?: any }>}
  async saveCreation({ domElement, title }) {
    try {
      const pngDataUrl = await generateTransparentPng(domElement);
      const creations = this.getCreations();
      const userEmail = localStorage.getItem('lumi-user-email') || '';

      const newCreation = {
        id: `creation_${Date.now()}`,
        title: title || 'Minha Figurinha',
        imageData: pngDataUrl,
        createdAt: new Date().toISOString(),
      };

      creations.unshift(newCreation);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));

      // Sincroniza em segundo plano no Supabase
      if (userEmail) {
        supabase
          .from('user_gallery')
          .insert([{
            user_email: userEmail.trim().toLowerCase(),
            title: newCreation.title,
            image_data: newCreation.imageData
          }])
          .then(({ error }) => {
            if (error) console.warn('Aviso ao sincronizar figurinha na nuvem:', error);
          });
      }

      return { success: true, item: newCreation };
    } catch (err) {
      console.error('Erro ao salvar criação:', err);
      return { success: false, error: err };
    }
  },

  // Exclui uma criação por ID (local e no Supabase)
  // @param {string} id - Identificador da criação
  async removeCreation(id) {
    const creations = this.getCreations().filter(c => String(c.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));

    try {
      await supabase
        .from('user_gallery')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Erro ao remover do Supabase:', err);
    }
  },

  // Importa uma figurinha transparente do rolo da câmera/galeria do usuário
  // @param {File} file - Arquivo de imagem selecionado pelo usuário
  // @param {string} [title] - Título opcional da figurinha
  // @returns {Promise<{ success: boolean, item?: Object, error?: any }>}
  async importUserSticker(file, title = 'Minha Figurinha Importada') {
    return new Promise((resolve) => {
      try {
        if (!file) {
          resolve({ success: false, error: 'Nenhum arquivo fornecido.' });
          return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          const imageData = e.target.result;
          const creations = this.getCreations();
          const userEmail = localStorage.getItem('lumi-user-email') || '';

          const newCreation = {
            id: `imported_${Date.now()}`,
            title: title || file.name.replace(/\.[^/.]+$/, "") || 'Figurinha Importada',
            imageData: imageData,
            createdAt: new Date().toISOString(),
            isImported: true
          };

          creations.unshift(newCreation);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));

          // Sincroniza em segundo plano no Supabase
          if (userEmail) {
            try {
              const { data, error } = await supabase
                .from('user_gallery')
                .insert([{
                  user_email: userEmail.trim().toLowerCase(),
                  title: newCreation.title,
                  image_data: newCreation.imageData
                }])
                .select();

              if (!error && data?.[0]?.id) {
                newCreation.id = String(data[0].id);
              }
            } catch (err) {
              console.warn('Aviso ao sincronizar upload com Supabase:', err);
            }
          }

          resolve({ success: true, item: newCreation });
        };

        reader.onerror = (err) => {
          resolve({ success: false, error: err });
        };

        reader.readAsDataURL(file);
      } catch (err) {
        resolve({ success: false, error: err });
      }
    });
  }
};

export default creationsService;
