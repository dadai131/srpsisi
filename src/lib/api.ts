// src/lib/api.ts
// Existing API helpers remain unchanged above this section.

export interface DirectStream {
  streamUrl: string;
  referer?: string;
  kind?: 'hls' | 'dash' | 'mp4' | 'unknown';
}

/**
 * Player 3 consumes an HLS URL supplied by the site's own authorized backend.
 * The endpoint must return { streamUrl, referer?, kind? }.
 */
export async function getPlayer3Stream(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<DirectStream | null> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Player 3 backend returned ${response.status}`);
  }

  const data = await response.json();
  const streamUrl = typeof data?.streamUrl === 'string' ? data.streamUrl : '';
  if (!streamUrl) return null;

  const lower = streamUrl.toLowerCase();
  const kind: DirectStream['kind'] =
    data?.kind === 'hls' || lower.includes('.m3u8') ? 'hls' :
    data?.kind === 'dash' || lower.includes('.mpd') ? 'dash' :
    data?.kind === 'mp4' || lower.includes('.mp4') ? 'mp4' : 'unknown';

  return {
    streamUrl,
    referer: typeof data?.referer === 'string' ? data.referer : undefined,
    kind,
  };
}
