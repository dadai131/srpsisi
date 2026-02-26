import { ContentItem, ContentType, CalendarItem } from '@/types/content';
import { supabase } from '@/integrations/supabase/client';

const TMDB_API_KEY = '9d8edbe878a53f79f0e3d5757f53b185';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface TmdbMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

// Imagens de teste para filmes/séries (Unsplash)
const TEST_POSTERS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=300&h=450&fit=crop',
  'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop',
];

const TEST_TITLES = [
  'Ação Explosiva', 'Mistério na Noite', 'Aventura Épica', 'Drama Intenso',
  'Comédia Hilária', 'Terror Sombrio', 'Romance Eterno', 'Ficção Científica',
  'Thriller Psicológico', 'Fantasia Mágica', 'Animação Incrível', 'Documentário Real',
  'Suspense Tenso', 'Western Clássico', 'Musical Vibrante', 'Crime Noir',
  'Super-Herói', 'Guerra Mundial', 'Esporte Radical', 'Família Unida',
];

function createMockItem(id: string, type: ContentType, index: number): ContentItem {
  const posterIndex = index % TEST_POSTERS.length;
  const titleIndex = index % TEST_TITLES.length;
  const year = 2020 + (index % 5);
  const rating = 6 + Math.random() * 3;

  return {
    id,
    title: `${TEST_TITLES[titleIndex]} ${index + 1}`,
    poster: TEST_POSTERS[posterIndex],
    type,
    year: year.toString(),
    rating: Math.round(rating * 10) / 10,
  };
}

async function fetchIdsFromSuperflix(category: string, idType: 'imdb' | 'tmdb'): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke('superflix-proxy', {
      body: null,
      headers: { 'Content-Type': 'application/json' },
    });

    // Use URL params for GET request via query string
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superflix-proxy?endpoint=lista&category=${category}&type=${idType}&format=json&order=asc`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseData = await response.json();
    
    if (Array.isArray(responseData)) {
      return responseData.map(String);
    }
    return [];
  } catch (error) {
    console.error(`Erro ao buscar IDs de ${category}:`, error);
    return [];
  }
}

function createMockContent(ids: string[], type: ContentType): ContentItem[] {
  const limitedIds = ids.slice(0, 20);
  return limitedIds.map((id, index) => createMockItem(id, type, index));
}

export async function fetchContent(category: ContentType = 'all', query?: string): Promise<ContentItem[]> {
  try {
    let content: ContentItem[] = [];

    if (category === 'all') {
      // Filmes usam IMDB, séries/animes usam TMDB
      const [movieIds, serieIds, animeIds] = await Promise.all([
        fetchIdsFromSuperflix('movie', 'imdb'),
        fetchIdsFromSuperflix('serie', 'tmdb'),
        fetchIdsFromSuperflix('anime', 'tmdb'),
      ]);

      const [movies, series, animes] = [
        createMockContent(movieIds, 'movie'),
        createMockContent(serieIds, 'serie'),
        createMockContent(animeIds, 'anime'),
      ];

      content = [...movies, ...series, ...animes];
    } else {
      const idType = category === 'movie' ? 'imdb' : 'tmdb';
      
      const ids = await fetchIdsFromSuperflix(category, idType);
      content = createMockContent(ids, category);
    }

    if (query) {
      const searchTerm = query.toLowerCase();
      content = content.filter(item => 
        item.title.toLowerCase().includes(searchTerm)
      );
    }

    return content;
  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    return [];
  }
}

export async function fetchCalendar(): Promise<CalendarItem[]> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superflix-proxy?endpoint=calendario`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((item: {
        tmdb_id?: string;
        imdb_id?: string;
        title?: string;
        poster_path?: string;
        backdrop_path?: string;
        air_date?: string;
        episode_title?: string;
        episode_number?: number;
        season_number?: number;
        status?: 'Atualizado' | 'Hoje' | 'Futuro' | 'Atrasado';
      }) => ({
        id: item.tmdb_id || item.imdb_id || '',
        title: item.title || 'Sem título',
        poster: item.poster_path || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
        releaseDate: item.air_date || '',
        type: 'serie' as ContentType,
        episodeTitle: item.episode_title,
        episodeNumber: item.episode_number,
        seasonNumber: item.season_number,
        status: item.status,
        backdropPath: item.backdrop_path,
        tmdbId: item.tmdb_id,
        imdbId: item.imdb_id,
      }));
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar calendário:', error);
    return [];
  }
}

export function getPlayerUrl(
  id: string, 
  type: 'movie' | 'serie', 
  season?: number, 
  episode?: number,
  options?: { color?: string; transparent?: boolean; noEpList?: boolean }
): string {
  const API_BASE = 'https://superflixapi.buzz';
  let url = '';
  
  if (type === 'movie') {
    // Filmes usam ID IMDb com prefixo "tt"
    const imdbId = id.startsWith('tt') ? id : `tt${id}`;
    url = `${API_BASE}/filme/${imdbId}`;
  } else {
    // Séries usam ID TMDB direto
    url = `${API_BASE}/serie/${id}`;
    if (season) {
      url += `/${season}`;
      if (episode) {
        url += `/${episode}`;
      }
    }
  }

  // Formato correto de personalização: #param1#param2#color:hex
  const params: string[] = [];
  if (options?.noEpList) params.push('noEpList');
  if (options?.transparent) params.push('transparent');
  if (options?.color) params.push(`color:${options.color.replace('#', '')}`);

  if (params.length > 0) {
    url += '#' + params.join('#');
  }

  return url;
}
