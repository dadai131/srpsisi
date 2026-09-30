// Port of get_stream.py: public HTML sources only; never solve challenges.
export const PROVIDERS = ['mgeb.top', 'nhdapi.com', 'superflixapi.quest'];
const MEDIA_HOSTS = [...PROVIDERS, '123flmsfree.com', 's1q2105.com', 'flyfile.app'];
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
  return type === 'filme' ? [`https://mgeb.top/embed/${id}`, `https://nhdapi.com/embed/movie/${id}`, `https://superflixapi.quest/filme/${id}`] :
    [`https://mgeb.top/embed/${id}/${season}/${episode}`, `https://nhdapi.com/embed/tv/${id}/${season}/${episode}`, `https://superflixapi.quest/serie/${id}/${season}/${episode}`];
}
export function extractUrls(html, base) {
  const text = html.replace(/\\\//g, '/').replace(/\\u002[fF]/g, '/').replace(/\\u0026|&amp;/g, '&');
  if (/challenges\.cloudflare\.com\/turnstile|cf_embed_challenge|cf-turnstile-response/i.test(text)) return [];
  const matches = text.match(/(?:https?:\/\/|\/\/|\.\.?\/|\/)[^\s"'<>\\]*?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/gi) || [];
  return [...new Set(matches.map(value => new URL(value, base).href))].filter(allowedUrl);
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
