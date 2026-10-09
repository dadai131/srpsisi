// Port of get_stream.py: public HTML sources only; never solve challenges.
export const PROVIDERS = ['mgeb.top', 'mgeb.site', 'superflixapi.quest', 'embedplay.one', 'nhdapi.com'];
const MEDIA_HOSTS = [...PROVIDERS, '123flmsfree.com', 's1q2105.com', 'flyfile.app', 'streamtape.com', 'tapecontent.net', '97bf1.com', 'cuevana4br.com', 'playercdn.workers.dev', 'playercdn.xyz', 'embedplayabyss.top', 'embedplaybyse.top', 'abysscdn.com'];
export function allowedUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') &&
      MEDIA_HOSTS.some(host => u.hostname === host || u.hostname.endsWith(`.${host}`));
  } catch { return false; }
}
export function candidates(source) {
  const u = new URL(source);
  if (!PROVIDERS.some(host => u.hostname === host || u.hostname === `www.${host}`)) throw new Error('Invalid provider');
  const m = u.pathname.match(/^\/(filme|serie)\/(\d{1,12})(?:\/(\d{1,4})\/(\d{1,4}))?\/?$/);
  if (!m || (m[1] === 'filme' && m[3]) || m[3] === '0' || m[4] === '0') throw new Error('Invalid content');
  const [, type, id, season = '1', episode = '1'] = m;
  // V2: mgeb, nhdapi e Superflix; extrair playlists HLS e seguir embeds sem executar JS.
  return type === 'filme' ? [`https://mgeb.top/embed/${id}`, `https://nhdapi.com/embed/movie/${id}`, `https://superflixapi.quest/filme/${id}`] :
    [`https://mgeb.top/embed/${id}/${season}/${episode}`, `https://nhdapi.com/embed/tv/${id}/${season}/${episode}`, `https://superflixapi.quest/serie/${id}/${season}/${episode}`];
}
// V2 (get_stream_v2.py): decodifica mais escapes sem executar JS.
export function decodeText(html) {
  return html.replace(/\\\//g, '/').replace(/\\u002[fF]|\\x2[fF]/g, '/').replace(/\\u003[aA]|\\x3[aA]/g, ':')
    .replace(/\\u0026|&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
}
// Host público (sem IP literal / localhost) para seguir iframes como no crawl_embeds do V2.
export function publicUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return false;
    const h = u.hostname;
    return h.includes('.') && !/^[\d.]+$/.test(h) && !h.includes(':') && !/(^|\.)(localhost|local|internal)$/i.test(h);
  } catch { return false; }
}
// iframes e páginas de player escondidas em JS (sem .js/.css/imagens).
export function extractPages(html, base) {
  const text = decodeText(html);
  const out = new Set();
  const add = raw => { try {
    let u = raw.trim(); if (u.startsWith('//')) u = 'https:' + u;
    u = new URL(u.replace(/^(https?:\/\/[^/]+)\/(?:\.\.?\/)+/, '$1/'), base).href;
    if (!/\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?)(?:\?|$)/i.test(u) && publicUrl(u)) out.add(u);
  } catch { /* ignore */ } };
  for (const m of text.matchAll(/data-url=['"]([^'"]+)['"]/gi)) add(m[1]);
  for (const m of text.matchAll(/<iframe[^>]{0,1000}?(?:src|data-src)=['"]([^'"]+)['"]/gi)) add(m[1]);
  for (const m of text.matchAll(/(?:src|file|url|embed|player)\s*[:=]\s*['"]((?:https?:)?\/\/[^\s'"<>]{4,500})['"]/gi)) add(m[1]);
  for (const m of text.matchAll(/['"]((?:https?:)?\/\/[^\s'"<>]+\/(?:embed|player|watch|e|v)\/[^\s'"<>]*)['"]/gi)) add(m[1]);
  return [...out].filter(u => !/\.(?:m3u8|mp4)(?:\?|$)/i.test(u));
}
export function extractUrls(html, base, extraAllowed = () => false) {
  const text = decodeText(html);
  if (/challenges\.cloudflare\.com\/turnstile|cf_embed_challenge|cf-turnstile-response/i.test(text)) return [];
  // V2: descobrir playlists HLS e MP4, incluindo URLs declaradas no HTML.
  const declared = [];
  const src = text.match(/var\s+sources\s*=\s*(\[[\s\S]*?\]);/);
  if (src) { try { for (const s of JSON.parse(src[1])) if (s?.file) declared.push({ file: s.file, mp4: s.type === 'mp4' }); } catch { /* ignore */ } }
  declared.sort((a, b) => Number(a.mp4) - Number(b.mp4));
  const matches = declared.map(d => d.file).concat(text.match(/(?:https?:\/\/|\/\/|\.\.?\/|\/)[^\s"'<>\\]*?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/gi) || []);
  return [...new Set(matches.map(value => { try { const normalized = value.startsWith('//') ? 'https:' + value : value; return new URL(normalized.replace(/^(https?:\/\/[^/]+)\/(?:\.\.?\/)+/, '$1/'), base).href; } catch { return null; } }).filter(Boolean))].filter(u => allowedUrl(u) || (publicUrl(u) && extraAllowed(u))).sort((a, b) => Number(/\.m3u8(?:[?#]|$)/i.test(b)) - Number(/\.m3u8(?:[?#]|$)/i.test(a)));
}
export function expiresAt(text) {
  const values = [...text.matchAll(/(?:exp=|expires=)(\d{10,13})/g)].map(m => Number(m[1]) * (m[1].length === 13 ? 1 : 1000));
  return values.length ? Math.min(...values) : undefined;
}
export function rewritePlaylist(text, base, wrap, isAllowed = allowedUrl) {
  return text.split(/\r?\n/).map(line => {
    const value = line.trim();
    if (!value) return line;
    const resolve = uri => {
      const absolute = new URL(uri, base).href;
      if (!isAllowed(absolute)) throw new Error('Unsupported media host');
      return wrap(absolute);
    };
    return value.startsWith('#') ? line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${resolve(uri)}"`) : resolve(value);
  }).join('\n');
}
// EmbedPlay: opções carregadas via POST /api (action=getPlayer, video_id=data-id).
export function embedplayIds(html) {
  return [...new Set([...html.matchAll(/class=['"]player_select_item['"][^>]*data-id=['"](\d{1,10})['"]/gi)].map(m => m[1]))];
}
