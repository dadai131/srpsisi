import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const BASE = 'https://superflixapi.sbs';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

type Kind = 'hls' | 'mp4' | 'dash';

/* ------------------------------------------------------------------ *
 * Etapa 1 — página do embed: contentid + page_token
 * ------------------------------------------------------------------ */
interface PageCtx { html: string; pageToken: string; contentId: string; pageUrl: string; }

async function loadEmbedPage(pageUrl: string): Promise<PageCtx | null> {
  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': UA,
      'Referer': `${BASE}/`,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'follow',
  });
  if (!res.ok) { console.log('embed page falhou', pageUrl, res.status); return null; }
  const html = await res.text();
  const pageToken =
    html.match(/page_token["'\s:=]+["']([A-Za-z0-9._-]{40,})["']/)?.[1] ??
    html.match(/name=["']page_token["']\s+(?:content|value)=["']([^"']+)["']/)?.[1] ??
    html.match(/["']pageToken["']\s*:\s*["']([^"']+)["']/)?.[1] ??
    html.match(/(eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,})/)?.[1] ?? '';
  const contentId =
    html.match(/contentid["'\s:=]+["']?(\d{2,10})/i)?.[1] ??
    html.match(/data-id=["'](\d{2,10})["']/)?.[1] ??
    html.match(/["']item_id["']\s*:\s*(\d{2,10})/)?.[1] ?? '';
  console.log('page ctx', { pageUrl, hasToken: !!pageToken, contentId, htmlLen: html.length });
  if (!pageToken || !contentId) return null;
  return { html, pageToken, contentId, pageUrl };
}

function tokenPayload(pageToken: string): Record<string, unknown> {
  try {
    const b64 = pageToken.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
  } catch { return {}; }
}

const ajaxHeaders = (ctx: PageCtx, extra: Record<string, string> = {}) => ({
  'User-Agent': UA,
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'X-Requested-With': 'XMLHttpRequest',
  'Origin': BASE,
  'Referer': ctx.pageUrl,
  ...extra,
});

/* ------------------------------------------------------------------ *
 * Etapa 2 — /player/bootstrap: lista de options
 * ------------------------------------------------------------------ */
interface Option { ID: string | number; type?: number; name?: string; is_file?: boolean; }

async function bootstrap(ctx: PageCtx, kind: 'filme' | 'serie', season?: number, episode?: number): Promise<Option[]> {
  const body = new URLSearchParams({
    contentid: ctx.contentId,
    type: kind,
    season: String(season ?? 1),
    episode: episode ? String(episode) : '',
    _token: '',
    page_token: ctx.pageToken,
  });
  const res = await fetch(`${BASE}/player/bootstrap`, {
    method: 'POST',
    headers: ajaxHeaders(ctx, { 'X-Page-Token': ctx.pageToken }),
    body: body.toString(),
  });
  if (!res.ok) { console.log('bootstrap falhou', res.status); return []; }
  const data = await res.json().catch(() => null);
  const options: Option[] = data?.data?.options ?? [];
  console.log('bootstrap options', options.map((o) => `${o.ID}:${o.name}`).join(' | '));
  return options;
}

/* ------------------------------------------------------------------ *
 * Etapa 3 — /player/source: video_url (redirect)
 * ------------------------------------------------------------------ */
async function playerSource(ctx: PageCtx, videoId: string | number): Promise<string | null> {
  const body = new URLSearchParams({ video_id: String(videoId), page_token: ctx.pageToken, host: '', site: '', _token: '' });
  const res = await fetch(`${BASE}/player/source`, {
    method: 'POST',
    headers: ajaxHeaders(ctx, { 'X-Page-Token': ctx.pageToken }),
    body: body.toString(),
  });
  if (!res.ok) { console.log('player/source falhou', videoId, res.status); return null; }
  const data = await res.json().catch(() => null);
  const videoUrl: string | undefined = data?.data?.video_url ?? data?.video_url;
  console.log('player/source video_url', videoId, videoUrl?.slice(0, 90));
  return videoUrl && /^https?:\/\//.test(videoUrl) ? videoUrl : null;
}

/* ------------------------------------------------------------------ *
 * Etapa 4/5 — segue o redirect até /video/{hash} e chama do=getVideo
 * ------------------------------------------------------------------ */
interface GetVideo { streamUrl: string; kind: Kind; referer: string; expiresAt?: number; poster?: string; }

async function resolveEmbedHost(videoUrl: string): Promise<{ finalUrl: string; html: string } | null> {
  const res = await fetch(videoUrl, {
    headers: {
      'User-Agent': UA,
      'Referer': `${BASE}/`,
      'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    redirect: 'follow',
  });
  const html = await res.text().catch(() => '');
  console.log('embed host resolvido', res.status, res.url, 'len', html.length);
  if (!res.url) return null;
  return { finalUrl: res.url, html };
}

function findVideoHash(finalUrl: string, html: string): { origin: string; hash: string } | null {
  try {
    const u = new URL(finalUrl);
    const direct = u.pathname.match(/\/(?:video|embed|e|v)\/([A-Za-z0-9]{16,64})/)?.[1];
    if (direct) return { origin: u.origin, hash: direct };
    // iframe interno apontando para /video/{hash}
    const iframe = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
    if (iframe) {
      const abs = new URL(iframe.replace(/\\\//g, '/'), finalUrl);
      const nested = abs.pathname.match(/\/(?:video|embed|e|v)\/([A-Za-z0-9]{16,64})/)?.[1];
      if (nested) return { origin: abs.origin, hash: nested };
    }
    const inHtml = html.match(/\/(?:video|embed)\/([a-f0-9]{24,64})/i)?.[1];
    if (inHtml) return { origin: u.origin, hash: inHtml };
    return null;
  } catch { return null; }
}

async function getVideo(origin: string, hash: string): Promise<GetVideo | null> {
  const endpoint = `${origin}/player/index.php?data=${encodeURIComponent(hash)}&do=getVideo`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': origin,
      'Referer': `${origin}/video/${hash}`,
    },
    body: new URLSearchParams({ hash, r: `${BASE}/` }).toString(),
  });
  if (!res.ok) { console.log('getVideo falhou', res.status, endpoint); return null; }
  const data = await res.json().catch(() => null);
  if (!data) return null;
  const secured: string | undefined = data.securedLink || data.videoSource || data.file;
  console.log('getVideo', { hls: data.hls, secured: secured?.slice(0, 90) });
  if (!secured || !/^https?:\/\//.test(secured)) return null;
  const kind: Kind = data.hls === true || /\.m3u8|master\.(?:txt|m3u8)|\/m3\//i.test(secured)
    ? 'hls'
    : /\.mpd(?:\?|$)/i.test(secured) ? 'dash' : 'mp4';
  const expires = Number(new URL(secured).searchParams.get('expires') || 0);
  return {
    streamUrl: secured,
    kind,
    referer: `${origin}/`,
    expiresAt: expires > 0 ? expires * 1000 : undefined,
    poster: typeof data.videoImage === 'string' ? data.videoImage : undefined,
  };
}

/* ------------------------------------------------------------------ *
 * Fallback: varre HTML por m3u8/mp4
 * ------------------------------------------------------------------ */
function scanHtml(html: string): { url: string; kind: Kind } | null {
  const norm = html.replace(/\\\//g, '/').replace(/\\u002[fF]/g, '/');
  const secured = norm.match(/["']securedLink["']\s*:\s*["']([^"']+)["']/i)?.[1];
  if (secured) return { url: secured.replace(/\\u0026|&amp;/g, '&'), kind: 'hls' };
  const m3u8 = norm.match(/https?:\/\/[^"'\s<>()]+\.m3u8[^"'\s<>()]*/i)?.[0];
  if (m3u8) return { url: m3u8, kind: 'hls' };
  const mp4 = norm.match(/https?:\/\/[^"'\s<>()]+\.mp4[^"'\s<>()]*/i)?.[0];
  if (mp4) return { url: mp4, kind: 'mp4' };
  return null;
}

/* ------------------------------------------------------------------ *
 * Orquestração
 * ------------------------------------------------------------------ */
async function extract(sourceUrl: string): Promise<GetVideo | null> {
  const u = new URL(sourceUrl);
  const clean = `${BASE}${u.pathname}`;
  const isSerie = /\/serie\//i.test(u.pathname);
  const segs = u.pathname.split('/').filter(Boolean); // ['serie', id, season?, episode?]
  const season = isSerie ? Number(segs[2] || 1) : undefined;
  const episode = isSerie ? Number(segs[3] || 1) : undefined;

  const ctx = await loadEmbedPage(clean);
  if (ctx) {
    const options = await bootstrap(ctx, isSerie ? 'serie' : 'filme', season, episode);
    // servidores numéricos (stream real) primeiro, arquivos MP4 depois
    const ordered = [...options].sort((a, b) => Number(!!a.is_file) - Number(!!b.is_file));
    for (const opt of ordered.slice(0, 4)) {
      const videoUrl = await playerSource(ctx, opt.ID);
      if (!videoUrl) continue;
      const resolved = await resolveEmbedHost(videoUrl);
      if (!resolved) continue;
      const target = findVideoHash(resolved.finalUrl, resolved.html);
      if (target) {
        const result = await getVideo(target.origin, target.hash);
        if (result) return result;
      }
      const scanned = scanHtml(resolved.html);
      if (scanned) {
        return { streamUrl: scanned.url, kind: scanned.kind, referer: new URL(resolved.finalUrl).origin + '/' };
      }
    }
  }

  // último recurso: varredura da própria página do embed
  const pageHtml = ctx?.html ?? '';
  const scanned = pageHtml ? scanHtml(pageHtml) : null;
  if (scanned) return { streamUrl: scanned.url, kind: scanned.kind, referer: `${BASE}/` };
  return null;
}

interface Variant { url: string; resolution?: string; bandwidth: number; }
async function readHlsVariants(masterUrl: string, referer: string): Promise<Variant[]> {
  try {
    const res = await fetch(masterUrl, { headers: { 'User-Agent': UA, 'Referer': referer, 'Origin': new URL(referer).origin } });
    const text = await res.text();
    if (!text.includes('#EXT-X-STREAM-INF')) return [];
    const lines = text.split(/\r?\n/);
    const variants: Variant[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXT-X-STREAM-INF')) continue;
      const bandwidth = Number(lines[i].match(/BANDWIDTH=(\d+)/)?.[1] ?? 0);
      const resolution = lines[i].match(/RESOLUTION=([0-9x]+)/)?.[1];
      const next = (lines[i + 1] || '').trim();
      if (!next || next.startsWith('#')) continue;
      variants.push({ url: new URL(next, masterUrl).toString(), resolution, bandwidth });
    }
    return variants.sort((a, b) => b.bandwidth - a.bandwidth);
  } catch { return []; }
}

/* ------------------------------------------------------------------ *
 * Proxy de playback (manifest + segmentos herdam o Referer)
 * ------------------------------------------------------------------ */
async function handleProxy(target: string, refererParam: string | null, req: Request): Promise<Response> {
  let targetUrl: URL;
  try { targetUrl = new URL(target); } catch { return json({ error: 'URL inválida' }, 400); }
  if (!/^https?:$/.test(targetUrl.protocol)) return json({ error: 'Protocolo não permitido' }, 400);

  const referer = refererParam || `${BASE}/`;
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': UA,
    'Referer': referer,
    'Origin': new URL(referer).origin,
    'Accept': '*/*',
  };
  const range = req.headers.get('range');
  if (range) upstreamHeaders['Range'] = range;

  const upstream = await fetch(targetUrl.toString(), { headers: upstreamHeaders, redirect: 'follow' });
  const contentType = upstream.headers.get('content-type') || '';
  const isPlaylist = /mpegurl|dash\+xml/i.test(contentType) ||
    /\.m3u8(\?|$)|\/m3\/|master\.txt/i.test(targetUrl.pathname + targetUrl.search);

  const selfBase = new URL(req.url);
  const proxyBase = `${selfBase.origin}${selfBase.pathname}`;
  const wrap = (u: string) => `${proxyBase}?proxy=${encodeURIComponent(u)}&referer=${encodeURIComponent(referer)}`;

  if (isPlaylist) {
    const body = await upstream.text();
    if (body.trimStart().startsWith('#EXTM3U')) {
      const rewritten = body.split(/\r?\n/).map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#')) return trimmed.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${wrap(new URL(u, upstream.url).toString())}"`);
        return wrap(new URL(trimmed, upstream.url).toString());
      }).join('\n');
      return new Response(rewritten, { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' } });
    }
    return new Response(body, { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': contentType || 'text/plain' } });
  }

  const headers = new Headers(corsHeaders);
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);
  const proxyTarget = url.searchParams.get('proxy');
  if (proxyTarget) {
    try { return await handleProxy(proxyTarget, url.searchParams.get('referer'), req); }
    catch (e) { return json({ error: String(e) }, 502); }
  }

  try {
    const { url: sourceUrl } = await req.json();
    if (!sourceUrl || !/^https:\/\/[^/]*superflixapi\./i.test(sourceUrl)) return json({ error: 'URL inválida' }, 400);
    console.log('Extraindo:', sourceUrl);
    const result = await extract(sourceUrl);
    if (!result) return json({ streamUrl: null });
    const variants = result.kind === 'hls' ? await readHlsVariants(result.streamUrl, result.referer) : [];
    return json({ ...result, variants, source: 'securedLink' });
  } catch (error) {
    console.error('extract-stream erro:', error);
    return json({ error: String(error) }, 500);
  }
});
