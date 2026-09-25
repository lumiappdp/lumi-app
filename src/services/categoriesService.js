import { supabase } from './supabaseClient';

// ==================================================
// SERVIÇO DE NICHOS, SEÇÕES E SUBCARDS - LUMI APP
// Permite que o Administrador Supremo crie novos nichos, adicione subcards com capas personalizadas
// e sincronize tudo dinamicamente com a Home e o banco de dados
// ==================================================

const LOCAL_COVERS_KEY = 'lumi_custom_category_covers';
const LOCAL_SECTIONS_KEY = 'lumi_custom_sections_data';

// Estrutura padrão inicial de seções do Lumi App
export const DEFAULT_SECTIONS = [
  {
    id: 'universais',
    title: 'Universais',
    cards: [
      {
        id: 1,
        overlayText: 'bolinho saudável',
        tagLabel: 'Bebida | Comida',
        bgImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 2,
        overlayText: 'Feliz dia',
        tagLabel: 'Bom dia | Boa tarde | Boa noite',
        bgImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'profissoes',
    title: 'Profissões',
    cards: [
      {
        id: 3,
        overlayText: 'a defesa vem forte.',
        tagLabel: '',
        bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 4,
        overlayText: 'achei na shô.',
        tagLabel: '',
        bgImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'lojas-comercios',
    title: 'Lojas | Comércios',
    cards: [
      {
        id: 5,
        overlayText: 'nova coleção',
        tagLabel: 'Moda | Vitrine',
        bgImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 6,
        overlayText: 'detalhes que encantam',
        tagLabel: 'Espaço | Produtos',
        bgImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'datas-comemorativas',
    title: 'Datas comemorativas',
    cards: [
      {
        id: 7,
        overlayText: 'momentos especiais',
        tagLabel: 'Celebrações',
        bgImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 8,
        overlayText: 'celebre cada conquista',
        tagLabel: 'Especial',
        bgImage: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'repost',
    title: 'Repost',
    cards: [
      {
        id: 9,
        overlayText: 'nosso dia a dia',
        tagLabel: 'Bastidores',
        bgImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 10,
        overlayText: 'feito com carinho',
        tagLabel: 'Comunidade',
        bgImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'minimalistas',
    title: 'Minimalistas',
    cards: [
      {
        id: 11,
        overlayText: 'simplicidade & essência',
        tagLabel: 'Clean',
        bgImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 12,
        overlayText: 'menos é mais',
        tagLabel: 'Conceito',
        bgImage: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
];

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

// Salva a lista completa de seções
export function saveAllSections(sections) {
  try {
    localStorage.setItem(LOCAL_SECTIONS_KEY, JSON.stringify(sections));
  } catch (err) {
    console.error('Erro ao salvar seções:', err);
  }
}

// Cria um novo nicho / categoria principal
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
  return newSection;
}

// Exclui um nicho inteiro
export function deleteNicheSection(sectionId) {
  const currentSections = getAllSections();
  const filtered = currentSections.filter(s => s.id !== sectionId);
  saveAllSections(filtered);
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
  return newCard;
}

// Exclui um subcard de uma seção
export function deleteSubcardFromSection(sectionId, cardId) {
  const currentSections = getAllSections();
  const updatedSections = currentSections.map(sec => {
    if (sec.id === sectionId) {
      return {
        ...sec,
        cards: sec.cards.filter(c => String(c.id) !== String(cardId)),
      };
    }
    return sec;
  });

  saveAllSections(updatedSections);
  return updatedSections;
}

// Obtém o mapa de capas customizadas salvas
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

  const currentCovers = getCustomCovers();
  currentCovers[cardId] = finalUrl;
  localStorage.setItem(LOCAL_COVERS_KEY, JSON.stringify(currentCovers));
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
