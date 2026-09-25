import { supabase } from './supabaseClient';

// Serviço de Gerenciamento de Capas Customizadas das Subcategorias
// Permite que o Administrador Supremo faça upload e altere as capas diretamente pela Home

const LOCAL_COVERS_KEY = 'lumi_custom_category_covers';

// Obtém o mapa de capas customizadas salvas (localStorage + Supabase se disponível)
// @returns {Object} Mapa de id/slug do card para URL da capa
export function getCustomCovers() {
  try {
    const saved = localStorage.getItem(LOCAL_COVERS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (err) {
    console.error('Erro ao ler capas customizadas:', err);
    return {};
  }
}

// Salva uma nova imagem de capa para um card específico
// @param {string|number} cardId - Identificador único do card
// @param {File|string} fileOrUrl - Arquivo da imagem selecionada ou URL pública
// @returns {Promise<string>} URL final da capa
export async function updateCategoryCover(cardId, fileOrUrl) {
  let finalUrl = '';

  if (typeof fileOrUrl === 'string') {
    finalUrl = fileOrUrl;
  } else if (fileOrUrl instanceof File) {
    try {
      // Tenta upload para o bucket 'stickers' no Supabase
      const fileExt = fileOrUrl.name.split('.').pop() || 'png';
      const fileName = `covers/cover_${cardId}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('stickers')
        .upload(fileName, fileOrUrl, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('stickers')
          .getPublicUrl(fileName);
        finalUrl = publicData.publicUrl;
      } else {
        // Fallback: Converte para Base64 local se Storage estiver offline
        finalUrl = await fileToBase64(fileOrUrl);
      }
    } catch (err) {
      console.warn('Fallback para Base64:', err);
      finalUrl = await fileToBase64(fileOrUrl);
    }
  }

  // Persiste no storage local para exibição instantânea
  const currentCovers = getCustomCovers();
  currentCovers[cardId] = finalUrl;
  localStorage.setItem(LOCAL_COVERS_KEY, JSON.stringify(currentCovers));

  return finalUrl;
}

// Utilitário para converter File em string Data URL Base64
// @param {File} file
// @returns {Promise<string>}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
