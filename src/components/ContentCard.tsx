import { useState } from 'react';
import { Play, Star, Calendar, Sparkles } from 'lucide-react';
import { ContentItem } from '@/types/content';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ContentCardProps {
  item: ContentItem;
  index?: number;
  showRank?: boolean;
  rank?: number;
}

export function ContentCard({ item, index = 0, showRank, rank }: ContentCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/watch/${item.type}/${item.id}`);
  };

  const typeLabels: Record<string, string> = {
    movie: 'Filme',
    serie: 'Série',
    anime: 'Anime',
    dorama: 'Dorama',
    trending: 'Em Alta',
    popular: 'Popular',
    nowplaying: 'Em Cartaz',
    upcoming: 'Em Breve',
    toprated: 'Top',
  };

  // Verificar se é lançamento recente (ano atual ou anterior)
  const currentYear = new Date().getFullYear();
  const itemYear = parseInt(item.year || '0');
  const isNew = itemYear >= currentYear - 1 && itemYear <= currentYear;

  return (
    <div
      className="group relative cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
        {/* Skeleton loader */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card-hover to-card animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
        )}
        
        {/* Poster Image */}
        <img
          src={item.poster}
          alt={item.title}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            isHovered ? 'scale-110' : 'scale-100'
          )}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-60'
        )} />

        {/* Rank Badge (Top 10) */}
        {showRank && rank && rank <= 10 && (
          <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <span className="text-sm font-black text-primary-foreground">{rank}</span>
          </div>
        )}

        {/* Type Badge */}
        {!showRank && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-medium rounded bg-primary/90 text-primary-foreground">
              {typeLabels[item.type] || item.type}
            </span>
          </div>
        )}

        {/* New Badge */}
        {isNew && (
          <div className="absolute top-2 left-2 ml-[calc(4rem)]">
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-500/90 text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Novo
            </span>
          </div>
        )}

        {/* Rating Badge */}
        {item.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-background/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium">{item.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center transition-all duration-300',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50 transform transition-transform duration-300 hover:scale-110">
            <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Overview on Hover */}
        {item.overview && isHovered && (
          <div className="absolute inset-x-0 bottom-16 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-xs text-muted-foreground line-clamp-3 bg-background/80 backdrop-blur-sm rounded p-2">
              {item.overview}
            </p>
          </div>
        )}

        {/* Content Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {item.year}
              </span>
            )}
            {item.genres && item.genres.length > 0 && (
              <span className="truncate">
                {item.genres.slice(0, 2).map(g => g.name).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
