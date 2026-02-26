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

export const categories: ChannelCategory[] = [
  { id: 'all', name: 'Todos', emoji: '📺' },
  { id: 'esportes', name: 'Esportes', emoji: '⚽' },
  { id: 'filmes', name: 'Filmes', emoji: '🎬' },
  { id: 'noticias', name: 'Notícias', emoji: '📰' },
  { id: 'variedades', name: 'Variedades', emoji: '🎭' },
  { id: 'infantil', name: 'Infantil', emoji: '🧸' },
  { id: 'documentarios', name: 'Documentários', emoji: '🌍' },
  { id: 'musica', name: 'Música', emoji: '🎵' },
];

export const channels: Channel[] = [
  // === ESPORTES ===
  { id: 'espn', name: 'ESPN', logo: 'https://i.imgur.com/6FQ1PZg.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/espn' },
  { id: 'espn2', name: 'ESPN 2', logo: 'https://i.imgur.com/UBnCNRo.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/espn2' },
  { id: 'espn3', name: 'ESPN 3', logo: 'https://i.imgur.com/UBnCNRo.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/espn3' },
  { id: 'espn4', name: 'ESPN 4', logo: 'https://i.imgur.com/UBnCNRo.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/espn4' },
  { id: 'sportv', name: 'SporTV', logo: 'https://i.imgur.com/8O8GXVO.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/sportv' },
  { id: 'sportv2', name: 'SporTV 2', logo: 'https://i.imgur.com/8O8GXVO.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/sportv2' },
  { id: 'sportv3', name: 'SporTV 3', logo: 'https://i.imgur.com/8O8GXVO.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/sportv3' },
  { id: 'premiere', name: 'Premiere', logo: 'https://i.imgur.com/6B7yL3g.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/premiere' },
  { id: 'bandeirantes', name: 'Band Sports', logo: 'https://i.imgur.com/rIGRLsM.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/bandsports' },
  { id: 'combate', name: 'Combate', logo: 'https://i.imgur.com/6Qj8zhT.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/combate' },
  { id: 'cazevip', name: 'CazéTV', logo: 'https://i.imgur.com/oJqNIIY.png', category: 'esportes', embed: 'https://embedtv.best/embed/channel/cazetv' },

  // === FILMES ===
  { id: 'telecine', name: 'Telecine', logo: 'https://i.imgur.com/2z38kCn.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/telecine' },
  { id: 'telecine-action', name: 'Telecine Action', logo: 'https://i.imgur.com/2z38kCn.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/telecineaction' },
  { id: 'telecine-fun', name: 'Telecine Fun', logo: 'https://i.imgur.com/2z38kCn.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/telecinefun' },
  { id: 'telecine-pipoca', name: 'Telecine Pipoca', logo: 'https://i.imgur.com/2z38kCn.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/telecinepipoca' },
  { id: 'telecine-touch', name: 'Telecine Touch', logo: 'https://i.imgur.com/2z38kCn.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/telecinetouch' },
  { id: 'hbo', name: 'HBO', logo: 'https://i.imgur.com/gTi7R5g.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/hbo' },
  { id: 'hbo2', name: 'HBO 2', logo: 'https://i.imgur.com/gTi7R5g.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/hbo2' },
  { id: 'hbofamily', name: 'HBO Family', logo: 'https://i.imgur.com/gTi7R5g.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/hbofamily' },
  { id: 'megapix', name: 'Megapix', logo: 'https://i.imgur.com/YQdpTk7.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/megapix' },
  { id: 'axn', name: 'AXN', logo: 'https://i.imgur.com/UQKV8M4.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/axn' },
  { id: 'fx', name: 'FX', logo: 'https://i.imgur.com/oHa6yAx.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/fx' },
  { id: 'tnt', name: 'TNT', logo: 'https://i.imgur.com/VbX3Yxg.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/tnt' },
  { id: 'space', name: 'Space', logo: 'https://i.imgur.com/eDDBfMz.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/space' },
  { id: 'paramount', name: 'Paramount', logo: 'https://i.imgur.com/3bQ6qFj.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/paramount' },
  { id: 'universal', name: 'Universal TV', logo: 'https://i.imgur.com/vjxPly3.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/universal' },
  { id: 'amc', name: 'AMC', logo: 'https://i.imgur.com/bCbGPib.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/amc' },
  { id: 'a&e', name: 'A&E', logo: 'https://i.imgur.com/RqBNQ7P.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/ae' },
  { id: 'cinemax', name: 'Cinemax', logo: 'https://i.imgur.com/EKXGLqN.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/cinemax' },
  { id: 'star', name: 'Star Channel', logo: 'https://i.imgur.com/EKXGLqN.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/starchannel' },
  { id: 'warner', name: 'Warner', logo: 'https://i.imgur.com/bCbGPib.png', category: 'filmes', embed: 'https://embedtv.best/embed/channel/warner' },

  // === NOTÍCIAS ===
  { id: 'globonews', name: 'GloboNews', logo: 'https://i.imgur.com/sFf3yV8.png', category: 'noticias', embed: 'https://embedtv.best/embed/channel/globonews' },
  { id: 'cnn', name: 'CNN Brasil', logo: 'https://i.imgur.com/G4KfZTT.png', category: 'noticias', embed: 'https://embedtv.best/embed/channel/cnnbrasil' },
  { id: 'bandnews', name: 'BandNews', logo: 'https://i.imgur.com/rIGRLsM.png', category: 'noticias', embed: 'https://embedtv.best/embed/channel/bandnews' },
  { id: 'recordnews', name: 'Record News', logo: 'https://i.imgur.com/9dNz0Hv.png', category: 'noticias', embed: 'https://embedtv.best/embed/channel/recordnews' },
  { id: 'jpnews', name: 'Jovem Pan News', logo: 'https://i.imgur.com/HmWNaGV.png', category: 'noticias', embed: 'https://embedtv.best/embed/channel/jovempannews' },

  // === VARIEDADES ===
  { id: 'globo', name: 'TV Globo', logo: 'https://i.imgur.com/1EsZS0b.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/globo' },
  { id: 'sbt', name: 'SBT', logo: 'https://i.imgur.com/pPB81rs.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/sbt' },
  { id: 'record', name: 'Record TV', logo: 'https://i.imgur.com/9dNz0Hv.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/record' },
  { id: 'band', name: 'Band', logo: 'https://i.imgur.com/rIGRLsM.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/band' },
  { id: 'rede-tv', name: 'RedeTV!', logo: 'https://i.imgur.com/fJZFGrL.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/redetv' },
  { id: 'multishow', name: 'Multishow', logo: 'https://i.imgur.com/VyXGZmL.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/multishow' },
  { id: 'gnt', name: 'GNT', logo: 'https://i.imgur.com/lVp2hhf.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/gnt' },
  { id: 'comedy', name: 'Comedy Central', logo: 'https://i.imgur.com/AKvfnqU.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/comedycentral' },
  { id: 'e!', name: 'E!', logo: 'https://i.imgur.com/AKvfnqU.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/e' },
  { id: 'food-network', name: 'Food Network', logo: 'https://i.imgur.com/AKvfnqU.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/foodnetwork' },
  { id: 'tlc', name: 'TLC', logo: 'https://i.imgur.com/AKvfnqU.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/tlc' },
  { id: 'lifetime', name: 'Lifetime', logo: 'https://i.imgur.com/AKvfnqU.png', category: 'variedades', embed: 'https://embedtv.best/embed/channel/lifetime' },

  // === INFANTIL ===
  { id: 'cartoon', name: 'Cartoon Network', logo: 'https://i.imgur.com/z4gxKnl.png', category: 'infantil', embed: 'https://embedtv.best/embed/channel/cartoon' },
  { id: 'disney', name: 'Disney Channel', logo: 'https://i.imgur.com/m5xGiOb.png', category: 'infantil', embed: 'https://embedtv.best/embed/channel/disney' },
  { id: 'nickelodeon', name: 'Nickelodeon', logo: 'https://i.imgur.com/PYC8nWM.png', category: 'infantil', embed: 'https://embedtv.best/embed/channel/nick' },
  { id: 'discovery-kids', name: 'Discovery Kids', logo: 'https://i.imgur.com/aNhqxeC.png', category: 'infantil', embed: 'https://embedtv.best/embed/channel/discoverykids' },
  { id: 'gloob', name: 'Gloob', logo: 'https://i.imgur.com/aNhqxeC.png', category: 'infantil', embed: 'https://embedtv.best/embed/channel/gloob' },

  // === DOCUMENTÁRIOS ===
  { id: 'discovery', name: 'Discovery', logo: 'https://i.imgur.com/tRH2kVA.png', category: 'documentarios', embed: 'https://embedtv.best/embed/channel/discovery' },
  { id: 'natgeo', name: 'NatGeo', logo: 'https://i.imgur.com/Aa3aBpE.png', category: 'documentarios', embed: 'https://embedtv.best/embed/channel/natgeo' },
  { id: 'history', name: 'History', logo: 'https://i.imgur.com/DNTwQEp.png', category: 'documentarios', embed: 'https://embedtv.best/embed/channel/history' },
  { id: 'history2', name: 'History 2', logo: 'https://i.imgur.com/DNTwQEp.png', category: 'documentarios', embed: 'https://embedtv.best/embed/channel/history2' },
  { id: 'animal-planet', name: 'Animal Planet', logo: 'https://i.imgur.com/DK8NVQR.png', category: 'documentarios', embed: 'https://embedtv.best/embed/channel/animalplanet' },

  // === MÚSICA ===
  { id: 'mtv', name: 'MTV', logo: 'https://i.imgur.com/EGQxHMj.png', category: 'musica', embed: 'https://embedtv.best/embed/channel/mtv' },
  { id: 'bis', name: 'BIS', logo: 'https://i.imgur.com/EGQxHMj.png', category: 'musica', embed: 'https://embedtv.best/embed/channel/bis' },
  { id: 'vh1', name: 'VH1', logo: 'https://i.imgur.com/EGQxHMj.png', category: 'musica', embed: 'https://embedtv.best/embed/channel/vh1' },
];
