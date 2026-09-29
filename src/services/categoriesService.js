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
  const localSections = getAllSections();
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Mapeia categorias do Supabase garantindo a integridade dos subcards para todos os dispositivos
      const mapped = data.map(cat => {
        let parsedCards = [];
        
        // 1. Tenta carregar subcards do próprio registro do Supabase
        if (Array.isArray(cat.cards) && cat.cards.length > 0) {
          parsedCards = cat.cards;
        } else if (typeof cat.cards === 'string') {
          try {
            const parsed = JSON.parse(cat.cards);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsedCards = parsed;
            }
          } catch {
            parsedCards = [];
          }
        }

        // 2. Se não houver subcards no banco, busca no cache local se houver cards válidos
        const unifiedId = cat.slug || cat.id;
        const normalizedTitle = (cat.name || cat.title || '').trim().toLowerCase();

        if (parsedCards.length === 0) {
          const localMatch = localSections.find(s => 
            String(s.id).toLowerCase() === String(unifiedId).toLowerCase() || 
            (s.slug && String(s.slug).toLowerCase() === String(unifiedId).toLowerCase()) ||
            (s.title || '').trim().toLowerCase() === normalizedTitle
          );
          if (localMatch && Array.isArray(localMatch.cards) && localMatch.cards.length > 0) {
            parsedCards = localMatch.cards;
          }
        }

        // 3. Se ainda assim estiver vazio, cria o subcard padrão obrigatório usando a capa da categoria
        if (parsedCards.length === 0) {
          const coverImage = cat.cover_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80';
          parsedCards = [{
            id: `card-${unifiedId}`,
            overlayText: cat.title || cat.name || 'Geral',
            tagLabel: cat.title || cat.name || 'Geral',
            bgImage: coverImage
          }];
        }

        return {
          id: unifiedId,
          slug: unifiedId,
          title: cat.name || cat.title || 'Categoria',
          cards: parsedCards
        };
      });

      // Deduplicação estrita: remove qualquer repetição de ID ou Título
      const uniqueSections = [];
      const seenKeys = new Set();

      mapped.forEach(item => {
        const idKey = String(item.id || item.slug).trim().toLowerCase();
        const titleKey = String(item.title || '').trim().toLowerCase();
        const combinedKey = `${idKey}::${titleKey}`;

        if (!seenKeys.has(combinedKey) && !seenKeys.has(titleKey)) {
          seenKeys.add(combinedKey);
          seenKeys.add(titleKey);
          uniqueSections.push(item);
        }
      });

      // Sincroniza com o cache local para carregar instantaneamente nas próximas aberturas
      saveAllSections(uniqueSections);
      return uniqueSections;
    }
  } catch (err) {
    console.log('Utilizando cache local de seções:', err);
  }
  return localSections;
}

// Salva a lista completa de seções
export function saveAllSections(sections) {
  try {
    // Garante que não sejam salvas seções duplicadas no cache local
    const unique = [];
    const seen = new Set();
    (Array.isArray(sections) ? sections : []).forEach(sec => {
      const key = (sec.title || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(sec);
      }
    });
    localStorage.setItem(LOCAL_SECTIONS_KEY, JSON.stringify(unique));
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
  const alreadyExists = currentSections.some(s => 
    String(s.id).toLowerCase() === slug.toLowerCase() || 
    (s.title && s.title.trim().toLowerCase() === cleanTitle.toLowerCase())
  );
  if (alreadyExists) {
    throw new Error('Já existe um nicho com este nome.');
  }

  const newSection = {
    id: slug,
    slug: slug,
    title: cleanTitle,
    cards: [],
  };

  const updatedSections = [...currentSections, newSection];
  saveAllSections(updatedSections);

  // Sincroniza com o Supabase para que todos os celulares recebam
  try {
    const { error: upsertError } = await supabase.from('categories').upsert({
      slug: slug,
      title: cleanTitle,
      display_order: updatedSections.length,
    }, { onConflict: 'slug' });

    if (upsertError) {
      console.error('Erro ao salvar categoria no Supabase:', upsertError);
    }
  } catch (err) {
    console.warn('Erro na requisição ao Supabase:', err);
  }

  return newSection;
}

// Exclui um nicho inteiro no banco e localmente
// @param {string} sectionId - Identificador único ou slug da seção
// @returns {Promise<Array>} Lista atualizada de seções
export async function deleteNicheSection(sectionId) {
  // Atualiza imediatamente o cache local para resposta instantânea na interface
  const currentSections = getAllSections();
  const filtered = currentSections.filter(s => s.id !== sectionId);
  saveAllSections(filtered);

  try {
    // Regex para validar se o identificador recebido é um formato UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sectionId);

    if (isUuid) {
      // Se for UUID, deleta diretamente pelo campo ID
      await supabase
        .from('categories')
        .delete()
        .eq('id', sectionId);
    } else {
      // Caso contrário, deleta pelo slug da categoria
      await supabase
        .from('categories')
        .delete()
        .eq('slug', sectionId);
    }
  } catch (err) {
    // Registra aviso caso haja falha de conexão com o Supabase
    console.warn('Erro ao excluir categoria do Supabase:', err);
  }

  return filtered;
}

// Atualiza as informações de um nicho / categoria (título e imagem de capa)
// @param {string} sectionId - ID ou Slug da seção a ser editada
// @param {Object} data - Objeto contendo { title, coverFileOrUrl }
// @returns {Promise<Array>} Lista atualizada de seções
export async function updateNicheSection(sectionId, { title, coverFileOrUrl }) {
  const currentSections = getAllSections();
  let newCoverUrl = null;

  // Realiza upload da nova imagem para o Supabase Storage se for um arquivo File
  if (coverFileOrUrl instanceof File) {
    try {
      const fileExt = coverFileOrUrl.name.split('.').pop() || 'png';
      const fileName = `covers/niche_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('stickers')
        .upload(fileName, coverFileOrUrl, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: pub } = supabase.storage.from('stickers').getPublicUrl(fileName);
        newCoverUrl = pub.publicUrl;
      }
    } catch (uploadErr) {
      console.warn('Erro ao enviar capa do nicho:', uploadErr);
    }
  } else if (typeof coverFileOrUrl === 'string' && coverFileOrUrl) {
    newCoverUrl = coverFileOrUrl;
  }

  // Atualiza no cache local
  const updatedSections = currentSections.map(sec => {
    if (sec.id === sectionId) {
      const updatedCards = [...(sec.cards || [])];
      if (newCoverUrl) {
        if (updatedCards.length > 0) {
          updatedCards[0] = { ...updatedCards[0], bgImage: newCoverUrl };
        } else {
          updatedCards.push({
            id: `card-${Date.now()}`,
            overlayText: title || sec.title,
            tagLabel: title || sec.title,
            bgImage: newCoverUrl
          });
        }
      }
      return {
        ...sec,
        title: title ? title.trim() : sec.title,
        cards: updatedCards,
      };
    }
    return sec;
  });

  saveAllSections(updatedSections);

  // Sincroniza atualização na tabela categories do Supabase
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sectionId);
    const updatePayload = {};
    if (title) updatePayload.title = title.trim();
    if (newCoverUrl) updatePayload.cover_url = newCoverUrl;

    if (Object.keys(updatePayload).length > 0) {
      if (isUuid) {
        await supabase.from('categories').update(updatePayload).eq('id', sectionId);
      } else {
        await supabase.from('categories').update(updatePayload).eq('slug', sectionId);
      }
    }
  } catch (err) {
    console.warn('Erro ao atualizar categoria no Supabase:', err);
  }

  return updatedSections;
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
        const fileExt = fileOrUrl.name.split('.').pop()?.toLowerCase() || 'png';
        const cleanFileName = `covers/subcard_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('stickers')
          .upload(cleanFileName, fileOrUrl, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: pub } = supabase.storage.from('stickers').getPublicUrl(cleanFileName);
          finalBg = pub.publicUrl;
        } else {
          finalBg = await fileToBase64(fileOrUrl);
        }
      } catch {
        finalBg = await fileToBase64(fileOrUrl);
      }
    }
  }

  // Novo subcard com frase no centro e etiqueta específica no rodapé
  const newCard = {
    id: `card-${Date.now()}`,
    overlayText: overlayText.trim(),
    tagLabel: (tagLabel || '').trim(),
    bgImage: finalBg,
  };

  const currentSections = getAllSections();
  const updatedSections = currentSections.map(sec => {
    const isTarget = String(sec.id) === String(sectionId) || 
                     (sec.slug && String(sec.slug) === String(sectionId));
    if (isTarget) {
      return {
        ...sec,
        cards: [...(sec.cards || []), newCard],
      };
    }
    return sec;
  });

  // Salva no armazenamento local primeiro (garantia de funcionamento imediato na interface)
  saveAllSections(updatedSections);

  // Sincroniza a capa da categoria e a lista de subcards no Supabase
  try {
    const targetSec = updatedSections.find(s => 
      String(s.id) === String(sectionId) || (s.slug && String(s.slug) === String(sectionId))
    );

    if (targetSec) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSec.id);
      
      const payload = {
        title: targetSec.title,
        cover_url: targetSec.cards[0]?.bgImage || null,
        cards: targetSec.cards || []
      };

      // Tenta atualizar registro existente
      let updateQuery = supabase.from('categories').update(payload);
      if (isUuid) {
        updateQuery = updateQuery.eq('id', targetSec.id);
      } else {
        updateQuery = updateQuery.eq('slug', targetSec.id);
      }
      
      const { error: updateErr } = await updateQuery;

      if (updateErr) {
        await supabase.from('categories').upsert({
          slug: targetSec.id,
          title: targetSec.title,
          cover_url: targetSec.cards[0]?.bgImage || null,
          cards: targetSec.cards || []
        }, { onConflict: 'slug' });
      }
    }
  } catch (err) {
    console.warn('Sincronização de categoria com Supabase:', err);
  }

  return newCard;
}

// Exclui um subcard de uma seção no banco e localmente
export async function deleteSubcardFromSection(sectionId, cardId) {
  const currentSections = getAllSections();
  const updatedSections = currentSections.map(sec => {
    const isTarget = String(sec.id) === String(sectionId) || 
                     (sec.slug && String(sec.slug) === String(sectionId));
    if (isTarget) {
      return {
        ...sec,
        cards: (sec.cards || []).filter(c => String(c.id) !== String(cardId)),
      };
    }
    return sec;
  });

  saveAllSections(updatedSections);

  try {
    const targetSec = updatedSections.find(s => 
      String(s.id) === String(sectionId) || (s.slug && String(s.slug) === String(sectionId))
    );
    if (targetSec) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSec.id);
      const payload = {
        cover_url: targetSec.cards[0]?.bgImage || null
      };
      if (isUuid) {
        await supabase.from('categories').update(payload).eq('id', targetSec.id);
      } else {
        await supabase.from('categories').update(payload).eq('slug', targetSec.id);
      }
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

// Obtém as capas salvas diretamente na tabela 'categories' do Supabase
export async function getCustomCoversFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('slug, cover_url');

    if (error || !data || data.length === 0) {
      return getCustomCovers();
    }

    const coversMap = {};
    data.forEach((item) => {
      if (item.slug && item.cover_url) {
        coversMap[item.slug] = item.cover_url;
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

// Salva uma nova imagem de capa para um card/categoria no Storage e no Banco de Dados
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

  // 2. Sincroniza diretamente na tabela 'categories'
  try {
    await supabase
      .from('categories')
      .update({ cover_url: finalUrl })
      .eq('slug', String(cardId));
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
