// Player 3 Xtream-only bridge. Maps the site's TMDB id to the provider's real VOD/episode id.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};
const HOST = (Deno.env.get('XTREAM_HOST') || 'https://xlionone.ultrapw.fun').replace(/\/+$/, '');
const USER = Deno.env.get('XTREAM_USER') || '277273986';
const PASS = Deno.env.get('XTREAM_PASS') || '559524926';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' },
});
const api = (action: string, extra = '') =>
  `${HOST}/player_api.php?username=${encodeURIComponent(USER)}&password=${encodeURIComponent(PASS)}&action=${action}${extra}`;

function tmdbOf(item: any): string {
  const values = [item?.tmdb, item?.tmdb_id, item?.tmdbId, item?.info?.tmdb, item?.info?.tmdb_id];
  for (const value of values) if (/^\d{1,12}$/.test(String(value ?? ''))) return String(Number(value));
  return '';
}
async function fetchJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Xtream API ${res.status}`);
  return await res.json();
}
async function resolveMovie(tmdbId: string) {
  const list = await fetchJson(api('get_vod_streams'));
  if (!Array.isArray(list)) return null;
  const item = list.find((x: any) => tmdbOf(x) === tmdbId);
  if (!item?.stream_id) return null;
  return { id: String(item.stream_id), ext: String(item.container_extension || 'mp4').replace(/[^a-z0-9]/gi, '') || 'mp4' };
}
async function resolveEpisode(tmdbId: string, season: number, episode: number) {
  const list = await fetchJson(api('get_series'));
  if (!Array.isArray(list)) return null;
  const series = list.find((x: any) => tmdbOf(x) === tmdbId);
  if (!series?.series_id) return null;
  const info = await fetchJson(api('get_series_info', `&series_id=${encodeURIComponent(series.series_id)}`));
  const episodes = info?.episodes?.[String(season)] || info?.episodes?.[season] || [];
  const ep = episodes.find((x: any) => Number(x?.episode_num ?? x?.episode) === episode) || episodes[episode - 1];
  if (!ep?.id) return null;
  const ext = String(ep?.container_extension || ep?.info?.container_extension || 'mp4').replace(/[^a-z0-9]/gi, '') || 'mp4';
  return { id: String(ep.id), ext };
}
async function proxyMedia(req: Request, kind: 'movie' | 'series', vod: string, ext: string) {
  if (!/^\d{1,12}$/.test(vod) || !/^[a-z0-9]{2,5}$/i.test(ext)) return json({ error: 'ID de mídia inválido' }, 400);
  const range = req.headers.get('range');
  const upstream = await fetch(`${HOST}/${kind}/${encodeURIComponent(USER)}/${encodeURIComponent(PASS)}/${vod}.${ext}`, {
    redirect: 'follow', signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0', ...(range ? { Range: range } : {}) },
  });
  const headers = new Headers(cors);
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(name); if (value) headers.set(name, value);
  }
  if (!headers.has('content-type')) headers.set('content-type', ext === 'm3u8' ? 'application/vnd.apple.mpegurl' : 'video/mp4');
  return new Response(upstream.body, { status: upstream.status, headers });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = new URL(req.url);
    if (req.method === 'GET') {
      const vod = url.searchParams.get('vod') || '';
      const ext = url.searchParams.get('ext') || 'mp4';
      const kind = url.searchParams.get('kind') === 'series' ? 'series' : 'movie';
      return await proxyMedia(req, kind, vod, ext);
    }
    if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

    const body = await req.json().catch(() => null);
    const tmdbId = String(Number(body?.tmdbId || 0));
    const type = body?.type === 'serie' ? 'serie' : 'movie';
    const season = Number(body?.season || 1), episode = Number(body?.episode || 1);
    if (!/^\d{1,12}$/.test(tmdbId)) return json({ error: 'TMDB ID inválido' }, 400);

    const resolved = type === 'movie'
      ? await resolveMovie(tmdbId)
      : await resolveEpisode(tmdbId, season, episode);
    if (!resolved) return json({ error: 'Conteúdo não encontrado no catálogo Xtream', streamUrl: null }, 404);

    const kind = type === 'movie' ? 'movie' : 'series';
    const endpoint = new URL(req.url);
    endpoint.search = '';
    endpoint.searchParams.set('vod', resolved.id);
    endpoint.searchParams.set('ext', resolved.ext);
    endpoint.searchParams.set('kind', kind);
    return json({ streamUrl: endpoint.toString(), kind: resolved.ext === 'm3u8' ? 'hls' : 'mp4', source: 'xtream', streamId: resolved.id });
  } catch (e) {
    return json({ error: `Falha no Xtream: ${(e as Error).message}` }, 502);
  }
});
