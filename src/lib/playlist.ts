import { Channel, categories } from '@/data/channels';

export type PlaylistFormat = 'm3u' | 'm3u8' | 'hls' | 'dash' | 'ts' | 'xtream' | 'xmltv';

const catName = (id: string) => categories.find(c => c.id === id)?.name ?? id;

const TRIAL_DAYS = 5;

export interface TrialAccess {
  username: string;
  password: string;
  token: string;
  /** Unix seconds */
  exp: number;
  expLabel: string;
  days: number;
}

const b64url = (s: string) =>
  btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const decodeToken = (token: string): { c?: string; exp?: number } | null => {
  try {
    const b = token.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)));
  } catch {
    return null;
  }
};

const rand = (n: number) => {
  const chars = 'abcdefghijkmnopqrstuvwxyz23456789';
  const buf = new Uint8Array(n);
  (globalThis.crypto ?? ({ getRandomValues: () => buf } as never)).getRandomValues(buf);
  return Array.from(buf, b => chars[b % chars.length]).join('');
};

/** Creates a free access pass valid for 5 days. */
export function createTrial(days = TRIAL_DAYS): TrialAccess {
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const username = `free_${rand(6)}`;
  const password = rand(8);
  return {
    username,
    password,
    token: b64url(JSON.stringify({ u: username, exp })),
    exp,
    expLabel: new Date(exp * 1000).toLocaleString('pt-BR'),
    days,
  };
}

export const siteOrigin = () =>
  (typeof window !== 'undefined' ? window.location.origin : 'https://lokifilms.qzz.io').replace(/\/$/, '');

/**
 * Stream URL served through our own site (never exposes the upstream source).
 * Format: /live/<token>/playlist.m3u
 * Updated to return a single playlist URL as requested by the user.
 */
export function streamUrl(ch: Channel, format: PlaylistFormat, trial?: TrialAccess): string {
  const token = trial?.token ?? createTrial().token;
  return `${siteOrigin()}/live/${token}/${ch.id}.m3u8`;
}

/** M3U / M3U8 / HLS / DASH / TS playlist (extended M3U with logos and groups). */
export function buildM3U(list: Channel[], format: PlaylistFormat = 'm3u8', trial?: TrialAccess): string {
  const t = trial ?? createTrial();
  const lines = [
    `#EXTM3U x-tvg-url="${siteOrigin()}/live/${t.token}/xmltv.xml"`,
    `#PLAYLIST:LokiFilmes TV - Acesso grátis ${t.days} dias (expira ${t.expLabel})`,
  ];
  for (const ch of list) {
    lines.push(
      `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${catName(ch.category)}",${ch.name}`
    );
    if (format === 'ts') lines.push('#EXTVLCOPT:network-caching=1500');
    // For M3U playlists, we now point each channel to its unique proxied URL
    lines.push(streamUrl(ch, format, t));
  }
  return lines.join('\n') + '\n';
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function xmltvTime(d: Date): string {
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(
    d.getUTCMinutes()
  )}00 +0000`;
}

/** XMLTV guide generated from the channel list (rolling 24h placeholder blocks). */
export function buildXMLTV(list: Channel[], hours = 24, blockHours = 2): string {
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  const out: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<tv generator-info-name="LokiFilmes TV">',
  ];
  for (const ch of list) {
    out.push(
      `  <channel id="${esc(ch.id)}">`,
      `    <display-name>${esc(ch.name)}</display-name>`,
      `    <icon src="${esc(ch.logo)}" />`,
      '  </channel>'
    );
  }
  for (const ch of list) {
    for (let h = 0; h < hours; h += blockHours) {
      const start = new Date(now.getTime() + h * 3600_000);
      const stop = new Date(start.getTime() + blockHours * 3600_000);
      out.push(
        `  <programme start="${xmltvTime(start)}" stop="${xmltvTime(stop)}" channel="${esc(ch.id)}">`,
        `    <title lang="pt">${esc(ch.name)} - Ao Vivo</title>`,
        `    <desc lang="pt">Transmissão ao vivo de ${esc(ch.name)} (${esc(catName(ch.category))}).</desc>`,
        `    <category lang="pt">${esc(catName(ch.category))}</category>`,
        '  </programme>'
      );
    }
  }
  out.push('</tv>');
  return out.join('\n') + '\n';
}

/** Xtream Codes API compatible payload (get_live_streams + server_info). */
export function buildXtream(list: Channel[], trial?: TrialAccess): string {
  const t = trial ?? createTrial();
  const origin = siteOrigin();
  const payload = {
    user_info: {
      username: t.username,
      password: t.password,
      auth: 1,
      status: 'Active',
      is_trial: '1',
      exp_date: String(t.exp),
      max_connections: '1',
      allowed_output_formats: ['m3u8', 'ts'],
    },
    server_info: {
      url: origin.replace(/^https?:\/\//, ''),
      port: '80',
      https_port: '443',
      server_protocol: 'https',
      timezone: 'America/Sao_Paulo',
    },
    categories: categories
      .filter(c => c.id !== 'all')
      .map((c, i) => ({ category_id: String(i + 1), category_name: c.name, parent_id: 0 })),
    live_streams: list.map((ch, i) => ({
      num: i + 1,
      name: ch.name,
      stream_type: 'live',
      stream_id: i + 1,
      stream_icon: ch.logo,
      epg_channel_id: ch.id,
      category_name: catName(ch.category),
      direct_source: streamUrl(ch, 'm3u8', t),
      tv_archive: 0,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function buildPlaylist(list: Channel[], format: PlaylistFormat, trial?: TrialAccess): string {
  if (format === 'xmltv') return buildXMLTV(list);
  if (format === 'xtream') return buildXtream(list, trial);
  return buildM3U(list, format, trial);
}

export const formatMeta: Record<
  PlaylistFormat,
  { label: string; ext: string; mime: string; hint: string }
> = {
  m3u: { label: 'M3U', ext: 'm3u', mime: 'audio/x-mpegurl', hint: 'Lista clássica de canais' },
  m3u8: { label: 'M3U8', ext: 'm3u8', mime: 'application/vnd.apple.mpegurl', hint: 'Lista UTF-8' },
  hls: { label: 'HLS', ext: 'm3u8', mime: 'application/vnd.apple.mpegurl', hint: 'Links .m3u8 via HTTP' },
  dash: { label: 'MPEG-DASH', ext: 'mpd.m3u', mime: 'text/plain', hint: 'Links .mpd adaptativos' },
  ts: { label: 'MPEG-TS', ext: 'm3u', mime: 'audio/x-mpegurl', hint: 'Fluxo .ts com cache' },
  xtream: { label: 'Xtream Codes', ext: 'json', mime: 'application/json', hint: 'Servidor / usuário / senha' },
  xmltv: { label: 'XMLTV', ext: 'xml', mime: 'application/xml', hint: 'Guia EPG dos canais' },
};

export function downloadText(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}