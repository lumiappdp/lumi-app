// ==================================================
// SERVIÇO DE CLIPBOARD - LUMI APP
// Responsável pela abstração de cópia de imagens binárias (PNG transparente)
// para a área de transferência do sistema (Android, iOS e Web).
// ==================================================

/**
 * Converte um elemento SVG ou Canvas para Blob PNG com canal alpha (transparência preservada)
 * @param {HTMLElement} element - Elemento DOM do sticker a ser rasterizado
 * @returns {Promise<Blob>}
 */
async function rasterizeElementToPngBlob(element) {
  return new Promise((resolve, reject) => {
    try {
      const width = element.offsetWidth || 300;
      const height = element.offsetHeight || 300;

      // Cria canvas transparente
      const canvas = document.createElement('canvas');
      const scale = window.devicePixelRatio || 2;
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // Constrói SVG com conteúdo HTML encapsulado em foreignObject
      const htmlContent = element.outerHTML;
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:transparent;color:#FFFFFF;">
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Falha ao gerar o Blob da imagem.'));
          }
        }, 'image/png');
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Faz download de uma imagem remota via URL e retorna seu Blob PNG
 * @param {string} url - URL remota da imagem
 * @returns {Promise<Blob>}
 */
async function fetchImageBlob(url) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Falha no download da imagem: status ${response.status}`);
  }
  const rawBlob = await response.blob();
  
  // Garante que o retorno seja explicitamente image/png
  if (rawBlob.type === 'image/png') {
    return rawBlob;
  }

  // Se necessário, converte para PNG transparente
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const objectUrl = URL.createObjectURL(rawBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Falha na conversão para PNG.'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

export const clipboardService = {
  /**
   * Copia a imagem real do sticker para a área de transferência do sistema
   * @param {Object} sticker - Dados do sticker
   * @param {string} [sticker.imageUrl] - URL da imagem transparente (quando hospedada)
   * @param {HTMLElement} [sticker.domElement] - Elemento do sticker renderizado na tela
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async copyStickerImage(sticker) {
    try {
      // 0. Trava de Segurança Antifraude: Bloqueia cópia se não houver usuário logado
      const loggedEmail = localStorage.getItem('lumi-user-email');
      if (!loggedEmail) {
        return {
          success: false,
          message: 'Faça login para copiar figurinhas.',
        };
      }

      let imageBlob = null;

      // 1. Obter o blob PNG com transparência
      if (sticker.imageUrl) {
        imageBlob = await fetchImageBlob(sticker.imageUrl);
      } else if (sticker.domElement) {
        imageBlob = await rasterizeElementToPngBlob(sticker.domElement);
      } else {
        // Fallback para elemento genérico se disponível
        throw new Error('Nenhuma fonte de imagem ou elemento fornecido.');
      }

      // 2. Validação da Clipboard API do sistema
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('ClipboardItem de imagem não é suportado neste navegador/ambiente.');
      }

      // 3. Escrever o Blob binário PNG transparente na área de transferência
      const clipboardItem = new ClipboardItem({
        'image/png': imageBlob,
      });

      await navigator.clipboard.write([clipboardItem]);

      return {
        success: true,
        message: 'Sticker copiado!',
      };
    } catch (error) {
      console.warn('Aviso no clipboardService:', error);
      return {
        success: false,
        message: 'Não foi possível copiar o sticker. Tente novamente.',
      };
    }
  },
};

export default clipboardService;
