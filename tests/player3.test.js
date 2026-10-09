import test from 'node:test';
import assert from 'node:assert/strict';
import { candidates, extractUrls, expiresAt, rewritePlaylist, allowedUrl } from '../supabase/functions/extract-stream/resolver.js';
test('provider fallback preserves movie and episode IDs', () => {
  assert.equal(candidates('https://superflixapi.quest/filme/1492640')[0], 'https://mgeb.top/embed/1492640');
  assert.equal(candidates('https://superflixapi.quest/serie/123/2/7')[1], 'https://superflixapi.quest/serie/123/2/7');
  assert.throws(() => candidates('https://superflixapi.evil.test/filme/123'));
  assert.deepEqual(candidates('https://mgeb.top/filme/9').map(u => new URL(u).hostname), ['mgeb.top', 'superflixapi.quest', 'www.embedplay.one', 'nhdapi.com']);
});
test('HTML resolves relative and escaped URLs without altering signatures', () => {
  assert.deepEqual(extractUrls('<source src="../cache/a.m3u8?x=1&amp;y=2"><script>"https:\\/\\/flyfile.app/a.mp4"</script>', 'https://mgeb.top/embed/123'), ['https://mgeb.top/cache/a.m3u8?x=1&y=2', 'https://flyfile.app/a.mp4']);
  assert.deepEqual(extractUrls('cf-turnstile-response https://mgeb.top/a.m3u8', 'https://mgeb.top/'), []);
});
test('proxy rewrites variants, audio, encryption keys and segments', () => {
  const result = rewritePlaylist('#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,URI="audio.m3u8"\n#EXT-X-KEY:METHOD=AES-128,URI="key"\n../720/index.m3u8?hdnts=exp=1799999999_acl=/*_hmac=abcd', 'https://mgeb.top/cache/master.m3u8', u => 'proxy:' + u);
  assert.match(result, /URI="proxy:https:\/\/mgeb.top\/cache\/audio.m3u8"/);
  assert.match(result, /URI="proxy:https:\/\/mgeb.top\/cache\/key"/);
  assert.match(result, /proxy:https:\/\/mgeb.top\/720\/index.m3u8\?hdnts=exp=1799999999_acl=\/\*_hmac=abcd/);
  assert.equal(expiresAt(result), 1799999999000);
});
test('rejects arbitrary proxy destinations and unsafe nested URLs', () => {
  for (const value of ['http://mgeb.top/a', 'https://127.0.0.1/', 'https://mgeb.top.evil.test/', 'https://user:pass@mgeb.top/', 'https://mgeb.top:444/']) assert.equal(allowedUrl(value), false);
  assert.throws(() => rewritePlaylist('#EXTM3U\nhttp://169.254.169.254/latest', 'https://mgeb.top/', u => u));
});
test('Edge handler resolves fallback and proxies a playlist end to end', async () => {
  const { readFile } = await import('node:fs/promises');
  const { stripTypeScriptTypes } = await import('node:module');
  const source = await readFile(new URL('../supabase/functions/extract-stream/index.ts', import.meta.url), 'utf8');
  let handler;
  globalThis.__registerPlayer3 = fn => { handler = fn; };
  const transformed = source.replace(/import \{ serve \}[^\n]+/, 'const serve = globalThis.__registerPlayer3;')
    .replace("'./resolver.js'", JSON.stringify(new URL('../supabase/functions/extract-stream/resolver.js', import.meta.url).href));
  await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(transformed)).toString('base64'));
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async url => {
    requested.push(url);
    if (url === 'https://mgeb.top/embed/123/2/7') return new Response('Unavailable', { status: 503 });
    if (url === 'https://superflixapi.quest/serie/123/2/7') return new Response('<source src="https://mgeb.top/cache/master.m3u8">');
    if (url === 'https://mgeb.top/cache/master.m3u8') return new Response('#EXTM3U\n#EXTINF:5,\nhttps://s1q2105.com/segment.ts', { headers: { 'content-type': 'application/vnd.apple.mpegurl' } });
    throw new Error('Unexpected URL: ' + url);
  };
  try {
    const response = await handler(new Request('https://backend.test/functions/v1/extract-stream', { method: 'POST', body: JSON.stringify({ id: '123', type: 'serie', season: 2, episode: 7 }) }));
    const data = await response.json();
    assert.equal(data.source, 'superflixapi.quest');
    assert.equal(data.kind, 'hls');
    assert.equal(requested[1], 'https://superflixapi.quest/serie/123/2/7');
    const playback = await handler(new Request('https://backend.test/functions/v1/extract-stream?proxy=' + encodeURIComponent(data.streamUrl)));
    assert.equal(playback.status, 200);
    assert.match(await playback.text(), /https:\/\/backend.test\/functions\/v1\/extract-stream\?proxy=https%3A%2F%2Fs1q2105.com%2Fsegment.ts/);
    const denied = await handler(new Request('https://backend.test/?proxy=https://127.0.0.1/'));
    assert.equal(denied.status, 400);
  } finally { globalThis.fetch = originalFetch; delete globalThis.__registerPlayer3; }
});
