// Player 3: seleção client-side de fontes autorizadas (sem proxy, sem scraping).
export const PLAYER3_SOURCES = [
  { id: 'mgeb', label: 'Fonte A', host: 'mgeb.top', movie: (id) => `https://mgeb.top/embed/${id}`, tv: (id, s, e) => `https://mgeb.top/embed/${id}/${s}/${e}` },
  { id: 'nhd', label: 'Fonte B', host: 'nhdapi.com', movie: (id) => `https://nhdapi.com/embed/movie/${id}`, tv: (id, s, e) => `https://nhdapi.com/embed/tv/${id}/${s}/${e}` },
];

const pos = (n) => Number.isInteger(n) && n > 0 && n < 10000;

export function buildEmbedUrl(sourceId, id, type, season = 1, episode = 1) {
  const src = PLAYER3_SOURCES.find((s) => s.id === sourceId);
  if (!src || !/^\d{1,12}$/.test(String(id))) return null;
  if (type === 'serie') return pos(season) && pos(episode) ? src.tv(id, season, episode) : null;
  return src.movie(id);
}

export function isAllowedEmbed(url) {
  try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.port && PLAYER3_SOURCES.some((s) => s.host === u.hostname); } catch { return false; }
}

// Verifica uma mídia direta pelo navegador do visitante. Retorna diagnóstico.
export async function probeMedia(url, signal) {
  let u;
  try { u = new URL(url); } catch { return { ok: false, reason: 'unavailable' }; }
  if (u.protocol !== 'https:') return { ok: false, reason: 'mixed-content' };
  const exp = Number(u.searchParams.get('expires') || u.searchParams.get('exp') || 0);
  if (exp && exp * (exp < 1e12 ? 1000 : 1) < Date.now()) return { ok: false, reason: 'token-expired' };
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1023' }, signal });
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'token-expired' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const ct = res.headers.get('content-type') || '';
    const kind = /mpegurl/i.test(ct) || /\.m3u8(\?|$)/i.test(u.pathname) ? 'hls' : 'mp4';
    return { ok: true, kind };
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    return { ok: false, reason: 'cors' }; // falha de rede opaca = CORS provável
  }
}

export const DIAGNOSTICS = {
  'embed-blocked': 'A fonte não carregou dentro do site (embed bloqueado). Tente outra fonte ou o Player 1.',
  unavailable: 'Mídia indisponível nesta fonte.',
  cors: 'A fonte não permite reprodução direta por este site (CORS provável).',
  'token-expired': 'O link de vídeo expirou ou exige autorização (token expirado).',
  'mixed-content': 'A fonte usa HTTP e o navegador bloqueia em site seguro.',
};
