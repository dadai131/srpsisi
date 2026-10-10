import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { allowedUrl, publicUrl, candidates, extractUrls, extractPages, embedplayIds, expiresAt, rewritePlaylist, m3uEntries } from './resolver.js';

// Assinatura HMAC: só URLs encontradas pelo próprio extrator podem passar pelo proxy fora da allowlist.
const SIGN_KEY = (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || 'loki-player3';
let keyPromise: Promise<CryptoKey> | null = null;
async function sign(url: string) {
  keyPromise ??= crypto.subtle.importKey('raw', new TextEncoder().encode(SIGN_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await keyPromise, new TextEncoder().encode(url)));
  return [...mac.slice(0, 16)].map(b => b.toString(16).padStart(2, '0')).join('');
}

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
async function upstream(url: string, referer: string, range?: string | null, allow: (u: string) => boolean = allowedUrl) {
  for (let hop = 0; hop < 5; hop++) {
    if (!allow(url)) throw new Error('Unsupported upstream host');
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
async function imdbFallback(source: string): Promise<string | null> {
  try {
    const u = new URL(source);
    const m = u.pathname.match(/^\/(filme|serie)\/(\d{1,12})(?:\/(\d{1,4})\/(\d{1,4}))?\/?$/);
    if (!m) return null;
    const key = Deno.env.get('TMDB_API_KEY');
    if (!key) return null;
    const media = m[1] === 'filme' ? 'movie' : 'tv';
    const res = await fetch(`https://api.themoviedb.org/3/${media}/${m[2]}/external_ids?api_key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const imdb = (await res.json())?.imdb_id;
    return typeof imdb === 'string' && /^tt\d{5,12}$/.test(imdb) && media === 'movie'
      ? `https://www.embedplay.one/filme/${imdb}` : null;
  } catch { return null; }
}
async function extract(source: string) {
  // Fontes em sequência; a primeira que achar vídeo válido retorna na hora.
  const end = Date.now() + 45000;
  const sources = candidates(source);
  const imdb = await imdbFallback(source);
  if (imdb && !sources.includes(imdb)) sources.push(imdb);
  for (const start of sources) {
    if (Date.now() >= end) break;
    const found = await extractFrom(start, Math.min(end, Date.now() + 15000));
    if (found) return found;
  }
  return null;
}
async function embedplayPlayers(pageUrl: string, html: string) {
  const out: string[] = [];
  for (const id of embedplayIds(html).slice(0, 4)) {
    try {
      const r = await fetch('https://www.embedplay.one/api', { method: 'POST', signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': UA, Referer: pageUrl, Origin: 'https://www.embedplay.one', 'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ action: 'getPlayer', video_id: id }) });
      const u = (await r.json())?.data?.video_url;
      if (typeof u === 'string' && publicUrl(u)) out.push(u);
    } catch { /* next */ }
  }
  return out;
}
async function extractFrom(startUrl: string, deadline: number) {
  // V2: segue iframes/páginas de player (crawl_embeds) até 3 níveis, sem executar JS.
  const queue: [string, number][] = [[startUrl, 1]];
  const visited = new Set<string>();
  const trusted = new Set<string>(); // hosts descobertos neste crawl
  const isTrusted = (u: string) => { try { return trusted.has(new URL(u).hostname); } catch { return false; } };
  while (queue.length && visited.size < 10 && Date.now() < deadline) {
    const [page, depth] = queue.shift()!;
    if (visited.has(page)) continue;
    visited.add(page);
    try {
      const loaded = await upstream(page, depth === 1 ? REFERER : page, null, u => allowedUrl(u) || publicUrl(u));
      if (!loaded.response.ok) { await loaded.response.body?.cancel(); continue; }
      const html = await readText(loaded.response);
      trusted.add(new URL(loaded.url).hostname);
      const referer = depth === 1 ? REFERER : loaded.url;
      const streams: string[] = extractUrls(html, loaded.url, isTrusted).slice(0, 8);
      const checkedStreams = new Set<string>();
      for (let i = 0; i < streams.length && i < 20; i++) {
        const stream = streams[i];
        if (checkedStreams.has(stream)) continue;
        checkedStreams.add(stream);
        try {
          let kind: 'hls' | 'mp4' = /\.m3u8?(?:[?#]|$)/i.test(stream) || /[?&]file=[^&]*\.m3u8(?:&|$)/i.test(stream) ? 'hls' : 'mp4';
          const allow = (u: string) => allowedUrl(u) || publicUrl(u);
          const media = await upstream(stream, referer, kind === 'mp4' ? 'bytes=0-4095' : null, allow);
          if (!media.response.ok) { await media.response.body?.cancel(); continue; }
          let expiry = expiresAt(stream);
          const ct = media.response.headers.get('content-type') || '';
          if (/mpegurl/i.test(ct)) kind = 'hls';
          if (kind === 'hls' || !/video|octet/i.test(ct)) {
            const text = await readText(media.response);
            if (text.trimStart().startsWith('#EXTM3U') && !/#EXT-X-/i.test(text)) {
              // M3U is a list, not a playable HLS manifest. Resolve a permitted media entry.
              for (const entry of m3uEntries(text, media.url, allow)) if (!checkedStreams.has(entry) && !streams.includes(entry)) streams.push(entry);
              continue;
            }
            if (text.trimStart().startsWith('#EXTM3U')) {
              kind = 'hls';
              expiry = expiresAt(text) ?? expiry;
            } else if (kind === 'hls' || /html|json|text/i.test(ct)) continue;
          } else {
            await media.response.body?.cancel();
          }
          if (expiry && expiry <= Date.now()) continue;
          const streamUrl = kind === 'mp4' ? stream : media.url;
          return { streamUrl, kind, referer, expiresAt: expiry, source: new URL(page).hostname,
            ...(allowedUrl(streamUrl) ? {} : { sig: await sign(streamUrl) }) };
        } catch { /* Try next stream. */ }
      }
      if (depth === 1 && /embedplay\.one$/.test(new URL(loaded.url).hostname))
        for (const p of await embedplayPlayers(loaded.url, html)) queue.unshift([p, 2]);
      if (depth < 3) for (const next of extractPages(html, loaded.url)) if (!visited.has(next)) queue.push([next, depth + 1]);
    } catch { /* Try next page, including on timeout. */ }
  }
  return null;
}
async function proxy(target: string, req: Request) {
  const params = new URL(req.url).searchParams;
  const signed = publicUrl(target) && params.get('sig') === await sign(target);
  if (!allowedUrl(target) && !signed) return json({ error: 'URL de mídia não permitida' }, 400);
  const ref = params.get('referer');
  const referer = ref && publicUrl(ref) ? ref : REFERER;
  const allow = (u: string) => allowedUrl(u) || (signed && publicUrl(u));
  const { response, url } = await upstream(target, referer, req.headers.get('range'), allow);
  if (!response.ok) { await response.body?.cancel(); return json({ error: 'Fonte indisponível' }, response.status); }
  const ct = response.headers.get('content-type') || '';
  if (/mpegurl/i.test(ct) || /\.m3u8/i.test(url)) {
    const body = await readText(response);
    if (!body.trimStart().startsWith('#EXTM3U')) return json({ error: 'Playlist inválida' }, 502);
    const endpoint = new URL(req.url); endpoint.search = '';
    const lines = body.split(/\r?\n/);
    const sigs = new Map<string, string>();
    rewritePlaylist(body, url, (uri: string) => { if (!allowedUrl(uri)) sigs.set(uri, ''); return uri; }, allow);
    for (const uri of sigs.keys()) sigs.set(uri, await sign(uri));
    const refQs = referer !== REFERER ? `&referer=${encodeURIComponent(referer)}` : '';
    const rewritten = rewritePlaylist(lines.join('\n'), url, (uri: string) => `${endpoint}?proxy=${encodeURIComponent(uri)}${sigs.has(uri) ? `&sig=${sigs.get(uri)}` : ''}${refQs}`, allow);
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
