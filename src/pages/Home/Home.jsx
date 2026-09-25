import { useState, useEffect, useRef } from 'react';
// Importação dos logotipos oficiais da Lumi para tema claro e escuro
import lumiLogoLight from '../../../identidade-visual/lumi-logo-ve.png';
import lumiLogoDark from '../../../identidade-visual/lumi-logo-ve.png';
import lumiHeartIcon from '../../../identidade-visual/9.png';
import { creationsService } from '../../services/creationsService';
import { clipboardService } from '../../services/clipboardService';
import { favoritesService } from '../../services/favoritesService';
import { recentService } from '../../services/recentService';
import { usageService } from '../../services/usageService';
import { getStickers } from '../../services/stickersService';
import { checkIsAdmin } from '../../services/authService';
import { getCustomCovers, updateCategoryCover } from '../../services/categoriesService';
import { InstallBanner } from '../../components/InstallBanner/InstallBanner';
import { LegalModal } from '../Legal/LegalModal';
import { LEGAL_DOCS } from '../Legal/legalContent';
import './Home.css';

// Componente da Página Inicial (Home / Dashboard) do Lumi App
// Apresenta categorias com scroll horizontal, feeds de conteúdo e navegação inferior
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo da aplicação ('light' ou 'dark')
// @param {Function} props.onNavigate - Callback para transicionar entre telas ('home' ou 'profile')
// @param {Function} props.onSelectCategory - Callback para navegar para a tela de detalhes de figurinhas
// @param {Function} props.onSelectSection - Callback para navegar para a tela de 'Todas as Subcategorias' de uma seção
export function Home({ theme = 'dark', onNavigate, onSelectCategory, onSelectSection }) {
  // Verifica se o usuário atual logado é o Administrador Supremo
  const currentUserEmail = localStorage.getItem('lumi-user-email') || '';
  const isAdmin = checkIsAdmin(currentUserEmail);

  // Estado para armazenar o mapa de capas personalizadas dos cards
  const [customCovers, setCustomCovers] = useState(() => getCustomCovers());
  // Referência do input de arquivo oculto para upload de capa pelo Admin
  const fileInputRef = useRef(null);
  // Estado para guardar qual ID de card está sendo editado no momento
  const [editingCardId, setEditingCardId] = useState(null);
  // Estado da aba de filtro selecionada no topo
  const [activeTab, setActiveTab] = useState('nichos');
  
  // Estado da barra de navegação inferior
  const [activeNav, setActiveNav] = useState('home');

  // Estado para o termo digitado na busca da página inicial
  const [searchTerm, setSearchTerm] = useState('');

  // Estado com as criações salvas pelo usuário
  const [myCreations, setMyCreations] = useState([]);
  // Estado com os stickers usados recentemente
  const [recentStickers, setRecentStickers] = useState([]);
  // Estado com mapa de contagem de cliques/usos para a aba Mais Usados
  const [usageCounts, setUsageCounts] = useState(() => usageService.getUsageCounts());
  const [toastMessage, setToastMessage] = useState('');
  // Estado para controlar abertura do modal com o tutorial de instalação
  const [activeInstallModal, setActiveInstallModal] = useState(null);
  // IDs favoritados para os stickers mais usados e recentes
  const [favoriteIds, setFavoriteIds] = useState([]);
  // Stickers dinâmicos carregados diretamente do banco Supabase
  const [databaseStickers, setDatabaseStickers] = useState([]);

  // Referência e estados para o arraste (drag / swipe) suave dos filtros horizontais
  const filtersScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const hasDragged = useRef(false);

  // Inicia o arraste com mouse
  const handleMouseDown = (e) => {
    if (!filtersScrollRef.current) return;
    setIsDragging(true);
    hasDragged.current = false;
    setStartX(e.pageX - filtersScrollRef.current.offsetLeft);
    setScrollLeftState(filtersScrollRef.current.scrollLeft);
  };

  // Finaliza o arraste com mouse
  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  // Movimenta o scroll conforme o arraste do mouse
  const handleMouseMove = (e) => {
    if (!isDragging || !filtersScrollRef.current) return;
    e.preventDefault();
    hasDragged.current = true;
    const x = e.pageX - filtersScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplicador de velocidade
    filtersScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Carrega favoritos, recentes, criações salvas e figurinhas do banco
  useEffect(() => {
    if (activeTab === 'eu-criei') {
      setMyCreations(creationsService.getCreations());
    }
    if (activeTab === 'recentes') {
      setRecentStickers(recentService.getRecents());
    }
    const favs = favoritesService.getFavorites();
    setFavoriteIds(favs.map(f => f.id));

    // Busca figurinhas salvas no Supabase
    async function loadHomeDatabaseStickers() {
      try {
        const data = await getStickers();
        if (data && data.length > 0) {
          setDatabaseStickers(data);
        }
      } catch (err) {
        console.log('Sem stickers do banco:', err);
      }
    }
    loadHomeDatabaseStickers();
  }, [activeTab]);

  // Abre a janela de seleção de arquivos do sistema para alterar a capa do card
  const handleOpenCoverUpload = (e, cardId) => {
    e.stopPropagation();
    setEditingCardId(cardId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Processa o arquivo selecionado e atualiza a capa do card
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingCardId) return;

    setToastMessage('Atualizando capa...');
    try {
      const newUrl = await updateCategoryCover(editingCardId, file);
      setCustomCovers(prev => ({
        ...prev,
        [editingCardId]: newUrl,
      }));
      setToastMessage('Capa alterada com sucesso! ✨');
    } catch (err) {
      console.error('Erro ao atualizar capa:', err);
      setToastMessage('Erro ao salvar capa. Tente novamente.');
    } finally {
      setTimeout(() => setToastMessage(''), 2500);
      setEditingCardId(null);
    }
  };

  // Lista de stickers mais usados no Lumi App
  const mostUsedStickers = [
    {
      id: 'mu-1',
      prefix: 'meu',
      mainText: 'Drink favorito.',
      suffix: '♥',
      styleVariant: 'drink-style',
    },
    {
      id: 'mu-2',
      isBottle: true,
      label: 'beba água.',
    },
    {
      id: 'mu-3',
      prefix: 'meu tipo de',
      mainText: 'INVESTIMENTO.',
      suffix: 'comida boa ✔',
      styleVariant: 'investimento-style',
    },
    {
      id: 'mu-4',
      mainText: 'Lunch Time.',
      suffix: 'one • 3',
      styleVariant: 'lunch-style',
    },
    {
      id: 'mu-5',
      prefix: 'Pedi',
      mainText: 'felicidade,',
      suffix: '♥ VEIO ISSO.',
      styleVariant: 'felicidade-style',
    },
    {
      id: 'mu-6',
      prefix: 'hora do',
      mainText: 'Jantar.',
      suffix: 'UMA DELÍCIA.',
      styleVariant: 'jantar-style',
    },
    {
      id: 'mu-7',
      prefix: 'comer',
      mainText: 'sem feijão:',
      suffix: 'CASTIGO DO MONSTRO.',
      styleVariant: 'feijao-style',
    },
    {
      id: 'mu-8',
      prefix: 'pizza sem',
      mainText: 'catchup:',
      suffix: 'CASTIGO DO MONSTRO.',
      styleVariant: 'catchup-style',
    },
  ];

  // Lista de stickers em alta 🔥
  const trendingStickers = [
    {
      id: 'tr-1',
      prefix: 'achei na',
      mainText: 'shô.',
      suffix: 'achadinhos ♥',
      styleVariant: 'feijao-style',
    },
    {
      id: 'tr-2',
      prefix: 'meu',
      mainText: 'Drink favorito.',
      suffix: '♥',
      styleVariant: 'drink-style',
    },
    {
      id: 'tr-3',
      isBottle: true,
      label: 'beba água.',
    },
    {
      id: 'tr-4',
      prefix: 'a defesa vem',
      mainText: 'forte.',
      suffix: '⚖ DIREITO',
      styleVariant: 'felicidade-style',
    },
    {
      id: 'tr-5',
      prefix: 'meu tipo de',
      mainText: 'INVESTIMENTO.',
      suffix: 'comida boa ✔',
      styleVariant: 'investimento-style',
    },
    {
      id: 'tr-6',
      prefix: 'nova',
      mainText: 'COLEÇÃO.',
      suffix: '✦ novidades',
      styleVariant: 'investimento-style',
    },
  ];

  // Figurinhas do banco filtradas por tipo ou categoria
  const dbPhrases = databaseStickers
    .filter(s => s.type === 'phrase' || s.category_slug === 'frases')
    .map(s => ({
      id: s.id,
      mainText: s.title,
      image_url: s.image_url,
      label: s.title,
    }));

  // Lista exclusivamente de frases para Stories (combina banco + locais)
  const phrasesStickers = [
    ...dbPhrases,
    {
      id: 'ph-1',
      prefix: 'menos é',
      mainText: 'mais.',
      suffix: '✦ estética clean',
      styleVariant: 'drink-style',
    },
    {
      id: 'ph-2',
      prefix: 'Pedi',
      mainText: 'felicidade,',
      suffix: '♥ VEIO ISSO.',
      styleVariant: 'felicidade-style',
    },
    {
      id: 'ph-3',
      prefix: 'detalhes que',
      mainText: 'ENCANTAM.',
      suffix: 'nosso cantinho',
      styleVariant: 'investimento-style',
    },
    {
      id: 'ph-4',
      prefix: 'simplicidade &',
      mainText: 'essência.',
      suffix: 'viver bem',
      styleVariant: 'drink-style',
    },
    {
      id: 'ph-5',
      prefix: 'comer',
      mainText: 'sem feijão:',
      suffix: 'CASTIGO DO MONSTRO.',
      styleVariant: 'feijao-style',
    },
    {
      id: 'ph-6',
      prefix: 'pizza sem',
      mainText: 'catchup:',
      suffix: 'CASTIGO DO MONSTRO.',
      styleVariant: 'catchup-style',
    },
    {
      id: 'ph-7',
      prefix: 'hora do',
      mainText: 'Jantar.',
      suffix: 'UMA DELÍCIA.',
      styleVariant: 'jantar-style',
    },
    {
      id: 'ph-8',
      prefix: 'meu tipo de',
      mainText: 'INVESTIMENTO.',
      suffix: 'comida boa ✔',
      styleVariant: 'investimento-style',
    },
  ];

  // Lista exclusivamente de elementos gráficos, ilustrações e desenhos
  const elementsStickers = [
    {
      id: 'el-1',
      label: 'Hambúrguer',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <path d="M15 45 C15 15, 85 15, 85 45 Z" fill="#E5984A" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="35" cy="30" r="2" fill="#FFF2D6" />
          <circle cx="50" cy="24" r="2" fill="#FFF2D6" />
          <circle cx="65" cy="32" r="2" fill="#FFF2D6" />
          <polygon points="12 46, 88 46, 50 62" fill="#FFC83B" />
          <rect x="14" y="52" width="72" height="14" rx="7" fill="#6E3A20" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M10 66 C20 70, 30 64, 40 68 C50 72, 60 64, 70 68 C80 72, 90 66, 90 66" stroke="#48BB78" strokeWidth="6" strokeLinecap="round" />
          <rect x="18" y="72" width="64" height="15" rx="7" fill="#E5984A" stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>
      )
    },
    {
      id: 'el-2',
      label: 'Batata Frita',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <rect x="30" y="10" width="8" height="40" rx="3" fill="#F6E05E" />
          <rect x="42" y="6" width="8" height="45" rx="3" fill="#ECC94B" />
          <rect x="54" y="12" width="8" height="40" rx="3" fill="#F6E05E" />
          <rect x="66" y="18" width="8" height="35" rx="3" fill="#ECC94B" />
          <path d="M22 45 L30 92 C32 96, 68 96, 70 92 L78 45 Z" fill="#E53E3E" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="50" cy="68" r="11" fill="#F6E05E" />
          <path d="M45 68 Q50 74 55 68" stroke="#744210" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="46" cy="64" r="1.5" fill="#744210" />
          <circle cx="54" cy="64" r="1.5" fill="#744210" />
        </svg>
      )
    },
    {
      id: 'el-3',
      label: 'Cerejas',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <path d="M45 25 C45 10, 70 12, 75 28 C60 32, 45 25, 45 25 Z" fill="#48BB78" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M50 25 Q38 45 32 60" stroke="#38A169" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M50 25 Q62 45 68 62" stroke="#38A169" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="32" cy="68" r="16" fill="#E53E3E" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="28" cy="62" r="4" fill="#FEB2B2" />
          <circle cx="68" cy="70" r="16" fill="#C53030" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="64" cy="64" r="4" fill="#FEB2B2" />
        </svg>
      )
    },
    {
      id: 'el-4',
      label: 'Nuvem e Raio',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <path d="M25 60 C15 60, 10 50, 18 40 C15 30, 28 20, 40 25 C48 15, 68 15, 75 25 C85 25, 92 35, 88 45 C95 52, 90 60, 80 60 Z" fill="#FFFFFF" />
          <polygon points="50 56, 42 74, 52 74, 46 92, 64 68, 54 68" fill="#F6E05E" stroke="#D69E2E" strokeWidth="1.5" />
        </svg>
      )
    },
    {
      id: 'el-5',
      label: 'Balão Mensagem',
      render: (
        <svg width="74" height="54" viewBox="0 0 100 70" fill="none">
          <path d="M10 5 C10 2, 20 0, 30 0 L80 0 C90 0, 100 2, 100 15 L100 45 C100 55, 90 58, 80 58 L30 58 L12 70 L18 58 L10 58 C2 58, 0 50, 0 40 L0 15 C0 5, 5 5, 10 5 Z" fill="#FFFFFF" />
        </svg>
      )
    },
    {
      id: 'el-6',
      label: 'Avião',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <path d="M50 15 L58 45 L90 60 L90 68 L58 60 L58 80 L68 88 L68 94 L50 90 L32 94 L32 88 L42 80 L42 60 L10 68 L10 60 L42 45 Z" fill="#E2E8F0" stroke="#3182CE" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'el-7',
      label: 'Nuvem de Sonho',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <circle cx="28" cy="82" r="5" fill="#FFFFFF" />
          <circle cx="38" cy="70" r="7" fill="#FFFFFF" />
          <path d="M38 52 C28 52, 22 42, 30 32 C26 22, 38 12, 50 16 C58 8, 76 8, 82 18 C92 18, 98 28, 94 38 C100 45, 96 52, 88 52 Z" fill="#FFFFFF" />
        </svg>
      )
    },
    {
      id: 'el-8',
      label: 'Brilhos Mágicos',
      render: (
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          <path d="M50 10 Q50 50 10 50 Q50 50 50 90 Q50 50 90 50 Q50 50 50 10 Z" fill="#FFD700" />
          <circle cx="78" cy="22" r="6" fill="#FFF275" />
          <circle cx="22" cy="78" r="4" fill="#FFF275" />
        </svg>
      )
    }
  ];

  // Copia um sticker mais usado para os Stories e adiciona aos recentes e contabiliza uso
  const handleCopyMostUsedSticker = async (item, event) => {
    const targetElement = event.currentTarget.querySelector('.sticker-content-center') || event.currentTarget;
    setToastMessage('Copiando...');
    const result = await clipboardService.copyStickerImage({
      id: item.id,
      title: item.mainText || item.label,
      domElement: targetElement,
    });
    if (result.success) {
      recentService.addRecent(item);
      const updatedCounts = usageService.recordUsage(item);
      setUsageCounts(updatedCounts);
    }
    setToastMessage(result.message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Copia um sticker da lista de recentes, frases, elementos ou do banco
  const handleCopyRecentSticker = async (item, event) => {
    setToastMessage('Copiando...');

    let result;
    if (item.image_url) {
      // Cópia direta do PNG transparente hospedado no Supabase
      result = await clipboardService.copyStickerImage({
        id: item.id,
        title: item.mainText || item.label || item.title,
        imageUrl: item.image_url,
      });
    } else {
      // Cópia por rasterização do elemento tipográfico local
      const targetElement = event?.currentTarget?.querySelector('.sticker-content-center') || event?.currentTarget;
      result = await clipboardService.copyStickerImage({
        id: item.id,
        title: item.mainText || item.label,
        domElement: targetElement,
      });
    }

    if (result.success) {
      recentService.addRecent(item);
      setRecentStickers(recentService.getRecents());
      const updatedCounts = usageService.recordUsage(item);
      setUsageCounts(updatedCounts);
    }
    setToastMessage(result.message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Alterna o status de favorito nos stickers
  const handleToggleFavorite = (item, e) => {
    e.stopPropagation();
    const updated = favoritesService.toggleFavorite(item);
    setFavoriteIds(updated.map((fav) => fav.id));
  };

  // Copia a criação do usuário para os Stories
  const handleCopyCreation = async (item) => {
    setToastMessage('Copiando...');
    const result = await clipboardService.copyStickerImage({
      imageUrl: item.imageData,
      title: item.title,
    });
    setToastMessage(result.message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Exclui uma criação personalizada
  const handleDeleteCreation = (e, id) => {
    e.stopPropagation();
    creationsService.removeCreation(id);
    setMyCreations(creationsService.getCreations());
  };

  // Filtros disponíveis na barra de rolagem horizontal
  const filterPills = [
    {
      id: 'nichos',
      label: 'Nichos',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      id: 'mais-usados',
      label: 'Mais usados',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      )
    },
    {
      id: 'recentes',
      label: 'Recentes',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      id: 'em-alta',
      label: 'Em alta 🔥',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      )
    },
    {
      id: 'frases',
      label: 'Frases',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      id: 'elementos',
      label: 'Elementos',
      icon: (
        <svg className="pill-svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 12h8"></path>
          <path d="M12 8v8"></path>
        </svg>
      )
    }
  ];

  // Dados das seções de conteúdo do Lumi App
  const sections = [
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

  // Filtro de busca inteligente para os stickers das abas
  const searchNormalized = searchTerm.toLowerCase().trim();

  const filterStickerItem = (item) => {
    if (!searchNormalized) return true;
    const itemText = `${item.prefix || ''} ${item.mainText || ''} ${item.suffix || ''} ${item.label || ''} ${item.title || ''}`.toLowerCase();
    return itemText.includes(searchNormalized);
  };

  // Lista de Mais Usados ordenada dinamicamente por cliques reais (ranking de popularidade)
  const sortedMostUsed = [...mostUsedStickers].sort((a, b) => {
    const countA = usageCounts[a.id] || 0;
    const countB = usageCounts[b.id] || 0;
    return countB - countA;
  });

  const filteredMostUsed = sortedMostUsed.filter(filterStickerItem);
  const filteredRecents = recentStickers.filter(filterStickerItem);
  const filteredTrending = trendingStickers.filter(filterStickerItem);
  const filteredPhrases = phrasesStickers.filter(filterStickerItem);
  const filteredElements = elementsStickers.filter(filterStickerItem);

  // Filtra as seções e os cards correspondentes em tempo real
  const filteredSections = sections.map((sec) => {
    if (!searchNormalized) return sec;
    const matchingCards = sec.cards.filter((card) => 
      card.overlayText.toLowerCase().includes(searchNormalized) ||
      (card.tagLabel && card.tagLabel.toLowerCase().includes(searchNormalized))
    );
    const isSectionMatch = sec.title.toLowerCase().includes(searchNormalized);
    return isSectionMatch ? sec : { ...sec, cards: matchingCards };
  }).filter((sec) => sec.cards.length > 0);

  return (
    <div className={`home-container ${theme}`} data-theme={theme}>
      {/* Toast de Notificação na Home */}
      {toastMessage && (
        <div className="home-toast-banner">
          {toastMessage}
        </div>
      )}

      {/* Input de arquivo oculto para upload de nova capa pelo Admin */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Topo com o Logotipo Oficial da Lumi */}
      <header className="home-header">
        <img src={theme === 'dark' ? lumiLogoDark : lumiLogoLight} alt="Lumi" className="home-lumi-logo" />
      </header>

      {/* Banner Inteligente de Instalação do PWA no Celular */}
      <InstallBanner onOpenGuide={() => setActiveInstallModal(LEGAL_DOCS.install)} />

      {/* Campo de Busca Funcional Estilo iOS */}
      <div className="home-search-container">
        <div className="home-search-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar categorias ou temas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar categorias ou temas"
          />
          {searchTerm && (
            <button 
              type="button" 
              className="home-clear-search-btn" 
              onClick={() => setSearchTerm('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Carrossel de Pílulas de Filtros com Suporte a Drag e Touch Swipe */}
      <section 
        ref={filtersScrollRef}
        className={`home-filters-scroll ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        aria-label="Filtros de conteúdo deslizáveis"
      >
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className={`filter-pill-btn ${activeTab === pill.id ? 'active' : ''}`}
            onClick={() => {
              if (!hasDragged.current) {
                setActiveTab(pill.id);
              }
            }}
          >
            {pill.icon}
            <span className="pill-label">{pill.label}</span>
          </button>
        ))}
      </section>

      {/* Seções de Cards ou Lista de Criações / Mais Usados */}
      <main className="home-content-sections">
        {activeTab === 'mais-usados' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Stickers mais usados</h2>
            </div>

            <div className="cards-grid">
              {filteredMostUsed.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhum sticker encontrado para "{searchTerm}".</p>
                </div>
              ) : (
                filteredMostUsed.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={(e) => handleCopyMostUsedSticker(item, e)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Copiar sticker: ${item.mainText || item.label}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar (Coração) */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central do Sticker */}
                  <div className="sticker-content-center">
                    {item.isBottle ? (
                      <div className="bottle-art-wrapper">
                        <span className="bottle-label-curved">{item.label}</span>
                        <div className="bottle-svg-icon">
                          <svg width="68" height="96" viewBox="0 0 100 140" fill="none">
                            <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                            <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                            <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                        {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                        {item.mainText && <span className="typo-main">{item.mainText}</span>}
                        {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'recentes' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Usados recentemente</h2>
            </div>

            {filteredRecents.length === 0 ? (
              <div className="home-no-results">
                <p>{searchTerm ? `Nenhum sticker recente encontrado para "${searchTerm}".` : 'Nenhum sticker usado recentemente.'}</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', opacity: 0.7 }}>
                  Copie qualquer figurinha para vê-la aqui!
                </p>
              </div>
            ) : (
              <div className="cards-grid">
                {filteredRecents.map((item) => (
                  <div
                    key={item.id}
                    className="sticker-card"
                    onClick={(e) => handleCopyRecentSticker(item, e)}
                    role="button"
                    tabIndex="0"
                    aria-label={`Copiar sticker: ${item.mainText || item.label}`}
                  >
                    {/* Topo do Card: Botão de Favoritar */}
                    <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                      {/* Botão de Favoritar */}
                      <button
                        type="button"
                        className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                        onClick={(e) => handleToggleFavorite(item, e)}
                        aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                    </div>

                    {/* Conteúdo Central do Sticker */}
                    <div className="sticker-content-center">
                      {item.isBottle ? (
                        <div className="bottle-art-wrapper">
                          <span className="bottle-label-curved">{item.label}</span>
                          <div className="bottle-svg-icon">
                            <svg width="68" height="96" viewBox="0 0 100 140" fill="none">
                              <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                              <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                              <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                          {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                          {item.mainText && <span className="typo-main">{item.mainText}</span>}
                          {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : activeTab === 'em-alta' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Em alta no momento 🔥</h2>
            </div>

            <div className="cards-grid">
              {filteredTrending.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhum sticker em alta encontrado para "{searchTerm}".</p>
                </div>
              ) : (
                filteredTrending.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={(e) => handleCopyRecentSticker(item, e)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Copiar sticker: ${item.mainText || item.label}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central do Sticker */}
                  <div className="sticker-content-center">
                    {item.isBottle ? (
                      <div className="bottle-art-wrapper">
                        <span className="bottle-label-curved">{item.label}</span>
                        <div className="bottle-svg-icon">
                          <svg width="68" height="96" viewBox="0 0 100 140" fill="none">
                            <path d="M30 35 C30 20 40 18 50 18 C60 18 70 20 70 35 L78 120 C78 130 70 135 50 135 C30 135 22 130 22 120 Z" fill="#E8D5C8" opacity="0.95" />
                            <rect x="38" y="8" width="24" height="14" rx="4" fill="#A88B77" />
                            <path d="M32 45 L32 115" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                        {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                        {item.mainText && <span className="typo-main">{item.mainText}</span>}
                        {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'frases' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Frases para Stories ✨</h2>
            </div>

            <div className="cards-grid">
              {filteredPhrases.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhuma frase encontrada para "{searchTerm}".</p>
                </div>
              ) : (
                filteredPhrases.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={(e) => handleCopyRecentSticker(item, e)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Copiar frase: ${item.mainText}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central: Imagem do Supabase ou Tipografia Padrão */}
                  <div className="sticker-content-center">
                    {item.image_url ? (
                      <div className="admin-uploaded-sticker-wrapper">
                        <img 
                          src={item.image_url} 
                          alt={item.mainText || item.label} 
                          style={{ maxWidth: '88px', maxHeight: '88px', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div className={`typography-wrapper ${item.styleVariant || ''}`}>
                        {item.prefix && <span className="typo-prefix">{item.prefix}</span>}
                        <span className="typo-main">{item.mainText}</span>
                        {item.suffix && <span className="typo-suffix">{item.suffix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'elementos' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Elementos & Desenhos 🎨</h2>
            </div>

            <div className="cards-grid">
              {filteredElements.length === 0 ? (
                <div className="home-no-results" style={{ gridColumn: '1 / -1' }}>
                  <p>Nenhum elemento gráfico encontrado para "{searchTerm}".</p>
                </div>
              ) : (
                filteredElements.map((item) => (
                <div
                  key={item.id}
                  className="sticker-card"
                  onClick={(e) => handleCopyRecentSticker({ id: item.id, label: item.label, isElement: true }, e)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Copiar elemento: ${item.label}`}
                >
                  {/* Topo do Card: Botão de Favoritar */}
                  <div className="card-top-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botão de Favoritar */}
                    <button
                      type="button"
                      className={`favorite-toggle-btn ${favoriteIds.includes(item.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      aria-label={favoriteIds.includes(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={favoriteIds.includes(item.id) ? '#EAA1AC' : 'none'} stroke={favoriteIds.includes(item.id) ? '#EAA1AC' : '#8E8E93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo Central Exclusivamente com Desenho / Ilustração */}
                  <div className="sticker-content-center">
                    <div className="picker-graphic-center">
                      {item.render}
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          </section>
        ) : activeTab === 'eu-criei' ? (
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">Minhas criações</h2>
            </div>

            {myCreations.length === 0 ? (
              <div className="home-no-results">
                <p>Você ainda não salvou nenhuma figurinha.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', opacity: 0.7 }}>
                  Toque no botão <strong>+</strong> para criar sua primeira figurinha!
                </p>
              </div>
            ) : (
              <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {myCreations.map((creation) => (
                  <div 
                    key={creation.id} 
                    className="feed-card creation-card" 
                    onClick={() => handleCopyCreation(creation)}
                    role="button"
                    tabIndex="0"
                    aria-label={`Copiar ${creation.title}`}
                    style={{ 
                      background: 'rgba(58, 53, 58, 0.7)', 
                      backdropFilter: 'blur(10px)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative',
                      minHeight: '170px'
                    }}
                  >
                    {/* Botão de Excluir */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCreation(e, creation.id)}
                      aria-label="Excluir figurinha"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        borderRadius: '50%',
                        color: '#fff',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        zIndex: 10
                      }}
                    >
                      ✕
                    </button>

                    {/* Imagem transparente da criação */}
                    <img 
                      src={creation.imageData} 
                      alt={creation.title} 
                      style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} 
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : filteredSections.length === 0 ? (
          <div className="home-no-results">
            <p>Nenhuma categoria ou tema encontrado para "{searchTerm}".</p>
          </div>
        ) : (
          filteredSections.map((sec) => (
            <section key={sec.id} className="content-section">
              {/* Cabeçalho da Seção com Ação 'Ver todas as subcategorias ›' */}
              <div 
                className="section-header"
                onClick={() => onSelectSection ? onSelectSection(sec) : onSelectCategory(sec.title)}
                role="button"
                tabIndex="0"
                aria-label={`Ver todas as subcategorias de ${sec.title}`}
              >
                <h2 className="section-title">{sec.title}</h2>
                <span className="see-all-link">Ver todas ›</span>
              </div>

              {/* Carrossel Horizontal Deslizável (Scroll & Swipe para o lado) */}
              <div className="horizontal-cards-row">
                {sec.cards.map((card) => {
                  const currentBg = customCovers[card.id] || card.bgImage;
                  return (
                    <div 
                      key={card.id} 
                      className="feed-card horizontal-feed-card" 
                      style={{ backgroundImage: `url(${currentBg})` }}
                      onClick={() => onSelectCategory && onSelectCategory(card.tagLabel || sec.title)}
                      role="button"
                      tabIndex="0"
                      aria-label={`Ver artes de ${card.tagLabel || sec.title}`}
                    >
                      {/* Botão de Edição de Capa visível exclusivamente para o Admin Supremo */}
                      {isAdmin && (
                        <button
                          type="button"
                          className="admin-edit-cover-btn"
                          onClick={(e) => handleOpenCoverUpload(e, card.id)}
                          title="Alterar imagem de capa"
                          aria-label="Alterar imagem de capa"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        </button>
                      )}

                      <div className="card-overlay-gradient">
                        <p className="card-custom-typography">{card.overlayText}</p>
                        {card.tagLabel && (
                          <div className="card-footer-pill">
                            {card.tagLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Barra de Navegação Inferior Estilo Dock iOS com Botão Hero Central */}
      <nav className="bottom-nav-bar" aria-label="Navegação principal">
        {/* Início */}
        <button
          type="button"
          className={`nav-item ${activeNav === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate && onNavigate('home')}
          aria-label="Início"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <path d="M9 22V12h6v10"></path>
          </svg>
        </button>

        {/* Botão Hero Central de Favoritos em Alto Destaque */}
        <button 
          type="button" 
          className="floating-action-plus" 
          onClick={() => onNavigate && onNavigate('favorites')}
          aria-label="Favoritos"
          title="Favoritos"
        >
          <svg width="25" height="25" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Perfil de Usuário */}
        <button
          type="button"
          className={`nav-item ${activeNav === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate && onNavigate('profile')}
          aria-label="Perfil de Usuário"
          title="Perfil"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </nav>

      {/* Modal com Passo a Passo de Instalação no Celular */}
      {activeInstallModal && (
        <LegalModal 
          doc={activeInstallModal} 
          onClose={() => setActiveInstallModal(null)} 
        />
      )}
    </div>
  );
}

export default Home;
