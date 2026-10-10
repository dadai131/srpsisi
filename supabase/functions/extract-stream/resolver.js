// Port of get_stream.py: public HTML sources only; never solve challenges.
export const PROVIDERS = ['mgeb.top', 'mgeb.site', 'nhdapi.com', 'superflixapi.quest'];
const MEDIA_HOSTS = [...PROVIDERS, 'mgeb.site', 'powestream.workers.dev', '123flmsfree.com', 's1q2105.com', 'flyfile.app', 'streamtape.com', 'tapecontent.net', '97bf1.com', 'cuevana4br.com', 'playercdn.workers.dev', 'playercdn.xyz'];
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
  return type === 'filme' ? [`https://mgeb.site/embed/${id}`, `https://mgeb.top/embed/${id}`, `https://nhdapi.com/embed/movie/${id}`, `https://superflixapi.quest/filme/${id}`] :
    [`https://mgeb.site/embed/${id}/${season}/${episode}`, `https://mgeb.top/embed/${id}/${season}/${episode}`, `https://nhdapi.com/embed/tv/${id}/${season}/${episode}`, `https://superflixapi.quest/serie/${id}/${season}/${episode}`];
}
export function extractUrls(html, base) {
  const text = html.replace(/\\\//g, '/').replace(/\\u002[fF]/g, '/').replace(/\\u0026|&amp;/g, '&');
  if (/challenges\.cloudflare\.com\/turnstile|cf_embed_challenge|cf-turnstile-response/i.test(text)) return [];
  // Fontes declaradas no player (var sources = [...]): MP4 primeiro, como no get_stream.py.
  const declared = [];
  const src = text.match(/var\s+sources\s*=\s*(\[[\s\S]*?\]);/);
  if (src) { try { for (const s of JSON.parse(src[1])) if (s?.file) declared.push({ file: s.file, mp4: s.type === 'mp4' }); } catch { /* ignore */ } }
  declared.sort((a, b) => Number(b.mp4) - Number(a.mp4));
  const matches = declared.map(d => d.file).concat(text.match(/(?:https?:\/\/|\/\/|\.\.?\/|\/)[^\s"'<>\\]*?\.(?:m3u8|m3u|mp4)(?:\?[^\s"'<>\\]*)?/gi) || []);
  return [...new Set(matches.map(value => new URL(value.replace(/^(https?:\/\/[^/]+)\/(?:\.\.?\/)+/, '$1/'), base).href))].filter(allowedUrl);
}
export function expiresAt(text) {
  const values = [...text.matchAll(/(?:exp=|expires=)(\d{10,13})/g)].map(m => Number(m[1]) * (m[1].length === 13 ? 1 : 1000));
  return values.length ? Math.min(...values) : undefined;
}
export function rewritePlaylist(text, base, wrap) {
  return text.split(/\r?\n/).map(line => {
    const value = line.trim();
    if (!value) return line;
    const resolve = uri => {
      const absolute = new URL(uri, base).href;
      if (!allowedUrl(absolute)) throw new Error('Unsupported media host');
      return wrap(absolute);
    };
    return value.startsWith('#') ? line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${resolve(uri)}"`) : resolve(value);
  }).join('\n');
}

// M3U is a list of media URLs, not an HLS manifest. Resolve only allowlisted entries.
export function m3uEntries(text, base) {
  if (!text.trimStart().startsWith('#EXTM3U')) return [];
  const entries = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    try {
      const url = new URL(line, base).href;
      if (allowedUrl(url) && /\.(?:mp4|m3u8)$/i.test(new URL(url).pathname)) entries.push(url);
    } catch { /* skip malformed entry */ }
  }
  return [...new Set(entries)].slice(0, 12);
}
