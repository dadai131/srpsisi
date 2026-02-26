import { ContentItem, ContentType, CalendarItem } from '@/types/content';

const TMDB_API_KEY = '9d8edbe878a53f79f0e3d5757f53b185';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

// Fetch trending movies from TMDB
async function fetchTmdbTrending(mediaType: 'movie' | 'tv'): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/trending/${mediaType}/week?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error(`Erro TMDB trending ${mediaType}:`, e);
    return [];
  }
}

// Fetch popular from TMDB
async function fetchTmdbPopular(mediaType: 'movie' | 'tv', page = 1): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/${mediaType}/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error(`Erro TMDB popular ${mediaType}:`, e);
    return [];
  }
}

// Fetch now playing movies
async function fetchTmdbNowPlaying(): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB now_playing:', e);
    return [];
  }
}

// Discover anime (animation genre 16, from Japan)
async function fetchTmdbAnime(): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_origin_country=JP&sort_by=popularity.desc`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB anime:', e);
    return [];
  }
}

// Discover doramas (Korean dramas)
async function fetchTmdbDorama(): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_origin_country=KR&sort_by=popularity.desc`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB dorama:', e);
    return [];
  }
}

const POSTER_FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop';

function tmdbToContentItem(item: TmdbResult, type: ContentType): ContentItem {
  const isMovie = !!item.title;
  return {
    id: item.id.toString(),
    title: item.title || item.name || 'Sem título',
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : POSTER_FALLBACK,
    backdrop: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : undefined,
    type,
    year: (item.release_date || item.first_air_date || '').substring(0, 4),
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
    overview: item.overview,
  };
}

export async function fetchContent(category: ContentType = 'all', query?: string): Promise<ContentItem[]> {
  try {
    let content: ContentItem[] = [];

    if (query) {
      // Search TMDB
      const res = await fetch(
        `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        content = (data.results || [])
          .filter((r: TmdbResult & { media_type?: string }) => r.media_type === 'movie' || r.media_type === 'tv')
          .map((r: TmdbResult & { media_type?: string }) =>
            tmdbToContentItem(r, r.media_type === 'movie' ? 'movie' : 'serie')
          );
      }
      return content;
    }

    if (category === 'all') {
      const [trendingMovies, trendingSeries, animes, doramas, nowPlaying] = await Promise.all([
        fetchTmdbTrending('movie'),
        fetchTmdbTrending('tv'),
        fetchTmdbAnime(),
        fetchTmdbDorama(),
        fetchTmdbNowPlaying(),
      ]);

      const movies = trendingMovies.map(m => tmdbToContentItem(m, 'movie'));
      const series = trendingSeries.map(s => tmdbToContentItem(s, 'serie'));
      const animeItems = animes.map(a => tmdbToContentItem(a, 'anime'));
      const doramaItems = doramas.map(d => tmdbToContentItem(d, 'dorama'));
      const nowPlayingItems = nowPlaying.map(m => tmdbToContentItem(m, 'movie'));

      // Tag now playing items for identification
      nowPlayingItems.forEach(item => { (item as any)._section = 'nowplaying'; });

      content = [...movies, ...series, ...animeItems, ...doramaItems, ...nowPlayingItems];
    } else if (category === 'movie') {
      const results = await fetchTmdbTrending('movie');
      content = results.map(m => tmdbToContentItem(m, 'movie'));
    } else if (category === 'serie') {
      const results = await fetchTmdbTrending('tv');
      content = results.map(s => tmdbToContentItem(s, 'serie'));
    } else if (category === 'anime') {
      const results = await fetchTmdbAnime();
      content = results.map(a => tmdbToContentItem(a, 'anime'));
    } else if (category === 'dorama') {
      const results = await fetchTmdbDorama();
      content = results.map(d => tmdbToContentItem(d, 'dorama'));
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
        poster: item.poster_path || POSTER_FALLBACK,
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
    const imdbId = id.startsWith('tt') ? id : `tt${id}`;
    url = `${API_BASE}/filme/${imdbId}`;
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
