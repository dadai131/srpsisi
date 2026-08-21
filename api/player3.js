const PLAYER_ORIGIN = 'https://superflixapi.sbs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function decodeTokenPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
  } catch { return null; }
}

function findToken(html) {
  const patterns = [
    /(?:page_token|pageToken|page-token)["'\s:=]+([A-Za-z0-9._-]{80,})/i,
    /X-Page-Token[^A-Za-z0-9._-]*([A-Za-z0-9._-]{80,})/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function postForm(url, body, extra = {}) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA,
      Referer: PLAYER_ORIGIN + '/',
      ...extra,
    },
    body: body.toString(),
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id, type = 'movie', season = 1, episode = 1 } = req.body || {};
    if (!/^\d{1,12}$/.test(String(id || ''))) return res.status(400).json({ error: 'Invalid content id' });

    const isSeries = type === 'serie' || type === 'anime' || type === 'dorama';
    const playerPath = isSeries ? `/serie/${id}/${Number(season)}/${Number(episode)}` : `/filme/${id}`;
    const playerUrl = `${PLAYER_ORIGIN}${playerPath}`;

    const page = await fetch(playerUrl, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', Referer: PLAYER_ORIGIN + '/' } });
    if (!page.ok) return res.status(502).json({ error: `Player page returned ${page.status}` });
    const html = await page.text();
    const pageToken = findToken(html);
    if (!pageToken) return res.status(502).json({ error: 'Player page token not found' });

    const tokenPayload = decodeTokenPayload(pageToken);
    const contentId = tokenPayload?.embedded_item_id;
    if (!contentId) return res.status(502).json({ error: 'Player content id not found in page token' });

    const bootstrapBody = new URLSearchParams({
      contentid: String(contentId),
      type: isSeries ? 'serie' : 'filme',
      season: isSeries ? String(season) : '1',
      episode: isSeries ? String(episode) : '',
      _token: '',
      page_token: pageToken,
      pageToken,
    });
    const bootstrap = await postForm(`${PLAYER_ORIGIN}/player/bootstrap`, bootstrapBody, { 'X-Page-Token': pageToken });
    if (!bootstrap.ok) return res.status(502).json({ error: `Bootstrap returned ${bootstrap.status}` });
    const bootstrapJson = await bootstrap.json();
    const options = bootstrapJson?.data?.options || [];
    const server = options.find(item => item?.ID && item?.is_file === false) || options.find(item => item?.ID);
    if (!server?.ID) return res.status(502).json({ error: 'No Player 1 server returned by bootstrap' });

    const sourceBody = new URLSearchParams({ video_id: String(server.ID), page_token: pageToken, host: '', site: '', _token: '' });
    const source = await postForm(`${PLAYER_ORIGIN}/player/source`, sourceBody);
    if (!source.ok) return res.status(502).json({ error: `Source returned ${source.status}` });
    const sourceJson = await source.json();
    const redirectUrl = sourceJson?.data?.video_url;
    if (typeof redirectUrl !== 'string' || !redirectUrl) return res.status(502).json({ error: 'Player source did not return video_url' });

    const redirect = await fetch(redirectUrl, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', Referer: playerUrl } });
    const finalUrl = redirect.url || redirectUrl;
    const finalParsed = new URL(finalUrl);
    const hashMatch = finalParsed.pathname.match(/\/video\/([^/]+)/i);
    if (!hashMatch) return res.status(502).json({ error: 'Video redirect did not produce a video hash' });
    const hash = hashMatch[1];

    const getVideoBody = new URLSearchParams({ hash, r: `${PLAYER_ORIGIN}/` });
    const getVideoUrl = `${finalParsed.origin}/player/index.php?data=${encodeURIComponent(hash)}&do=getVideo`;
    const getVideo = await fetch(getVideoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Accept: '*/*', 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': UA, Referer: finalUrl },
      body: getVideoBody.toString(),
    });
    if (!getVideo.ok) return res.status(502).json({ error: `getVideo returned ${getVideo.status}` });
    const videoJson = await getVideo.json();
    const securedLink = videoJson?.securedLink;
    if (typeof securedLink !== 'string' || !/^https?:\/\//i.test(securedLink)) return res.status(502).json({ error: 'securedLink was not returned' });

    return res.status(200).json({ streamUrl: securedLink, referer: finalParsed.origin, kind: 'hls', source: 'securedLink' });
  } catch (error) {
    console.error('Player 3 error:', error);
    return res.status(500).json({ error: 'Player 3 backend error' });
  }
}
