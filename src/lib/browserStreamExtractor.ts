// Browser-only port of the public HTML extraction flow in get_stream_v2.py.
// Cross-origin pages must explicitly allow CORS; this does not bypass access controls.
import { buildEmbedUrl } from './player3Sources.js';

export interface BrowserStream { streamUrl: string; kind: 'hls' | 'mp4'; source: string }
export interface BrowserExtraction { stream: BrowserStream | null; blockedByCors: boolean; visited: number }

const decode = (input: string) => input
  .replace(/\\\//g, '/').replace(/\\u002[fF]|\\x2[fF]/g, '/')
  .replace(/\\u003[aA]|\\x3[aA]/g, ':')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#(?:0?39|x27);/gi, "'");

const safeUrl = (value: string, base: string): string | null => {
  try {
    const url = new URL(value.startsWith('//') ? 'https:' + value : value, base);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    const h = url.hostname;
    if (!h.includes('.') || h === 'localhost' || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(h) || h.endsWith('.local')) return null;
    return url.href;
  } catch { return null; }
};

const mediaType = (url: string): 'hls' | 'mp4' | null =>
  /\.m3u8(?:[?#]|$)/i.test(url) ? 'hls' : /\.mp4(?:[?#]|$)/i.test(url) ? 'mp4' : null;

function parseHtml(html: string, base: string) {
  const decoded = decode(html);
  if (decoded.includes('challenges.cloudflare.com/turnstile') || decoded.includes('cf_embed_challenge') || decoded.includes('cf-turnstile-response')) return { media: [], pages: [] };
  const media = new Set<string>();
  const pages = new Set<string>();
  const add = (value: string, target: Set<string>) => {
    const url = safeUrl(value, base);
    if (url) target.add(url);
  };
  const mediaPattern = /https?:\/\/[^\s"'<>]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>]*)?/gi;
  for (const m of decoded.matchAll(mediaPattern)) add(m[0], media);
  const doc = new DOMParser().parseFromString(decoded, 'text/html');
  for (const el of Array.from(doc.querySelectorAll('iframe[src], iframe[data-src], video[src], source[src]'))) {
    const raw = el.getAttribute('src') || el.getAttribute('data-src');
    if (!raw) continue;
    const url = safeUrl(raw, base);
    if (!url) continue;
    (mediaType(url) ? media : pages).add(url);
  }
  const pagePattern = /(?:src|file|url|embed|player)\s*[:=]\s*['"]((?:https?:)?\/\/[^\s'"<>]{4,500})['"]/gi;
  for (const m of decoded.matchAll(pagePattern)) {
    const url = safeUrl(m[1], base);
    if (url) (mediaType(url) ? media : pages).add(url);
  }
  return { media: [...media].sort((a, b) => Number(mediaType(b) === 'hls') - Number(mediaType(a) === 'hls')), pages: [...pages] };
}

export async function extractStreamInBrowser(
  id: string, type: 'movie' | 'serie', season: number, episode: number, signal: AbortSignal,
): Promise<BrowserExtraction> {
  const seeds = ['mgeb', 'nhd'].map(source => buildEmbedUrl(source, id, type, season, episode)).filter((u): u is string => !!u);
  const queue = seeds.map(url => ({ url, depth: 0 }));
  const visited = new Set<string>();
  let blockedByCors = false;
  while (queue.length && visited.size < 25) {
    if (signal.aborted) throw new DOMException('Cancelado', 'AbortError');
    const next = queue.shift()!;
    if (next.depth > 3 || visited.has(next.url)) continue;
    visited.add(next.url);
    let response: Response;
    try {
      response = await fetch(next.url, { signal, mode: 'cors', credentials: 'omit' });
    } catch (error) {
      if (signal.aborted) throw error;
      blockedByCors = true;
      continue;
    }
    if (!response.ok) continue;
    const ct = response.headers.get('content-type') || '';
    if (/mpegurl/i.test(ct) || mediaType(response.url || next.url)) {
      const url = response.url || next.url;
      const kind = /mpegurl/i.test(ct) ? 'hls' : mediaType(url);
      if (kind) return { stream: { streamUrl: url, kind, source: next.url }, blockedByCors, visited: visited.size };
    }
    if (!['html', 'text/plain', 'javascript', 'json'].some(kind => ct.includes(kind))) continue;
    const html = (await response.text()).slice(0, 1_500_000);
    const { media, pages } = parseHtml(html, response.url || next.url);
    // The browser player checks playback of candidate URLs itself; avoid
    // cross-origin GET probing of video files and their potentially large bodies.
    if (media.length) return { stream: { streamUrl: media[0], kind: mediaType(media[0])!, source: next.url }, blockedByCors, visited: visited.size };
    for (const url of pages) if (!visited.has(url)) queue.push({ url, depth: next.depth + 1 });
  }
  return { stream: null, blockedByCors, visited: visited.size };
}
