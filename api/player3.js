const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
}

function json(res, body, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function authFromEnv() {
  const host = String(process.env.XTREAM_HOST || '').replace(/\/+$/, '');
  const user = String(process.env.XTREAM_USER || '');
  const pass = String(process.env.XTREAM_PASS || '');
  return { host, user, pass };
}

function isConfigured(auth) {
  return Boolean(auth.host && auth.user && auth.pass && /^https?:\/\//i.test(auth.host));
}

function apiUrl(auth, action, extra = '') {
  return `${auth.host}/player_api.php?username=${encodeURIComponent(auth.user)}&password=${encodeURIComponent(auth.pass)}&action=${action}${extra}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Xtream API ${response.status}`);
  return await response.json();
}

function tmdbOf(item) {
  const values = [item?.tmdb, item?.tmdb_id, item?.tmdbId, item?.info?.tmdb, item?.info?.tmdb_id];
  for (const value of values) {
    if (/^\d{1,12}$/.test(String(value ?? ''))) return String(Number(value));
  }
  return '';
}

function normalizeTitle(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function posterKey(value) {
  return String(value || '').match(/\/([A-Za-z0-9]+)\.(?:jpg|png|webp)/)?.[1] || '';
}

async function tmdbMeta(kind, id) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;

  const read = async language => {
    const url = `https://api.themoviedb.org/3/${kind}/${id}?api_key=${key}&language=${language}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return response.ok ? await response.json() : null;
  };

  const [pt, en] = await Promise.all([read('pt-BR'), read('en-US')]);
  const data = pt || en;
  if (!data) return null;

  const date = data.release_date || data.first_air_date || '';
  const titles = [pt?.title, pt?.name, en?.title, en?.name, data.original_title, data.original_name]
    .filter(Boolean)
    .map(normalizeTitle);
  const posters = [pt?.poster_path, en?.poster_path].filter(Boolean).map(posterKey).filter(Boolean);

  return { year: date.slice(0, 4), titles: [...new Set(titles)], posters };
}

function matchItem(list, meta, iconField) {
  if (!meta) return null;

  const byPoster = list.find(item => {
    const key = posterKey(item?.[iconField]);
    return key && meta.posters.includes(key);
  });
  if (byPoster) return byPoster;

  const parse = item => {
    const raw = String(item?.name || item?.title || '');
    const match = raw.match(/^(.*?)\s*[-(]\s*(\d{4})\)?\s*$/);
    return {
      title: normalizeTitle(match ? match[1] : raw),
      year: match?.[2] || String(item?.year || item?.releaseDate || '').slice(0, 4),
    };
  };

  return list.find(item => {
    const parsed = parse(item);
    return meta.titles.includes(parsed.title) && (!meta.year || !parsed.year || parsed.year === meta.year);
  }) || list.find(item => meta.titles.includes(parse(item).title)) || null;
}

async function resolveMovie(auth, tmdbId) {
  const [list, meta] = await Promise.all([
    fetchJson(apiUrl(auth, 'get_vod_streams')),
    tmdbMeta('movie', tmdbId),
  ]);
  if (!Array.isArray(list)) return null;

  const item = list.find(candidate => tmdbOf(candidate) === tmdbId) || matchItem(list, meta, 'stream_icon');
  if (!item?.stream_id) return null;

  return {
    id: String(item.stream_id),
    ext: String(item.container_extension || 'ts').replace(/[^a-z0-9]/gi, '') || 'ts',
    kind: 'movie',
  };
}

async function resolveEpisode(auth, tmdbId, season, episode) {
  const [list, meta] = await Promise.all([
    fetchJson(apiUrl(auth, 'get_series')),
    tmdbMeta('tv', tmdbId),
  ]);
  if (!Array.isArray(list)) return null;

  const series = list.find(candidate => tmdbOf(candidate) === tmdbId) || matchItem(list, meta, 'cover');
  if (!series?.series_id) return null;

  const info = await fetchJson(apiUrl(auth, 'get_series_info', `&series_id=${encodeURIComponent(series.series_id)}`));
  const episodes = info?.episodes?.[String(season)] || info?.episodes?.[season] || [];
  const found = episodes.find(item => Number(item?.episode_num ?? item?.episode) === episode) || episodes[episode - 1];
  if (!found?.id) return null;

  return {
    id: String(found.id),
    ext: String(found?.container_extension || found?.info?.container_extension || 'ts').replace(/[^a-z0-9]/gi, '') || 'ts',
    kind: 'series',
  };
}

async function proxyMedia(req, res, auth) {
  const vod = String(req.query.vod || '');
  const ext = String(req.query.ext || 'ts').replace(/[^a-z0-9]/gi, '') || 'ts';
  const kind = req.query.kind === 'series' ? 'series' : 'movie';

  if (!/^\d{1,12}$/.test(vod) || !/^[a-z0-9]{2,5}$/i.test(ext)) {
    return json(res, { error: 'ID de midia invalido' }, 400);
  }

  const streamUrl = `${auth.host}/${kind}/${encodeURIComponent(auth.user)}/${encodeURIComponent(auth.pass)}/${vod}.${ext}`;
  const headers = { 'User-Agent': UA, Accept: '*/*' };
  if (req.headers.range) headers.Range = req.headers.range;

  const upstream = await fetch(streamUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers,
  });

  res.status(upstream.status);
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  if (!res.getHeader('content-type')) {
    res.setHeader('content-type', ext === 'm3u8' ? 'application/vnd.apple.mpegurl' : 'video/mp4');
  }

  if (!upstream.body) return res.end();
  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) await new Promise(resolve => res.once('drain', resolve));
    }
  } finally {
    res.end();
    reader.releaseLock();
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = authFromEnv();
  if (!isConfigured(auth)) return json(res, { error: 'Xtream nao configurado no backend' }, 503);

  try {
    if (req.method === 'GET') return await proxyMedia(req, res, auth);
    if (req.method !== 'POST') return json(res, { error: 'Metodo nao permitido' }, 405);

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const tmdbId = String(Number(body.tmdbId || body.id || 0));
    const type = body.type === 'serie' || body.type === 'anime' || body.type === 'dorama' ? 'serie' : 'movie';
    const season = Number(body.season || 1);
    const episode = Number(body.episode || 1);

    if (!/^\d{1,12}$/.test(tmdbId) || !Number.isInteger(season) || !Number.isInteger(episode) || season < 1 || season > 200 || episode < 1 || episode > 5000) {
      return json(res, { error: 'Parametros invalidos' }, 400);
    }

    const resolved = type === 'movie'
      ? await resolveMovie(auth, tmdbId)
      : await resolveEpisode(auth, tmdbId, season, episode);

    if (!resolved) return json(res, { error: 'Conteudo nao encontrado no catalogo Xtream', streamUrl: null }, 404);

    const params = new URLSearchParams({ vod: resolved.id, ext: 'ts', kind: resolved.kind });
    return json(res, {
      streamUrl: `/api/player3?${params.toString()}`,
      kind: 'mp4',
      source: 'xtream',
      streamId: resolved.id,
    });
  } catch (error) {
    console.error('Player 3 Xtream error:', error);
    return json(res, { error: `Falha no Xtream: ${error.message}` }, 502);
  }
}
