export type ContentType = 'all' | 'movie' | 'serie' | 'anime' | 'dorama';

export interface ContentItem {
  id: string;
  title: string;
  poster: string;
  type: ContentType;
  year?: string;
  rating?: number;
  backdrop?: string;
  overview?: string;
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
