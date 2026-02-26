import { ContentItem, ContentType, CalendarItem, Genre } from '@/types/content';
import { supabase } from '@/integrations/supabase/client';

const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTBjZjBlZGRiODI4NDM5MmUxYTRlM2E5ZGFlNGIwOSIsIm5iZiI6MTc2NjYxNDQ4MS44NDYwMDAyLCJzdWIiOiI2OTRjNjVkMTFkNzcxNWJhNTI4Y2Q2YzkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.eYazkMs4kPcmqrpRvX3HZx3rrimOm9_Pj-Q9Ckbio30';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

interface TmdbMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  runtime?: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: string;
}

interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

interface TmdbGenreResponse {
  genres: Genre[];
}

const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop';

// ============= TMDB Proxy Helper =============

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${TMDB_BASE}/${endpoint}`);
  url.searchParams.set('language', 'pt-BR');
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${TMDB_API_KEY}`,
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB error: ${response.status}`);
  }

  return response.json();
}

// ============= TMDB Functions =============

function mapTmdbToContentItem(item: TmdbMovie, forceType?: ContentType): ContentItem {
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  let type: ContentType = forceType || (mediaType === 'movie' ? 'movie' : 'serie');
  
  return {
    id: String(item.id),
    title: item.title || item.name || 'Sem título',
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : PLACEHOLDER_POSTER,
    backdrop: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : undefined,
    type,
    year: (item.release_date || item.first_air_date || '').split('-')[0],
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
    overview: item.overview,
    voteCount: item.vote_count,
    runtime: item.runtime,
    genres: item.genres,
  };
}

// Cache para resultados TMDB individuais
const tmdbMemoryCache = new Map<string, { item: ContentItem; timestamp: number }>();
const MEMORY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getTmdbFromCache(key: string): ContentItem | null {
  const cached = tmdbMemoryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > MEMORY_CACHE_TTL) {
    tmdbMemoryCache.delete(key);
    return null;
  }
  return cached.item;
}

function setTmdbCache(key: string, item: ContentItem): void {
  tmdbMemoryCache.set(key, { item, timestamp: Date.now() });
}

// Buscar filme por ID
async function fetchTMDBMovieById(tmdbId: string): Promise<ContentItem | null> {
  const cacheKey = `movie_${tmdbId}`;
  const cached = getTmdbFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const data = await fetchFromTMDB(`movie/${tmdbId}`);
    const item = mapTmdbToContentItem(data, 'movie');
    setTmdbCache(cacheKey, item);
    return item;
  } catch (error) {
    console.error(`Erro ao buscar filme TMDB ${tmdbId}:`, error);
    return null;
  }
}

// Buscar série por ID
async function fetchTMDBTVById(tmdbId: string, type: 'serie' | 'anime' | 'dorama' = 'serie'): Promise<ContentItem | null> {
  const cacheKey = `tv_${tmdbId}`;
  const cached = getTmdbFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const data = await fetchFromTMDB(`tv/${tmdbId}`);
    const item = mapTmdbToContentItem(data, type);
    setTmdbCache(cacheKey, item);
    return item;
  } catch (error) {
    console.error(`Erro ao buscar série TMDB ${tmdbId}:`, error);
    return null;
  }
}

// ============= Novas Categorias TMDB =============

// Top 10 da Semana (Trending)
export async function fetchTrending(mediaType: 'movie' | 'tv' = 'movie', timeWindow: 'day' | 'week' = 'week'): Promise<ContentItem[]> {
  try {
    const data: TmdbResponse = await fetchFromTMDB(`trending/${mediaType}/${timeWindow}`);
    return data.results.slice(0, 10).map(item => mapTmdbToContentItem(item, mediaType === 'movie' ? 'movie' : 'serie'));
  } catch (error) {
    console.error('Erro ao buscar trending:', error);
    return [];
  }
}

// Populares no Brasil
export async function fetchPopularBrazil(mediaType: 'movie' | 'tv' = 'movie', page: number = 1): Promise<{ items: ContentItem[]; totalPages: number; totalResults: number }> {
  try {
    const data: TmdbResponse = await fetchFromTMDB(`${mediaType}/popular`, { region: 'BR', page: String(page) });
    return {
      items: data.results.map(item => mapTmdbToContentItem(item, mediaType === 'movie' ? 'movie' : 'serie')),
      totalPages: Math.min(data.total_pages, 10),
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error('Erro ao buscar populares BR:', error);
    return { items: [], totalPages: 0, totalResults: 0 };
  }
}

// Em Cartaz (Now Playing)
export async function fetchNowPlaying(page: number = 1): Promise<{ items: ContentItem[]; totalPages: number; totalResults: number }> {
  try {
    const data: TmdbResponse = await fetchFromTMDB('movie/now_playing', { region: 'BR', page: String(page) });
    return {
      items: data.results.map(item => mapTmdbToContentItem(item, 'movie')),
      totalPages: Math.min(data.total_pages, 10),
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error('Erro ao buscar em cartaz:', error);
    return { items: [], totalPages: 0, totalResults: 0 };
  }
}

// Próximos Lançamentos (Upcoming)
export async function fetchUpcoming(page: number = 1): Promise<{ items: ContentItem[]; totalPages: number; totalResults: number }> {
  try {
    const data: TmdbResponse = await fetchFromTMDB('movie/upcoming', { region: 'BR', page: String(page) });
    return {
      items: data.results.map(item => mapTmdbToContentItem(item, 'movie')),
      totalPages: Math.min(data.total_pages, 10),
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return { items: [], totalPages: 0, totalResults: 0 };
  }
}

// Mais Bem Avaliados (Top Rated)
export async function fetchTopRated(mediaType: 'movie' | 'tv' = 'movie', page: number = 1): Promise<{ items: ContentItem[]; totalPages: number; totalResults: number }> {
  try {
    const data: TmdbResponse = await fetchFromTMDB(`${mediaType}/top_rated`, { page: String(page) });
    return {
      items: data.results.map(item => mapTmdbToContentItem(item, mediaType === 'movie' ? 'movie' : 'serie')),
      totalPages: Math.min(data.total_pages, 10),
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error('Erro ao buscar top rated:', error);
    return { items: [], totalPages: 0, totalResults: 0 };
  }
}

// Lista de Gêneros
export async function fetchGenres(mediaType: 'movie' | 'tv' = 'movie'): Promise<Genre[]> {
  try {
    const data: TmdbGenreResponse = await fetchFromTMDB(`genre/${mediaType}/list`);
    return data.genres;
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
    return [];
  }
}

// Discover por Gênero
export async function fetchByGenre(genreId: number, mediaType: 'movie' | 'tv' = 'movie', page: number = 1): Promise<{ items: ContentItem[]; totalPages: number; totalResults: number }> {
  try {
    const data: TmdbResponse = await fetchFromTMDB(`discover/${mediaType}`, { 
      with_genres: String(genreId), 
      page: String(page), 
      sort_by: 'popularity.desc' 
    });
    return {
      items: data.results.map(item => mapTmdbToContentItem(item, mediaType === 'movie' ? 'movie' : 'serie')),
      totalPages: Math.min(data.total_pages, 10),
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error('Erro ao buscar por gênero:', error);
    return { items: [], totalPages: 0, totalResults: 0 };
  }
}

// ============= Busca TMDB =============

export interface SearchResult {
  items: ContentItem[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
}

export async function searchTMDB(query: string, page: number = 1): Promise<SearchResult> {
  try {
    const data: TmdbResponse = await fetchFromTMDB('search/multi', { query: encodeURIComponent(query), page: String(page) });
    
    const items = data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => mapTmdbToContentItem(item));
    
    return {
      items,
      totalResults: data.total_results,
      totalPages: Math.min(data.total_pages, 10),
      currentPage: page,
    };
  } catch (error) {
    console.error('Erro na busca TMDB:', error);
    return { items: [], totalResults: 0, totalPages: 0, currentPage: page };
  }
}

export async function searchContent(query: string, page: number = 1): Promise<SearchResult> {
  return searchTMDB(query, page);
}

// ============= Superflix Integration =============

// Cache keys and TTL
const CACHE_PREFIX = 'superflix_cache_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const TMDB_CACHE_PREFIX = 'tmdb_cache_';
const TMDB_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCachedData<T>(key: string, ttl: number): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage might be full, ignore
  }
}

interface SuperflixResponse {
  data: string[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

async function fetchIdsFromSuperflix(
  category: string, 
  idType: 'imdb' | 'tmdb',
  limit: number = 100,
  offset: number = 0
): Promise<{ ids: string[]; total: number; hasMore: boolean }> {
  const cacheKey = `${CACHE_PREFIX}${category}_${idType}_${limit}_${offset}`;
  
  // Check cache first
  const cached = getCachedData<{ ids: string[]; total: number; hasMore: boolean }>(cacheKey, CACHE_TTL);
  if (cached) {
    console.log(`[Cache HIT] ${category} - ${cached.ids.length} IDs`);
    return cached;
  }
  
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/superflix-proxy?category=${category}&type=${idType}&format=json&order=desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseData: SuperflixResponse = await response.json();
    
    const result = {
      ids: Array.isArray(responseData.data) ? responseData.data.map(String) : [],
      total: responseData.pagination?.total || 0,
      hasMore: responseData.pagination?.hasMore || false,
    };
    
    // Cache the result
    setCachedData(cacheKey, result);
    console.log(`[Cache MISS] ${category} - fetched ${result.ids.length} IDs (total: ${result.total})`);
    
    return result;
  } catch (error) {
    console.error(`Erro ao buscar IDs de ${category}:`, error);
    return { ids: [], total: 0, hasMore: false };
  }
}

// ============= Main Content Fetching =============

const ITEMS_PER_PAGE = 20;

export async function fetchContent(category: ContentType = 'all', page: number = 1): Promise<SearchResult> {
  try {
    // Novas categorias TMDB
    if (category === 'trending') {
      const items = await fetchTrending('movie', 'week');
      return { items, totalResults: items.length, totalPages: 1, currentPage: 1 };
    }
    
    if (category === 'popular') {
      const result = await fetchPopularBrazil('movie', page);
      return { items: result.items, totalResults: result.totalResults, totalPages: result.totalPages, currentPage: page };
    }
    
    if (category === 'nowplaying') {
      const result = await fetchNowPlaying(page);
      return { items: result.items, totalResults: result.totalResults, totalPages: result.totalPages, currentPage: page };
    }
    
    if (category === 'upcoming') {
      const result = await fetchUpcoming(page);
      return { items: result.items, totalResults: result.totalResults, totalPages: result.totalPages, currentPage: page };
    }
    
    if (category === 'toprated') {
      const result = await fetchTopRated('movie', page);
      return { items: result.items, totalResults: result.totalResults, totalPages: result.totalPages, currentPage: page };
    }

    // Categorias originais via Superflix - agora com paginação no backend
    const superflixCategory = category === 'all' ? 'movie' : category;
    const contentType: ContentType = category === 'all' ? 'movie' : category;
    
    // Fetch only the IDs needed for this page
    const offset = (page - 1) * ITEMS_PER_PAGE;
    const { ids: pageIds, total, hasMore } = await fetchIdsFromSuperflix(
      superflixCategory, 
      'tmdb',
      ITEMS_PER_PAGE,
      offset
    );
    
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    
    // Buscar via TMDB com cache
    const promises = pageIds.map(async (id) => {
      if (category === 'movie' || category === 'all') {
        return fetchTMDBMovieById(id);
      } else {
        return fetchTMDBTVById(id, contentType as 'serie' | 'anime' | 'dorama');
      }
    });

    const results = await Promise.all(promises);
    const items = results.filter((item): item is ContentItem => item !== null);
    
    // Ordenar por ano (mais recentes primeiro)
    items.sort((a, b) => {
      const yearA = parseInt(a.year || '0');
      const yearB = parseInt(b.year || '0');
      return yearB - yearA;
    });

    return { items, totalResults: total, totalPages: Math.min(totalPages, 10), currentPage: page };
  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    return { items: [], totalResults: 0, totalPages: 0, currentPage: page };
  }
}

export async function fetchMovieDetails(id: string, idType: 'imdb' | 'tmdb', type: ContentType): Promise<ContentItem | null> {
  if (type === 'movie') {
    return fetchTMDBMovieById(id);
  } else {
    return fetchTMDBTVById(id, type as 'serie' | 'anime' | 'dorama');
  }
}

// ============= Calendar =============

export async function fetchCalendar(): Promise<CalendarItem[]> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/superflix-proxy?endpoint=calendario`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseData = await response.json();
    const data = responseData.data || responseData;

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
        poster: item.poster_path || PLACEHOLDER_POSTER,
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

// ============= Player URL =============

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
    url = `${API_BASE}/filme/${id}`;
  } else {
    url = `${API_BASE}/serie/${id}`;
    if (season) {
      url += `/${season}`;
      if (episode) {
        url += `/${episode}`;
      }
    }
  }

  const params: string[] = [];
  if (options?.noEpList) params.push('noEpList');
  if (options?.transparent) params.push('transparent');
  if (options?.color) params.push(`color:${options.color.replace('#', '')}`);

  if (params.length > 0) {
    url += '#' + params.join('#');
  }

  return url;
}
