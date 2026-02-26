import { useState } from 'react';
import { Play, Star } from 'lucide-react';
import { ContentItem } from '@/types/content';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ContentCardProps {
  item: ContentItem;
  index?: number;
}

export function ContentCard({ item, index = 0 }: ContentCardProps) {
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
  };

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

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-medium rounded bg-primary/90 text-primary-foreground">
            {typeLabels[item.type] || item.type}
          </span>
        </div>

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

        {/* Content Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
            {item.title}
          </h3>
          {item.year && (
            <p className="text-xs text-muted-foreground">{item.year}</p>
          )}
        </div>
      </div>
    </div>
  );
}
