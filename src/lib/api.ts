import { ContentItem, ContentType, CalendarItem } from '@/types/content';

const FALLBACK_BACKEND_URL = 'https://xfqocptliyukeypvylom.supabase.co';
const RAW_BACKEND_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const BACKEND_URL = RAW_BACKEND_URL && /^https?:\/\//.test(RAW_BACKEND_URL) ? RAW_BACKEND_URL.replace(/\/+$/, '') : FALLBACK_BACKEND_URL;
const TMDB_PROXY = `${BACKEND_URL}/functions/v1/tmdb`;

export function tmdbUrl(path: string, query: string = ''): string {
  const qs = query ? `&${query.replace(/^[?&]/, '')}` : '';
  return `${TMDB_PROXY}?path=${encodeURIComponent(path)}${qs}`;
}
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

interface TmdbResult { id: number; title?: string; name?: string; poster_path?: string | null; backdrop_path?: string | null; release_date?: string; first_air_date?: string; vote_average?: number; overview?: string; }

async function fetchTmdb(path: string, query = ''): Promise<TmdbResult[]> { try { const res = await fetch(tmdbUrl(path, query)); if (!res.ok) throw new Error(`TMDB ${res.status}`); const data = await res.json(); return data.results || []; } catch (e) { console.error('TMDB error:', e); return []; } }
async function fetchTmdbTrending(mediaType: 'movie' | 'tv') { return fetchTmdb(`/trending/${mediaType}/week`, 'language=pt-BR'); }
async function fetchTmdbPopular(mediaType: 'movie' | 'tv', page = 1) { return fetchTmdb(`/${mediaType}/popular`, `language=pt-BR&page=${page}`); }
async function fetchTmdbNowPlaying() { return fetchTmdb('/movie/now_playing', 'language=pt-BR&region=BR'); }
async function fetchTmdbTopRatedMovies() { return fetchTmdb('/movie/top_rated', 'language=pt-BR&region=BR'); }
async function fetchTmdbUpcomingMovies() { return fetchTmdb('/movie/upcoming', 'language=pt-BR&region=BR'); }
async function fetchTmdbSeriesAiringToday() { return fetchTmdb('/tv/airing_today', 'language=pt-BR'); }
async function fetchTmdbTopRatedSeries() { return fetchTmdb('/tv/top_rated', 'language=pt-BR'); }
async function fetchTmdbAnime(sort = 'popularity.desc') { return fetchTmdb('/discover/tv', `language=pt-BR&with_genres=16&with_origin_country=JP&sort_by=${sort}`); }
async function fetchTmdbAnimeAiringToday() { const today = new Date().toISOString().split('T')[0]; return fetchTmdb('/discover/tv', `language=pt-BR&with_genres=16&with_origin_country=JP&air_date.gte=${today}&air_date.lte=${today}&sort_by=popularity.desc`); }
async function fetchTmdbAnimeRecent() { const today = new Date().toISOString().split('T')[0]; return fetchTmdb('/discover/tv', `language=pt-BR&with_genres=16&with_origin_country=JP&sort_by=first_air_date.desc&first_air_date.lte=${today}&vote_count.gte=10`); }
async function fetchTmdbDorama(sort = 'popularity.desc') { return fetchTmdb('/discover/tv', `language=pt-BR&with_origin_country=KR&sort_by=${sort}`); }
async function fetchTmdbDoramaRecent() { const today = new Date().toISOString().split('T')[0]; return fetchTmdb('/discover/tv', `language=pt-BR&with_origin_country=KR&sort_by=first_air_date.desc&first_air_date.lte=${today}&vote_count.gte=10`); }

const POSTER_FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop';
function tmdbToContentItem(item: TmdbResult, type: ContentType): ContentItem { return { id: item.id.toString(), title: item.title || item.name || 'Sem título', poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : POSTER_FALLBACK, backdrop: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : undefined, type, year: (item.release_date || item.first_air_date || '').substring(0, 4), rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined, overview: item.overview }; }

export async function fetchCalendar(): Promise<CalendarItem[]> {
  try {
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    // Requisições em paralelo (antes eram sequenciais: 7x mais lento)
    const results = await Promise.all(dates.map(async dateStr => {
      try {
        const res = await fetch(tmdbUrl('/discover/tv', `language=pt-BR&first_air_date.gte=${dateStr}&first_air_date.lte=${dateStr}&sort_by=popularity.desc`));
        if (!res.ok) return [] as CalendarItem[];
        const data = await res.json();
        return (data.results || []).slice(0, 10).map((r: any) => ({
          id: r.id.toString(),
          title: r.name || r.title,
          poster: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : POSTER_FALLBACK,
          type: 'serie' as const,
          releaseDate: dateStr,
        }));
      } catch { return [] as CalendarItem[]; }
    }));
    const seen = new Set<string>();
    return results.flat().filter(item => !seen.has(item.id) && seen.add(item.id));
  } catch { return []; }
}


export async function fetchContent(category: ContentType = 'all', query?: string): Promise<ContentItem[]> {
  try {
    if (query) { const res = await fetch(tmdbUrl('/search/multi', `language=pt-BR&query=${encodeURIComponent(query)}`)); if (!res.ok) return []; const data = await res.json(); return (data.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv').map((r: any) => tmdbToContentItem(r, r.media_type === 'movie' ? 'movie' : 'serie')); }
    const [movies, popularMovies, topMovies, upcoming, series, popularSeries, topSeries, todaySeries, anime, animeTop, animeRecent, animeToday, dorama, doramaTop, doramaRecent, nowPlaying] = await Promise.all([fetchTmdbTrending('movie'), fetchTmdbPopular('movie'), fetchTmdbTopRatedMovies(), fetchTmdbUpcomingMovies(), fetchTmdbTrending('tv'), fetchTmdbPopular('tv'), fetchTmdbTopRatedSeries(), fetchTmdbSeriesAiringToday(), fetchTmdbAnime(), fetchTmdbAnime('vote_average.desc&vote_count.gte=200'), fetchTmdbAnimeRecent(), fetchTmdbAnimeAiringToday(), fetchTmdbDorama(), fetchTmdbDorama('vote_average.desc&vote_count.gte=100'), fetchTmdbDoramaRecent(), fetchTmdbNowPlaying()]);
    const map = (xs: TmdbResult[], type: ContentType) => xs.map(x => tmdbToContentItem(x, type));
    const all = [...map(movies,'movie'), ...map(popularMovies,'movie'), ...map(topMovies,'movie'), ...map(upcoming,'movie'), ...map(nowPlaying,'movie'), ...map(series,'serie'), ...map(popularSeries,'serie'), ...map(topSeries,'serie'), ...map(todaySeries,'serie'), ...map(anime,'anime'), ...map(animeTop,'anime'), ...map(animeRecent,'anime'), ...map(animeToday,'anime'), ...map(dorama,'dorama'), ...map(doramaTop,'dorama'), ...map(doramaRecent,'dorama')];
    // Remove duplicados (mesmo item aparece em trending/popular/top) para evitar keys repetidas no React
    const seen = new Set<string>();
    return all.filter(item => { const k = `${item.type}-${item.id}`; if (seen.has(k)) return false; seen.add(k); return true; });
  } catch { return []; }
}

export interface SeasonInfo { season_number: number; episode_count: number; name?: string; }
export async function fetchTVMazeSeasons(id: string): Promise<SeasonInfo[]> { try { const res = await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}/seasons`); if (!res.ok) return []; const data = await res.json(); return (data || []).map((s: any) => ({ season_number: s.number, episode_count: s.episodeOrder || 1, name: s.name })); } catch { return []; } }

export function getPlayerUrl(id: string, type: 'movie' | 'serie', season?: number, episode?: number, options?: { color?: string; transparent?: boolean; noEpList?: boolean }, player: 1 | 2 = 1): string {
  const SUPERFLIX_BASE = 'https://superflixapi.sbs';
  let url = type === 'movie' ? `${SUPERFLIX_BASE}/filme/${id}` : `${SUPERFLIX_BASE}/serie/${id}${season ? `/${season}` : ''}${episode ? `/${episode}` : ''}`;
  const params: string[] = []; if (options?.noEpList) params.push('noEpList'); if (options?.transparent) params.push('transparent'); if (options?.color) params.push(`color:${options.color.replace('#','')}`); if (params.length) url += `#${params.join('#')}`; return url;
}

export interface DirectStream { streamUrl: string; referer?: string; kind?: 'hls' | 'dash' | 'mp4' | 'unknown'; }
export function playbackProxyUrl(streamUrl: string, referer?: string): string { const base = `${BACKEND_URL}/functions/v1/playback-proxy`; const params = new URLSearchParams({ url: streamUrl }); if (referer) params.set('referer', referer); return `${base}?${params.toString()}`; }
export async function getDirectStreamUrl(sourceUrl: string): Promise<DirectStream | null> { try { console.log('Extracting from:', sourceUrl); const res = await fetch(`${BACKEND_URL}/functions/v1/extract-stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: sourceUrl }) }); if (!res.ok) { console.error('Extraction request failed:', res.status); return null; } const data = await res.json(); console.log('Extraction result:', data); if (!data || !data.streamUrl) return null; return data; } catch (e) { console.error('Extraction exception:', e); return null; } }
