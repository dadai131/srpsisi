import { ContentItem, ContentType, CalendarItem } from '@/types/content';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '690cf0eddb8284392e1a4e3a9dae4b09';
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

// Fetch top rated movies
async function fetchTmdbTopRatedMovies(): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/movie/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB top_rated movies:', e);
    return [];
  }
}

// Fetch upcoming movies
async function fetchTmdbUpcomingMovies(): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/movie/upcoming?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB upcoming:', e);
    return [];
  }
}

// Fetch series airing today
async function fetchTmdbSeriesAiringToday(): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/tv/airing_today?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB series airing today:', e);
    return [];
  }
}

// Fetch top rated series
async function fetchTmdbTopRatedSeries(): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/tv/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB top_rated series:', e);
    return [];
  }
}

// Fetch anime airing today
async function fetchTmdbAnimeAiringToday(): Promise<TmdbResult[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_origin_country=JP&air_date.gte=${today}&air_date.lte=${today}&sort_by=popularity.desc`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB anime airing today:', e);
    return [];
  }
}

// Discover anime (animation genre 16, from Japan)
async function fetchTmdbAnime(sort: string = 'popularity.desc'): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_origin_country=JP&sort_by=${sort}`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB anime:', e);
    return [];
  }
}

// Top rated anime
async function fetchTmdbAnimeTopRated(): Promise<TmdbResult[]> {
  return fetchTmdbAnime('vote_average.desc&vote_count.gte=200');
}

// Recently released anime
async function fetchTmdbAnimeRecent(): Promise<TmdbResult[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_origin_country=JP&sort_by=first_air_date.desc&first_air_date.lte=${today}&vote_count.gte=10`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB anime recent:', e);
    return [];
  }
}

// Discover doramas (Korean dramas)
async function fetchTmdbDorama(sort: string = 'popularity.desc'): Promise<TmdbResult[]> {
  try {
    const res = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_origin_country=KR&sort_by=${sort}`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB dorama:', e);
    return [];
  }
}

// Top rated doramas
async function fetchTmdbDoramaTopRated(): Promise<TmdbResult[]> {
  return fetchTmdbDorama('vote_average.desc&vote_count.gte=100');
}

// Recently released doramas
async function fetchTmdbDoramaRecent(): Promise<TmdbResult[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_origin_country=KR&sort_by=first_air_date.desc&first_air_date.lte=${today}&vote_count.gte=10`
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Erro TMDB dorama recent:', e);
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
      const [trendingMovies, popularMovies, topRatedMovies, upcomingMovies, trendingSeries, popularSeries, topRatedSeries, seriesAiringToday, animes, animesTopRated, animesRecent, animeAiringToday, doramas, doramasTopRated, doramasRecent, nowPlaying] = await Promise.all([
        fetchTmdbTrending('movie'),
        fetchTmdbPopular('movie'),
        fetchTmdbTopRatedMovies(),
        fetchTmdbUpcomingMovies(),
        fetchTmdbTrending('tv'),
        fetchTmdbPopular('tv'),
        fetchTmdbTopRatedSeries(),
        fetchTmdbSeriesAiringToday(),
        fetchTmdbAnime(),
        fetchTmdbAnimeTopRated(),
        fetchTmdbAnimeRecent(),
        fetchTmdbAnimeAiringToday(),
        fetchTmdbDorama(),
        fetchTmdbDoramaTopRated(),
        fetchTmdbDoramaRecent(),
        fetchTmdbNowPlaying(),
      ]);

      const movies = trendingMovies.map(m => tmdbToContentItem(m, 'movie'));
      const popularMovieItems = popularMovies.map(m => tmdbToContentItem(m, 'movie'));
      const topRatedMovieItems = topRatedMovies.map(m => tmdbToContentItem(m, 'movie'));
      const upcomingMovieItems = upcomingMovies.map(m => tmdbToContentItem(m, 'movie'));
      const series = trendingSeries.map(s => tmdbToContentItem(s, 'serie'));
      const popularSeriesItems = popularSeries.map(s => tmdbToContentItem(s, 'serie'));
      const topRatedSeriesItems = topRatedSeries.map(s => tmdbToContentItem(s, 'serie'));
      const seriesTodayItems = seriesAiringToday.map(s => tmdbToContentItem(s, 'serie'));
      const animeItems = animes.map(a => tmdbToContentItem(a, 'anime'));
      const animeTopItems = animesTopRated.map(a => tmdbToContentItem(a, 'anime'));
      const animeRecentItems = animesRecent.map(a => tmdbToContentItem(a, 'anime'));
      const animeTodayItems = animeAiringToday.map(a => tmdbToContentItem(a, 'anime'));
      const doramaItems = doramas.map(d => tmdbToContentItem(d, 'dorama'));
      const doramaTopItems = doramasTopRated.map(d => tmdbToContentItem(d, 'dorama'));
      const doramaRecentItems = doramasRecent.map(d => tmdbToContentItem(d, 'dorama'));
      const nowPlayingItems = nowPlaying.map(m => tmdbToContentItem(m, 'movie'));

      // Tag sections
      nowPlayingItems.forEach(item => { (item as any)._section = 'nowplaying'; });
      popularMovieItems.forEach(item => { (item as any)._section = 'movies_popular'; });
      topRatedMovieItems.forEach(item => { (item as any)._section = 'movies_top'; });
      upcomingMovieItems.forEach(item => { (item as any)._section = 'movies_upcoming'; });
      popularSeriesItems.forEach(item => { (item as any)._section = 'series_popular'; });
      topRatedSeriesItems.forEach(item => { (item as any)._section = 'series_top'; });
      seriesTodayItems.forEach(item => { (item as any)._section = 'series_today'; });
      animeTopItems.forEach(item => { (item as any)._section = 'anime_top'; });
      animeRecentItems.forEach(item => { (item as any)._section = 'anime_recent'; });
      animeTodayItems.forEach(item => { (item as any)._section = 'anime_today'; });
      doramaTopItems.forEach(item => { (item as any)._section = 'dorama_top'; });
      doramaRecentItems.forEach(item => { (item as any)._section = 'dorama_recent'; });

      content = [...movies, ...popularMovieItems, ...topRatedMovieItems, ...upcomingMovieItems, ...nowPlayingItems, ...series, ...popularSeriesItems, ...topRatedSeriesItems, ...seriesTodayItems, ...animeItems, ...animeTopItems, ...animeRecentItems, ...animeTodayItems, ...doramaItems, ...doramaTopItems, ...doramaRecentItems];
    } else if (category === 'movie') {
      const [trending, popular, topRated, upcoming, nowPlaying] = await Promise.all([
        fetchTmdbTrending('movie'),
        fetchTmdbPopular('movie'),
        fetchTmdbTopRatedMovies(),
        fetchTmdbUpcomingMovies(),
        fetchTmdbNowPlaying(),
      ]);
      const trendingItems = trending.map(m => tmdbToContentItem(m, 'movie'));
      const popularItems = popular.map(m => tmdbToContentItem(m, 'movie'));
      popularItems.forEach(item => { (item as any)._section = 'movies_popular'; });
      const topItems = topRated.map(m => tmdbToContentItem(m, 'movie'));
      topItems.forEach(item => { (item as any)._section = 'movies_top'; });
      const upcomingItems = upcoming.map(m => tmdbToContentItem(m, 'movie'));
      upcomingItems.forEach(item => { (item as any)._section = 'movies_upcoming'; });
      const nowPlayingItems = nowPlaying.map(m => tmdbToContentItem(m, 'movie'));
      nowPlayingItems.forEach(item => { (item as any)._section = 'nowplaying'; });
      content = [...trendingItems, ...popularItems, ...topItems, ...upcomingItems, ...nowPlayingItems];
    } else if (category === 'serie') {
      const [trending, popular, topRated, airingToday] = await Promise.all([
        fetchTmdbTrending('tv'),
        fetchTmdbPopular('tv'),
        fetchTmdbTopRatedSeries(),
        fetchTmdbSeriesAiringToday(),
      ]);
      const trendingItems = trending.map(s => tmdbToContentItem(s, 'serie'));
      const popularItems = popular.map(s => tmdbToContentItem(s, 'serie'));
      popularItems.forEach(item => { (item as any)._section = 'series_popular'; });
      const topItems = topRated.map(s => tmdbToContentItem(s, 'serie'));
      topItems.forEach(item => { (item as any)._section = 'series_top'; });
      const todayItems = airingToday.map(s => tmdbToContentItem(s, 'serie'));
      todayItems.forEach(item => { (item as any)._section = 'series_today'; });
      content = [...trendingItems, ...popularItems, ...topItems, ...todayItems];
    } else if (category === 'anime') {
      const [popular, topRated, recent, airingToday] = await Promise.all([
        fetchTmdbAnime(),
        fetchTmdbAnimeTopRated(),
        fetchTmdbAnimeRecent(),
        fetchTmdbAnimeAiringToday(),
      ]);
      const popularItems = popular.map(a => tmdbToContentItem(a, 'anime'));
      const topItems = topRated.map(a => tmdbToContentItem(a, 'anime'));
      topItems.forEach(item => { (item as any)._section = 'anime_top'; });
      const recentItems = recent.map(a => tmdbToContentItem(a, 'anime'));
      recentItems.forEach(item => { (item as any)._section = 'anime_recent'; });
      const todayItems = airingToday.map(a => tmdbToContentItem(a, 'anime'));
      todayItems.forEach(item => { (item as any)._section = 'anime_today'; });
      content = [...popularItems, ...topItems, ...recentItems, ...todayItems];
    } else if (category === 'dorama') {
      const [popular, topRated, recent] = await Promise.all([
        fetchTmdbDorama(),
        fetchTmdbDoramaTopRated(),
        fetchTmdbDoramaRecent(),
      ]);
      const popularItems = popular.map(d => tmdbToContentItem(d, 'dorama'));
      const topItems = topRated.map(d => tmdbToContentItem(d, 'dorama'));
      topItems.forEach(item => { (item as any)._section = 'dorama_top'; });
      const recentItems = recent.map(d => tmdbToContentItem(d, 'dorama'));
      recentItems.forEach(item => { (item as any)._section = 'dorama_recent'; });
      content = [...popularItems, ...topItems, ...recentItems];
    }

    return content;
  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    return [];
  }
}

export async function fetchCalendar(): Promise<CalendarItem[]> {
  try {
    // Fetch airing today and upcoming from TMDB directly (no proxy needed)
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const [airingRes, upcomingRes] = await Promise.all([
      fetch(`${TMDB_BASE}/tv/airing_today?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
      fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&air_date.gte=${today}&air_date.lte=${nextWeek}&sort_by=popularity.desc`),
    ]);

    const items: CalendarItem[] = [];

    if (airingRes.ok) {
      const data = await airingRes.json();
      (data.results || []).forEach((item: TmdbResult & { first_air_date?: string }) => {
        items.push({
          id: item.id.toString(),
          title: item.name || item.title || 'Sem título',
          poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : POSTER_FALLBACK,
          releaseDate: today,
          type: 'serie',
          status: 'Hoje' as const,
          backdropPath: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : undefined,
          tmdbId: item.id.toString(),
        });
      });
    }

    if (upcomingRes.ok) {
      const data = await upcomingRes.json();
      (data.results || []).forEach((item: TmdbResult & { first_air_date?: string }) => {
        const airDate = item.first_air_date || '';
        if (airDate && airDate !== today) {
          items.push({
            id: item.id.toString(),
            title: item.name || item.title || 'Sem título',
            poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : POSTER_FALLBACK,
            releaseDate: airDate,
            type: 'serie',
            status: 'Futuro' as const,
            backdropPath: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : undefined,
            tmdbId: item.id.toString(),
          });
        }
      });
    }

    // Sort by date
    items.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    return items;
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
  options?: { color?: string; transparent?: boolean; noEpList?: boolean },
  player: 1 | 2 = 1
): string {
  if (player === 2) {
    const BASE = 'https://www.primevicio.lat/embed';
    if (type === 'movie') {
      return `${BASE}/movie/${id}`;
    } else {
      let url = `${BASE}/tv/${id}`;
      if (season) {
        url += `/${season}`;
        if (episode) url += `/${episode}`;
      }
      return url;
    }
  }

  // Superflix player (default)
  const API_BASE = 'https://superflixapi.help';
  let url = '';
  
  if (type === 'movie') {
    url = `${API_BASE}/filme/${id}`;
  } else {
    url = `${API_BASE}/serie/${id}`;
    if (season) {
      url += `/${season}`;
      if (episode) url += `/${episode}`;
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

// ============= TVmaze Integration =============

export interface SeasonInfo {
  season_number: number;
  episode_count: number;
  name: string;
}

export async function fetchTVMazeSeasons(tmdbId: string): Promise<SeasonInfo[]> {
  try {
    // Step 1: Get IMDB ID from TMDB
    const extRes = await fetch(
      `${TMDB_BASE}/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
    );
    if (!extRes.ok) throw new Error(`TMDB external_ids ${extRes.status}`);
    const extData = await extRes.json();
    const imdbId = extData.imdb_id;
    if (!imdbId) throw new Error('No IMDB ID found');

    // Step 2: Lookup show on TVmaze via IMDB ID
    const lookupRes = await fetch(
      `https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`
    );
    if (!lookupRes.ok) throw new Error(`TVmaze lookup ${lookupRes.status}`);
    const showData = await lookupRes.json();
    const tvmazeId = showData.id;

    // Step 3: Fetch seasons and episodes in parallel (2 requests only)
    const [seasonsRes, episodesRes] = await Promise.all([
      fetch(`https://api.tvmaze.com/shows/${tvmazeId}/seasons`),
      fetch(`https://api.tvmaze.com/shows/${tvmazeId}/episodes?specials=0`),
    ]);

    if (!seasonsRes.ok) throw new Error(`TVmaze seasons ${seasonsRes.status}`);
    const seasonsData = await seasonsRes.json();

    // Count episodes per season from the episodes list
    const epCountMap: Record<number, number> = {};
    if (episodesRes.ok) {
      const episodesData = await episodesRes.json();
      for (const ep of episodesData) {
        if (ep.season && ep.season > 0) {
          epCountMap[ep.season] = (epCountMap[ep.season] || 0) + 1;
        }
      }
    }

    // Filter out specials (season 0) and merge episode counts
    const seasons: SeasonInfo[] = seasonsData
      .filter((s: any) => s.number > 0)
      .map((s: any) => ({
        season_number: s.number,
        episode_count: s.episodeOrder || epCountMap[s.number] || 0,
        name: s.name || `Temporada ${s.number}`,
      }));

    return seasons;
  } catch (e) {
    console.error('Erro TVmaze seasons:', e);
    return [];
  }
}
