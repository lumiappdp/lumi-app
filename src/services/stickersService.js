import { supabase } from './supabaseClient';

// Serviço de Gestão de Figurinhas e Categorias com Supabase
// Fornece funções para buscar figurinhas, filtrar por categorias, buscar termos e realizar uploads no Storage

// Busca todas as categorias ativas
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Busca figurinhas por categoria ou filtros especiais
// @param {Object} options
// @param {string} options.categorySlug - Slug da categoria (ex: 'frases', 'elementos')
// @param {boolean} options.isTrending - Se busca apenas em alta
// @param {boolean} options.isPopular - Se busca apenas mais usados
// @param {string} options.searchQuery - Termo de busca por título ou tags
export async function getStickers({ categorySlug, isTrending, isPopular, searchQuery } = {}) {
  let query = supabase.from('stickers').select('*');

  if (categorySlug) {
    query = query.eq('category_slug', categorySlug);
  }

  if (isTrending) {
    query = query.eq('is_trending', true);
  }

  if (isPopular) {
    query = query.eq('is_popular', true);
  }

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Converte File em string Data URL Base64 para garantir upload mesmo com oscilações no Storage
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Faz upload de uma nova imagem de figurinha com resiliência total e fallback automático
// @param {Object} params
// @param {File} params.file - Arquivo de imagem (PNG transparente)
// @param {string} params.title - Nome da figurinha
// @param {string} params.categorySlug - Categoria pertencente
// @param {Array<string>} params.tags - Palavras-chave
// @param {string} params.type - 'phrase', 'element' ou 'sticker'
export async function uploadSticker({ file, title, categorySlug, tags = [], type = 'sticker' }) {
  let publicUrl = '';

  try {
    // 1. Gera um nome de arquivo único
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${categorySlug || 'geral'}/${fileName}`;

    // 2. Tenta upload para o Storage do Supabase no bucket 'stickers'
    const { error: uploadError } = await supabase.storage
      .from('stickers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!uploadError) {
      const { data: { publicUrl: url } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);
      publicUrl = url;
    } else {
      console.warn('Fallback para Base64 devido a StorageError:', uploadError);
      publicUrl = await fileToBase64(file);
    }
  } catch (err) {
    console.warn('Erro na conexão com Storage, aplicando fallback Base64:', err);
    publicUrl = await fileToBase64(file);
  }

  // 3. Garante que a categoria selecionada exista na tabela 'categories' (evita erro de foreign key)
  const safeCategorySlug = categorySlug || 'geral';
  try {
    const { data: catExists } = await supabase
      .from('categories')
      .select('slug')
      .eq('slug', safeCategorySlug)
      .maybeSingle();

    if (!catExists) {
      // Cria a categoria automaticamente no banco se for um nicho novo
      const categoryTitle = safeCategorySlug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      await supabase.from('categories').insert({
        slug: safeCategorySlug,
        title: categoryTitle,
      });
    }
  } catch (catErr) {
    console.warn('Verificação de categoria:', catErr);
  }

  // 4. Salva o registro na tabela 'stickers'
  const { data, error: dbError } = await supabase
    .from('stickers')
    .insert([
      {
        title,
        image_url: publicUrl,
        category_slug: safeCategorySlug,
        tags,
        type,
      },
    ])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
}
