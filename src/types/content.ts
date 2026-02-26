export type ContentType = 'all' | 'movie' | 'serie' | 'anime' | 'dorama' | 'trending' | 'popular' | 'nowplaying' | 'upcoming' | 'toprated';

export interface Genre {
  id: number;
  name: string;
}

export interface ContentItem {
  id: string;
  title: string;
  poster: string;
  type: ContentType;
  year?: string;
  rating?: number;
  backdrop?: string;
  overview?: string;
  genres?: Genre[];
  runtime?: number;
  voteCount?: number;
}

export interface CalendarItem {
  id: string;
  title: string;
  poster: string;
  releaseDate: string;
  type: ContentType;
  episodeTitle?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  status?: 'Atualizado' | 'Hoje' | 'Futuro' | 'Atrasado';
  backdropPath?: string;
  imdbId?: string;
  tmdbId?: string;
}

export interface PlayerTheme {
  color: string;
  transparent: boolean;
  noEpList: boolean;
}
