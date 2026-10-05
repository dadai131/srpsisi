import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { allowedUrl, candidates, extractUrls, expiresAt, rewritePlaylist } from './resolver.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36';
const REFERER = 'https://lokifilms.qzz.io/';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

// Check every redirect; this public endpoint must not become an arbitrary URL proxy.
async function upstream(url: string, referer: string, range?: string | null) {
  for (let hop = 0; hop < 5; hop++) {
    if (!allowedUrl(url)) throw new Error('Unsupported upstream host');
    const response = await fetch(url, {
      redirect: 'manual', signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': UA, Referer: referer, Origin: new URL(referer).origin,
        Accept: '*/*', ...(range ? { Range: range } : {}) },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new Error('Missing redirect');
      url = new URL(location, url).href;
      continue;
    }
    return { response, url };
  }
  throw new Error('Too many redirects');
}
async function readText(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) throw new Error('Document too large');
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { await reader.cancel(); }
}
async function extract(source: string) {
  for (const page of candidates(source)) {
    try {
      const loaded = await upstream(page, REFERER);
      if (!loaded.response.ok) { await loaded.response.body?.cancel(); continue; }
      const html = await readText(loaded.response);
      for (const stream of extractUrls(html, loaded.url).slice(0, 8)) {
        try {
          const kind = /\.m3u8/i.test(stream) ? 'hls' : 'mp4';
          const media = await upstream(stream, REFERER, kind === 'mp4' ? 'bytes=0-4095' : null);
          if (!media.response.ok) { await media.response.body?.cancel(); continue; }
          let expiry = expiresAt(stream);
          if (kind === 'hls') {
            const playlist = await readText(media.response);
            if (!playlist.trimStart().startsWith('#EXTM3U')) continue;
            expiry = expiresAt(playlist) ?? expiry;
            // Validate nested hosts before returning an unusable playlist.
            rewritePlaylist(playlist, media.url, (url: string) => url);
          } else {
            const ct = media.response.headers.get('content-type') || '';
            await media.response.body?.cancel();
            if (/html|json/i.test(ct)) continue;
          }
          if (expiry && expiry <= Date.now()) continue;
          return { streamUrl: kind === 'mp4' ? stream : media.url, kind, referer: REFERER, expiresAt: expiry, source: new URL(page).hostname };
        } catch { /* Try next stream. */ }
      }
    } catch { /* Try next provider, including on timeout. */ }
  }
  return null;
}
async function proxy(target: string, req: Request) {
  if (!allowedUrl(target)) return json({ error: 'URL de mídia não permitida' }, 400);
  const { response, url } = await upstream(target, REFERER, req.headers.get('range'));
  if (!response.ok) { await response.body?.cancel(); return json({ error: 'Fonte indisponível' }, response.status); }
  const ct = response.headers.get('content-type') || '';
  if (/mpegurl/i.test(ct) || /\.m3u8/i.test(url)) {
    const body = await readText(response);
    if (!body.trimStart().startsWith('#EXTM3U')) return json({ error: 'Playlist inválida' }, 502);
    const endpoint = new URL(req.url); endpoint.search = '';
    const rewritten = rewritePlaylist(body, url, (uri: string) => `${endpoint}?proxy=${encodeURIComponent(uri)}`);
    return new Response(rewritten, { headers: { ...corsHeaders, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' } });
  }
  const headers = new Headers(corsHeaders);
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = response.headers.get(name); if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
}
serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const target = new URL(req.url).searchParams.get('proxy');
    if (target && req.method === 'GET') return await proxy(target, req);
    if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
    const body = await req.json().catch(() => null);
    let sourceUrl = body?.url;
    if (body?.id !== undefined) {
      if (!/^\d{1,12}$/.test(String(body.id)) || !['movie', 'serie'].includes(body.type)) return json({ error: 'ID inválido' }, 400);
      const season = body.season ?? 1, episode = body.episode ?? 1;
      if (body.type === 'serie' && (![season, episode].every(value => Number.isInteger(value) && value > 0 && value < 10000))) return json({ error: 'Episódio inválido' }, 400);
      sourceUrl = body.type === 'movie' ? `https://mgeb.top/filme/${body.id}` : `https://mgeb.top/serie/${body.id}/${season}/${episode}`;
    }
    if (typeof sourceUrl !== 'string') return json({ error: 'URL inválida' }, 400);
    try { candidates(sourceUrl); } catch { return json({ error: 'Conteúdo inválido' }, 400); }
    const result = await extract(sourceUrl);
    return json(result || { streamUrl: null, error: 'Nenhuma fonte disponível para este conteúdo.' });
  } catch {
    return json({ error: 'Não foi possível consultar a fonte.' }, 502);
  }
});
