// Ponte de TESTE para um servidor Xtream (conta temporária). Só aceita IDs numéricos de VOD.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};
const HOST = 'https://xlionone.ultrapw.fun';
const USER = '277273986';
const PASS = '559524926';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const vod = new URL(req.url).searchParams.get('vod') ?? '';
  if (!/^\d{1,9}$/.test(vod)) return new Response('vod inválido', { status: 400, headers: cors });
  try {
    const range = req.headers.get('range');
    const up = await fetch(`${HOST}/movie/${USER}/${PASS}/${vod}.mp4`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0', ...(range ? { Range: range } : {}) },
    });
    const headers = new Headers(cors);
    for (const n of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const v = up.headers.get(n); if (v) headers.set(n, v);
    }
    if (!headers.has('content-type')) headers.set('content-type', 'video/mp4');
    return new Response(up.body, { status: up.status, headers });
  } catch (e) {
    return new Response(`Falha: ${(e as Error).message}`, { status: 502, headers: cors });
  }
});
