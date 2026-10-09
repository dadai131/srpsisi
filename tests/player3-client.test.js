import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmbedUrl, isAllowedEmbed, probeMedia } from '../src/lib/player3Sources.js';

test('builds movie and episode embed URLs from TMDB id', () => {
  assert.equal(buildEmbedUrl('mgeb', '969681', 'movie'), 'https://mgeb.top/embed/969681');
  assert.equal(buildEmbedUrl('nhd', '1399', 'serie', 2, 7), 'https://nhdapi.com/embed/tv/1399/2/7');
});
test('rejects invalid ids and unknown sources', () => {
  assert.equal(buildEmbedUrl('mgeb', '12; drop', 'movie'), null);
  assert.equal(buildEmbedUrl('evil', '1', 'movie'), null);
  assert.equal(buildEmbedUrl('mgeb', '1', 'serie', 0, 1), null);
});
test('only allows configured https embed hosts', () => {
  assert.equal(isAllowedEmbed('https://mgeb.top/embed/1'), true);
  assert.equal(isAllowedEmbed('http://mgeb.top/embed/1'), false);
  assert.equal(isAllowedEmbed('https://mgeb.top.evil.test/'), false);
});
test('diagnoses expired token, http and CORS', async () => {
  assert.equal((await probeMedia('https://x.test/a.m3u8?expires=1000')).reason, 'token-expired');
  assert.equal((await probeMedia('http://x.test/a.mp4')).reason, 'mixed-content');
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  assert.equal((await probeMedia('https://x.test/a.mp4')).reason, 'cors');
  globalThis.fetch = async () => new Response('x', { status: 403 });
  assert.equal((await probeMedia('https://x.test/a.mp4')).reason, 'token-expired');
});
