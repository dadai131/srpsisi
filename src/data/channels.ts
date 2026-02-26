export interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
  embed: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  emoji: string;
}

const EMBED_BASE = 'https://www2.embedtv.best';
const IMG_BASE = 'https://embedtv.best/assets/images';

export const categories: ChannelCategory[] = [
  { id: 'all', name: 'Todos', emoji: '📺' },
  { id: 'esportes', name: 'Esportes', emoji: '⚽' },
  { id: 'filmes', name: 'Filmes e Séries', emoji: '🎬' },
  { id: 'noticias', name: 'Notícias', emoji: '📰' },
  { id: 'abertos', name: 'Abertos', emoji: '📡' },
  { id: 'infantil', name: 'Infantil', emoji: '🧸' },
  { id: 'documentarios', name: 'Documentários', emoji: '🌍' },
  { id: 'variedades', name: 'Variedades', emoji: '🎭' },
  { id: 'bbb', name: 'BBB 2026', emoji: '🏠' },
];

function ch(id: string, name: string, img: string, category: string): Channel {
  return { id, name, logo: `${IMG_BASE}/${img}.png`, category, embed: `${EMBED_BASE}/${id}` };
}

export const channels: Channel[] = [
  // === BBB ===
  ch('bbb', 'BBB - Mosaico', 'bbb', 'bbb'),
  ch('bbb1', 'BBB - 1', 'bbb', 'bbb'),
  ch('bbb2', 'BBB - 2', 'bbb', 'bbb'),
  ch('bbb3', 'BBB - 3', 'bbb', 'bbb'),
  ch('bbb4', 'BBB - 4', 'bbb', 'bbb'),
  ch('bbb5', 'BBB - 5', 'bbb', 'bbb'),
  ch('bbb6', 'BBB - 6', 'bbb', 'bbb'),
  ch('bbb7', 'BBB - 7', 'bbb', 'bbb'),
  ch('bbb8', 'BBB - 8', 'bbb', 'bbb'),
  ch('bbb9', 'BBB - 9', 'bbb', 'bbb'),
  ch('bbb10', 'BBB - 10', 'bbb', 'bbb'),

  // === ESPORTES ===
  ch('bandsports', 'Band Sports', 'bandsports', 'esportes'),
  ch('caze1', 'CazéTV 1', 'cazetv', 'esportes'),
  ch('caze2', 'CazéTV 2', 'cazetv', 'esportes'),
  ch('caze3', 'CazéTV 3', 'cazetv', 'esportes'),
  ch('combate', 'Combate', 'combate', 'esportes'),
  ch('disneyplus1', 'Disney Plus 1', 'disneyplus', 'esportes'),
  ch('disneyplus2', 'Disney Plus 2', 'disneyplus', 'esportes'),
  ch('disneyplus3', 'Disney Plus 3', 'disneyplus', 'esportes'),
  ch('espn', 'ESPN', 'espn', 'esportes'),
  ch('espn2', 'ESPN 2', 'espn2', 'esportes'),
  ch('espn3', 'ESPN 3', 'espn3', 'esportes'),
  ch('espn4', 'ESPN 4', 'espn4', 'esportes'),
  ch('espn5', 'ESPN 5', 'espn5', 'esportes'),
  ch('espn6', 'ESPN 6', 'espn6', 'esportes'),
  ch('max1', 'Max 1', 'max', 'esportes'),
  ch('max2', 'Max 2', 'max', 'esportes'),
  ch('max3', 'Max 3', 'max', 'esportes'),
  ch('paramountplus', 'Paramount Plus', 'paramountplus', 'esportes'),
  ch('paramountplus2', 'Paramount Plus 2', 'paramountplus', 'esportes'),
  ch('premiere', 'Premiere 1', 'premiere', 'esportes'),
  ch('premiere2', 'Premiere 2', 'premiere', 'esportes'),
  ch('premiere3', 'Premiere 3', 'premiere', 'esportes'),
  ch('premiere4', 'Premiere 4', 'premiere', 'esportes'),
  ch('premiere5', 'Premiere 5', 'premiere', 'esportes'),
  ch('premiere6', 'Premiere 6', 'premiere', 'esportes'),
  ch('premiere7', 'Premiere 7', 'premiere', 'esportes'),
  ch('premiere8', 'Premiere 8', 'premiere', 'esportes'),
  ch('primevideo', 'Prime Video', 'primevideo', 'esportes'),
  ch('primevideo2', 'Prime Video 2', 'primevideo', 'esportes'),
  ch('sportv', 'SporTV', 'sportv', 'esportes'),
  ch('sportv2', 'SporTV 2', 'sportv2', 'esportes'),
  ch('sportv3', 'SporTV 3', 'sportv3', 'esportes'),
  ch('sportv4', 'SporTV 4', 'sportv4', 'esportes'),
  ch('ufcfightpass', 'UFC Fight Pass', 'ufcfightpass', 'esportes'),

  // === INFANTIL ===
  ch('24h_dragonball', '24H Dragon Ball Z', '24h', 'infantil'),
  ch('24h_odeiachris', '24H Todo Mundo Odeia o Cris', '24h', 'infantil'),
  ch('24h_simpsons', '24H Os Simpsons', '24h', 'infantil'),
  ch('cartoonito', 'Cartoonito', 'cartoonito', 'infantil'),
  ch('cartoonnetwork', 'Cartoon Network', 'cartoonnetwork', 'infantil'),
  ch('discoverykids', 'Discovery Kids', 'discoverykids', 'infantil'),
  ch('gloob', 'Gloob', 'gloob', 'infantil'),
  ch('nickelodeon', 'Nickelodeon', 'nickelodeon', 'infantil'),
  ch('nickjunior', 'Nick Junior', 'nickjr', 'infantil'),

  // === DOCUMENTÁRIOS ===
  ch('animalplanet', 'Animal Planet', 'animalplanet', 'documentarios'),
  ch('discoverychannel', 'Discovery Channel', 'discoverychannel', 'documentarios'),
  ch('discoveryhh', 'Discovery H&H', 'discoveryhh', 'documentarios'),
  ch('discoveryid', 'Discovery ID', 'discoverychannel', 'documentarios'),
  ch('discoveryscience', 'Discovery Science', 'discoveryscience', 'documentarios'),
  ch('discoverytheather', 'Discovery Theater', 'discoverytheater', 'documentarios'),
  ch('discoveryturbo', 'Discovery Turbo', 'discoveryturbo', 'documentarios'),
  ch('discoveryword', 'Discovery World', 'discoveryworld', 'documentarios'),
  ch('fish', 'Fish TV', 'fishtv', 'documentarios'),
  ch('history', 'History', 'history', 'documentarios'),
  ch('history2', 'History 2', 'history2', 'documentarios'),

  // === FILMES E SÉRIES ===
  ch('adultswim', 'Adult Swim', 'adultswim', 'filmes'),
  ch('ae', 'A&E', 'ae', 'filmes'),
  ch('axn', 'AXN', 'axn', 'filmes'),
  ch('cinemax', 'Cinemax', 'cinemax', 'filmes'),
  ch('comedycentral', 'Comedy Central', 'comedycentral', 'filmes'),
  ch('gnt', 'GNT', 'gnt', 'filmes'),
  ch('hbo', 'HBO', 'hbo', 'filmes'),
  ch('hbo2', 'HBO 2', 'hbo2', 'filmes'),
  ch('hbofamily', 'HBO Family', 'hbofamily', 'filmes'),
  ch('hbomundi', 'HBO Mundi', 'hbomundi', 'filmes'),
  ch('hboplus', 'HBO Plus', 'hboplus', 'filmes'),
  ch('hbopop', 'HBO POP', 'hbopop', 'filmes'),
  ch('hboxtreme', 'HBO Xtreme', 'hboxtreme', 'filmes'),
  ch('hgtv', 'HGTV', 'hgtv', 'filmes'),
  ch('megapix', 'Megapix', 'megapix', 'filmes'),
  ch('off', 'OFF', 'off', 'filmes'),
  ch('paramountchannel', 'Paramount', 'paramountchannel', 'filmes'),
  ch('sonychannel', 'Sony Channel', 'sonychannel', 'filmes'),
  ch('space', 'Space', 'space', 'filmes'),
  ch('starchannel', 'Star Channel', 'starchannel', 'filmes'),
  ch('studiouniversal', 'Studio Universal', 'studiouniversal', 'filmes'),
  ch('tcm', 'TCM', 'tcm', 'filmes'),
  ch('telecineaction', 'Telecine Action', 'telecineaction', 'filmes'),
  ch('telecinecult', 'Telecine Cult', 'telecinecult', 'filmes'),
  ch('telecinefun', 'Telecine Fun', 'telecinefun', 'filmes'),
  ch('telecinepipoca', 'Telecine Pipoca', 'telecinepipoca', 'filmes'),
  ch('telecinepremium', 'Telecine Premium', 'telecinepremium', 'filmes'),
  ch('telecinetouch', 'Telecine Touch', 'telecinetouch', 'filmes'),
  ch('tlc', 'TLC', 'tlc', 'filmes'),
  ch('tnt', 'TNT', 'tnt', 'filmes'),
  ch('tntnovelas', 'TNT Novelas', 'tntnovelas', 'filmes'),
  ch('tntseries', 'TNT Series', 'tntseries', 'filmes'),
  ch('universaltv', 'Universal TV', 'universaltv', 'filmes'),
  ch('warnerchannel', 'Warner Channel', 'warnerchannel', 'filmes'),

  // === NOTÍCIAS ===
  ch('band', 'Band', 'band', 'noticias'),
  ch('bandnews', 'Band News', 'bandnews', 'noticias'),
  ch('cnnbrasil', 'CNN Brasil', 'cnnbrasil', 'noticias'),
  ch('globonews', 'Globo News', 'globonews', 'noticias'),
  ch('record', 'Record', 'record', 'noticias'),
  ch('sbt', 'SBT', 'sbt', 'noticias'),

  // === ABERTOS ===
  ch('aparecida', 'TV Aparecida', 'tvaparecida', 'abertos'),
  ch('cancaonova', 'Canção Nova', 'cancaonova', 'abertos'),
  ch('cultura', 'TV Cultura', 'cultura', 'abertos'),
  ch('globorj', 'Globo RJ', 'globorj', 'abertos'),
  ch('globosp', 'Globo SP', 'globosp', 'abertos'),
  ch('globomg', 'Globo MG', 'globosp', 'abertos'),
  ch('globoam', 'Globo AM', 'globosp', 'abertos'),
  ch('globors', 'Globo RS', 'globosp', 'abertos'),
  ch('mtv', 'MTV', 'mtv', 'abertos'),
  ch('multishow', 'Multishow', 'multishow', 'abertos'),
  ch('viva', 'VIVA', 'viva', 'abertos'),

  // === VARIEDADES ===
  ch('foodnetwork', 'Food Network', 'foodnetwork', 'variedades'),
  ch('masterchef', 'MasterChef', 'masterchef', 'variedades'),
];
