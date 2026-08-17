import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const AD_HINTS = ['ads', 'adserv', 'analytics', 'doubleclick', 'popads', 'popcash', 'click', 'track', 'pixel', 'banner', 'promo', 'gtm', 'googletag'];
const isAdUrl = (u: string) => {
  if (u.includes('superflixapi.pro') || u.includes('xn--')) return false;
  return AD_HINTS.some((h) => u.toLowerCase().includes(h));
};

function unescapeUrls(html: string): string {
  return html.replace(/\\\//g, '/').replace(/\\u002[fF]/g, '/').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
}

function decodeBase64Blobs(html: string): string {
  let extra = '';
  const candidates = [
    ...html.matchAll(/atob\(\s*["']([A-Za-z0-9+/=]{40,})["']\s*\)/g),
    ...html.matchAll(/["']([A-Za-z0-9+/=]{80,})["']/g),
  ].map((m) => m[1]);
  for (const c of candidates.slice(0, 40)) {
    try {
      const decoded = atob(c);
      if (/https?:\/\//.test(decoded)) extra += '\n' + decoded;
    } catch { /* not base64 */ }
  }
  return extra;
}

type Kind = 'hls' | 'dash' | 'file';
interface Found { url: string; kind: Kind; secured?: boolean; }

function collectMedia(rawHtml: string): Found[] {
  const normalized = unescapeUrls(rawHtml);
  const html = normalized + decodeBase64Blobs(rawHtml);
  const out: Found[] = [];
  const seen = new Set<string>();

  // Player 1: a resposta JSON contém explicitamente securedLink.
  const securedPatterns = [
    /["']securedLink["']\s*:\s*["']([^"']+)["']/gi,
    /["']secured_link["']\s*:\s*["']([^"']+)["']/gi,
    /["']secureLink["']\s*:\s*["']([^"']+)["']/gi,
  ];
  for (const re of securedPatterns) {
    for (const m of html.matchAll(re)) {
      const url = m[1].replace(/\\\//g, '/').replace(/\\u0026/g, '&');
      if (!/^https?:\/\//i.test(url) || isAdUrl(url) || seen.has(url)) continue;
      const kind: Kind = /\.m3u8(?:\?|$)|\/m3\//i.test(url) ? 'hls' : /\.mpd(?:\?|$)/i.test(url) ? 'dash' : 'file';
      seen.add(url);
      out.push({ url, kind, secured: true });
    }
  }

  const patterns: Array<{ re: RegExp; kind: Kind }> = [
    { re: /(https?:\/\/[^"'\s\\<>()]+\.m3u8[^"'\s\\<>()]*)/gi, kind: 'hls' },
    { re: /(https?:\/\/[^"'\s\\<>()]+\.mpd[^"'\s\\<>()]*)/gi, kind: 'dash' },
    { re: /(https?:\/\/[^"'\s\\<>()]+\.mp4[^"'\s\\<>()]*)/gi, kind: 'file' },
    { re: /(https?:\/\/xn--[^"'\s\\<>()]+(?:\/m3\/|\/video\/|\/hls\/)[^"'\s\\<>()]*)/gi, kind: 'hls' },
    { re: /(https?:\/\/[^"'\s\\<>()]+\/master\.txt[^"'\s\\<>()]*)/gi, kind: 'hls' },
    { re: /sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/gi, kind: 'hls' },
    { re: /file\s*:\s*["'](https?:\/\/[^"']+)["']/gi, kind: 'hls' },
    // Adicionando matchers para URLs ofuscadas ou em arrays de scripts
    { re: /["'](https?:\/\/[^"']+\.(?:m3u8|mp4|mpd)(?:\?[^"']*)?)["']/gi, kind: 'hls' }
  ];

  for (const { re, kind } of patterns) {
    for (const m of html.matchAll(re)) {
      const url = m[1];
      if (seen.has(url) || isAdUrl(url)) continue;
      seen.add(url);
      const detectedKind: Kind = /\.m3u8(?:\?|$)|\/m3\//i.test(url) ? 'hls' : /\.mpd(?:\?|$)/i.test(url) ? 'dash' : 'file';
      out.push({ url, kind: detectedKind, secured: false });
    }
  }
  return out;
}

function findIframes(rawHtml: string): string[] {
  const html = unescapeUrls(rawHtml);
  return [...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]).filter((u) => /^https?:\/\//.test(u) && !isAdUrl(u));
}

async function fetchPage(url: string, referer: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 
      'User-Agent': UA, 
      'Referer': 'https://www2.superflixapi.pro/', 
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    } });
    if (!res.ok) {
      console.log(`Fetch failed for ${url}: ${res.status}`);
      return '';
    }
    return await res.text();
  } catch (e) {
    console.log(`Fetch error for ${url}: ${e}`);
    return '';
  }
}

async function detect(url: string, referer: string, depth = 0): Promise<{ found: Found[]; referer: string }> {
  const html = await fetchPage(url, referer);
  console.log('HTML length for', url, ':', html.length);
  if (html.length < 500) console.log('HTML snippet:', html.substring(0, 500));
  const found = collectMedia(html);
  if (found.length > 0 || depth >= 2) return { found, referer: url };
  for (const iframe of findIframes(html).slice(0, 4)) {
    try {
      console.log('Following iframe:', iframe);
      const nested = await detect(iframe, url, depth + 1);
      if (nested.found.length > 0) return nested;
    } catch (e) {
      console.error('Falha ao seguir iframe', iframe, String(e));
    }
  }
  return { found: [], referer: url };
}

interface Variant { url: string; resolution?: string; bandwidth: number; }

async function readHlsVariants(masterUrl: string, referer: string): Promise<Variant[]> {
  try {
    const res = await fetch(masterUrl, { headers: { 'User-Agent': UA, 'Referer': referer } });
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
  } catch (e) {
    console.error('Erro ao ler manifest HLS:', String(e));
    return [];
  }
}

async function handleProxy(target: string, refererParam: string | null, req: Request): Promise<Response> {
  let targetUrl: URL;
  try { targetUrl = new URL(target); } catch { return new Response(JSON.stringify({ error: 'URL inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
  if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') return new Response(JSON.stringify({ error: 'Protocolo não permitido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const referer = refererParam || 'https://superflixapi.pro';
  const upstreamHeaders: Record<string, string> = { 'User-Agent': UA, 'Referer': referer, 'Origin': new URL(referer).origin, 'Accept': '*/*' };
  const range = req.headers.get('range');
  if (range) upstreamHeaders['Range'] = range;
  const upstream = await fetch(targetUrl.toString(), { headers: upstreamHeaders, redirect: 'follow' });
  const contentType = upstream.headers.get('content-type') || '';
  const isPlaylist = /mpegurl|dash\+xml/i.test(contentType) || /\.m3u8(\?|$)|\/m3\/|master\.txt/i.test(targetUrl.pathname + targetUrl.search);
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
    catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
  }

  try {
    const { url: sourceUrl } = await req.json();
    if (!sourceUrl || !/^https:\/\//.test(sourceUrl)) return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    console.log('Detecting media at:', sourceUrl);
    
    // Tenta primeiro o link direto do embed que geralmente contém os dados JSON/HTML com securedLink
    const embedUrl = sourceUrl.includes('/filme/') 
      ? sourceUrl.replace('superflixapi.pro/filme/', 'www2.superflixapi.pro/api/filme/') 
      : sourceUrl.replace('superflixapi.pro/serie/', 'www2.superflixapi.pro/api/serie/');
    
    console.log('Trying API endpoint first:', embedUrl);
    
    let detectResult = await detect(embedUrl, 'https://www2.superflixapi.pro/');
    let found = detectResult.found;
    let referer = detectResult.referer;
    
    if (found.length === 0) {
      console.log('API endpoint failed, trying original URL...');
      detectResult = await detect(sourceUrl, 'https://www2.superflixapi.pro/');
      found = detectResult.found;
      referer = detectResult.referer;
    }

    // Fallback agressivo: busca por URLs de stream no HTML bruto caso a detecção estruturada falhe
    if (found.length === 0) {
      console.log('Detection failed, trying raw fetch and specific regex...');
      const rawHtml = await fetchPage(sourceUrl, 'https://www2.superflixapi.pro/');
      const rawMatch = rawHtml.match(/https?:\/\/[^"']+\.m3u8[^"']*/i);
      if (rawMatch) {
        found.push({ url: rawMatch[0], kind: 'hls', secured: false });
        referer = sourceUrl;
      }
    }
    
    console.log('Found media items:', found.length);
    if (found.length === 0) return new Response(JSON.stringify({ streamUrl: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

    // securedLink do Player 1 vem primeiro; entre os demais, HLS > DASH > arquivo.
    const best = found.find((item) => item.secured) || found.sort((a, b) => {
      const order: Kind[] = ['hls', 'dash', 'file'];
      return order.indexOf(a.kind) - order.indexOf(b.kind);
    })[0];
    const variants = best.kind === 'hls' ? await readHlsVariants(best.url, referer) : [];
    return new Response(JSON.stringify({ streamUrl: best.url, kind: best.kind, variants, referer, source: best.secured ? 'securedLink' : 'detected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
