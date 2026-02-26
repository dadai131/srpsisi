import { useState, useEffect } from 'react';
import { Genre } from '@/types/content';
import { fetchGenres } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface GenreFilterProps {
  selectedGenre: number | null;
  onGenreChange: (genreId: number | null) => void;
  mediaType?: 'movie' | 'tv';
}

export function GenreFilter({ selectedGenre, onGenreChange, mediaType = 'movie' }: GenreFilterProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      setIsLoading(true);
      const genreList = await fetchGenres(mediaType);
      setGenres(genreList);
      setIsLoading(false);
    };
    loadGenres();
  }, [mediaType]);

  const selectedGenreName = genres.find(g => g.id === selectedGenre)?.name;

  if (isLoading) {
    return (
      <div className="h-10 w-32 bg-card rounded-lg animate-pulse" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span>🎭</span>
          <span>{selectedGenreName || 'Gêneros'}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 max-h-80 overflow-y-auto">
        <DropdownMenuItem 
          onClick={() => onGenreChange(null)}
          className={cn(!selectedGenre && "bg-primary/10 text-primary")}
        >
          Todos os Gêneros
        </DropdownMenuItem>
        {genres.map((genre) => (
          <DropdownMenuItem
            key={genre.id}
            onClick={() => onGenreChange(genre.id)}
            className={cn(selectedGenre === genre.id && "bg-primary/10 text-primary")}
          >
            {genre.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Versão com chips horizontais
export function GenreChips({ selectedGenre, onGenreChange, mediaType = 'movie' }: GenreFilterProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      setIsLoading(true);
      const genreList = await fetchGenres(mediaType);
      setGenres(genreList);
      setIsLoading(false);
    };
    loadGenres();
  }, [mediaType]);

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-card rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
      <button
        onClick={() => onGenreChange(null)}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0',
          !selectedGenre
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
        )}
      >
        Todos
      </button>
      {genres.map((genre) => (
        <button
          key={genre.id}
          onClick={() => onGenreChange(genre.id)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0',
            selectedGenre === genre.id
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
          )}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
}
