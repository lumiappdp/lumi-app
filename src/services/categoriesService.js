import { supabase } from './supabaseClient';

// ==================================================
// SERVIÇO DE NICHOS, SEÇÕES E SUBCARDS - LUMI APP
// Permite que o Administrador Supremo crie novos nichos, adicione subcards com capas personalizadas
// e sincronize tudo dinamicamente com a Home e o banco de dados
// ==================================================

const LOCAL_COVERS_KEY = 'lumi_custom_category_covers';
const LOCAL_SECTIONS_KEY = 'lumi_custom_sections_data';

// Estrutura padrão inicial de seções do Lumi App (inicialmente vazia para criação pelo Administrador)
export const DEFAULT_SECTIONS = [];


// Obtém todas as seções/nichos (padrões mescladas com personalizadas)
export function getAllSections() {
  try {
    const saved = localStorage.getItem(LOCAL_SECTIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler seções customizadas:', err);
  }
  return DEFAULT_SECTIONS;
}

// Obtém as seções e subcards sincronizados diretamente do Supabase
export async function getSectionsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      // Mapeia categorias do Supabase em estrutura de seções
      const mapped = data.map(cat => ({
        id: cat.slug || cat.id,
        title: cat.name || cat.title,
        cards: Array.isArray(cat.cards) ? cat.cards : (cat.cover_url ? [{
          id: `card-${cat.id}`,
          overlayText: cat.name || cat.title,
          tagLabel: cat.name || cat.title,
          bgImage: cat.cover_url
        }] : [])
      }));

      // Se encontrou dados válidos no Supabase, salva no cache
      if (mapped.length > 0) {
        saveAllSections(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.log('Utilizando cache local de seções:', err);
  }
  return getAllSections();
}

// Salva a lista completa de seções
export function saveAllSections(sections) {
  try {
    localStorage.setItem(LOCAL_SECTIONS_KEY, JSON.stringify(sections));
  } catch (err) {
    console.error('Erro ao salvar seções:', err);
  }
}

// Cria um novo nicho / categoria principal e sincroniza com o Supabase
// @param {string} title - Nome do nicho (ex: "Maternidade")
// @returns {Object} Novo objeto de seção
export async function createNicheSection(title) {
  if (!title || !title.trim()) throw new Error('Nome do nicho é obrigatório.');

  const cleanTitle = title.trim();
  const slug = cleanTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-');

  const currentSections = getAllSections();
  const alreadyExists = currentSections.some(s => s.id === slug || s.title.toLowerCase() === cleanTitle.toLowerCase());
  if (alreadyExists) {
    throw new Error('Já existe um nicho com este nome.');
  }

  const newSection = {
    id: slug,
    title: cleanTitle,
    cards: [],
  };

  const updatedSections = [...currentSections, newSection];
  saveAllSections(updatedSections);

  // Sincroniza com o Supabase para que todos os celulares recebam
  try {
    await supabase.from('categories').upsert({
      slug: slug,
      name: cleanTitle,
      display_order: updatedSections.length,
      cards: []
    }, { onConflict: 'slug' });
  } catch (err) {
    console.warn('Erro ao salvar categoria no Supabase:', err);
  }

  return newSection;
}

// Exclui um nicho inteiro no banco e localmente
export async function deleteNicheSection(sectionId) {
  const currentSections = getAllSections();
  const filtered = currentSections.filter(s => s.id !== sectionId);
  saveAllSections(filtered);

  try {
    // Tenta deletar por slug ou por id no Supabase
    await supabase
      .from('categories')
      .delete()
      .or(`slug.eq.${sectionId},id.eq.${sectionId}`);
  } catch (err) {
    console.warn('Erro ao excluir categoria do Supabase:', err);
  }

  return filtered;
}

// Adiciona um novo subcard dentro de um nicho específico
// @param {string} sectionId - ID do nicho pai
// @param {Object} cardData - { overlayText, tagLabel, fileOrUrl }
export async function addSubcardToSection(sectionId, { overlayText, tagLabel, fileOrUrl }) {
  if (!overlayText || !overlayText.trim()) throw new Error('Texto do card é obrigatório.');

  let finalBg = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80';

  if (fileOrUrl) {
    if (typeof fileOrUrl === 'string') {
      finalBg = fileOrUrl;
    } else if (fileOrUrl instanceof File) {
      try {
        const fileExt = fileOrUrl.name.split('.').pop() || 'png';
        const fileName = `covers/subcard_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('stickers')
          .upload(fileName, fileOrUrl, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: pub } = supabase.storage.from('stickers').getPublicUrl(fileName);
          finalBg = pub.publicUrl;
        } else {
          finalBg = await fileToBase64(fileOrUrl);
        }
      } catch {
        finalBg = await fileToBase64(fileOrUrl);
      }
    }
  }

  const newCard = {
    id: `card-${Date.now()}`,
    overlayText: overlayText.trim(),
    tagLabel: (tagLabel || '').trim(),
    bgImage: finalBg,
  };

  const currentSections = getAllSections();
  const updatedSections = currentSections.map(sec => {
    if (sec.id === sectionId) {
      return {
        ...sec,
        cards: [...(sec.cards || []), newCard],
      };
    }
    return sec;
  });

  saveAllSections(updatedSections);

  // Sincroniza os subcards no Supabase
  try {
    const targetSec = updatedSections.find(s => s.id === sectionId);
    if (targetSec) {
      await supabase.from('categories').upsert({
        slug: targetSec.id,
        name: targetSec.title,
        cards: targetSec.cards,
        cover_url: targetSec.cards[0]?.bgImage || null
      }, { onConflict: 'slug' });
    }
  } catch (err) {
    console.warn('Erro ao atualizar cards no Supabase:', err);
  }

  return newCard;
}

// Exclui um subcard de uma seção no banco e localmente
export async function deleteSubcardFromSection(sectionId, cardId) {
  const currentSections = getAllSections();
  const updatedSections = currentSections.map(sec => {
    if (sec.id === sectionId) {
      return {
        ...sec,
        cards: (sec.cards || []).filter(c => String(c.id) !== String(cardId)),
      };
    }
    return sec;
  });

  saveAllSections(updatedSections);

  try {
    const targetSec = updatedSections.find(s => s.id === sectionId);
    if (targetSec) {
      await supabase.from('categories').upsert({
        slug: targetSec.id,
        name: targetSec.title,
        cards: targetSec.cards,
        cover_url: targetSec.cards[0]?.bgImage || null
      }, { onConflict: 'slug' });
    }
  } catch (err) {
    console.warn('Erro ao atualizar subcards no Supabase após remoção:', err);
  }

  return updatedSections;
}

// Obtém o mapa de capas customizadas salvas localmente
export function getCustomCovers() {
  try {
    const saved = localStorage.getItem(LOCAL_COVERS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (err) {
    console.error('Erro ao ler capas customizadas:', err);
    return {};
  }
}

// Obtém as capas salvas diretamente no Supabase para sincronizar em tempo real com todos os celulares
export async function getCustomCoversFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('category_covers')
      .select('card_id, cover_url');

    if (error || !data || data.length === 0) {
      return getCustomCovers();
    }

    const coversMap = {};
    data.forEach((item) => {
      if (item.card_id && item.cover_url) {
        coversMap[item.card_id] = item.cover_url;
      }
    });

    // Atualiza cache local para carregamento instantâneo offline
    localStorage.setItem(LOCAL_COVERS_KEY, JSON.stringify(coversMap));
    return coversMap;
  } catch (err) {
    console.log('Utilizando cache local de capas:', err);
    return getCustomCovers();
  }
}

// Salva uma nova imagem de capa para um card específico no Storage e no Banco de Dados
export async function updateCategoryCover(cardId, fileOrUrl) {
  let finalUrl = '';

  if (typeof fileOrUrl === 'string') {
    finalUrl = fileOrUrl;
  } else if (fileOrUrl instanceof File) {
    try {
      const fileExt = fileOrUrl.name.split('.').pop() || 'png';
      const fileName = `covers/cover_${cardId}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('stickers')
        .upload(fileName, fileOrUrl, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('stickers')
          .getPublicUrl(fileName);
        finalUrl = publicData.publicUrl;
      } else {
        finalUrl = await fileToBase64(fileOrUrl);
      }
    } catch (err) {
      finalUrl = await fileToBase64(fileOrUrl);
    }
  }

  // 1. Atualiza cache local
  const currentCovers = getCustomCovers();
  currentCovers[cardId] = finalUrl;
  localStorage.setItem(LOCAL_COVERS_KEY, JSON.stringify(currentCovers));

  // 2. Sincroniza com o Supabase para que todos os celulares recebam a nova capa
  try {
    await supabase
      .from('category_covers')
      .upsert({
        card_id: String(cardId),
        cover_url: finalUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'card_id' });
  } catch (err) {
    console.error('Erro ao sincronizar capa no Supabase:', err);
  }

  return finalUrl;
}


// Utilitário para converter File em string Data URL Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
