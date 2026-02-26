import { useState, useEffect, useRef } from 'react';
import { Play, Star, Info } from 'lucide-react';
import { ContentItem } from '@/types/content';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  item?: ContentItem;
  isLoading?: boolean;
}

export function HeroSection({ item, isLoading }: HeroSectionProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  if (isLoading || !item) {
    return (
      <div className="relative w-full h-[70vh] md:h-[80vh] bg-gradient-to-b from-card to-background animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-20 left-0 right-0 container mx-auto px-4">
          <div className="max-w-2xl space-y-4">
            <div className="h-12 w-3/4 bg-card rounded" />
            <div className="h-6 w-1/2 bg-card rounded" />
            <div className="h-24 w-full bg-card rounded" />
          </div>
        </div>
      </div>
    );
  }

  const handleWatch = () => {
    navigate(`/watch/${item.type}/${item.id}`);
  };

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Background Image */}
      {item.backdrop && (
        <img
          src={item.backdrop}
          alt={item.title}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
      )}
      
      {/* Fallback gradient */}
      {!item.backdrop && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl space-y-4 animate-slide-up">
            {/* Badge Top 1 */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-sm font-bold rounded bg-primary text-primary-foreground">
                #1 EM ALTA
              </span>
              {item.rating && (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-background/50 backdrop-blur-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {item.title}
            </h1>

            {/* Year & Info */}
            <div className="flex items-center gap-3 text-muted-foreground">
              {item.year && <span>{item.year}</span>}
              {item.runtime && <span>• {item.runtime} min</span>}
              {item.voteCount && <span>• {item.voteCount.toLocaleString()} votos</span>}
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-muted-foreground text-base md:text-lg line-clamp-3 max-w-xl">
                {item.overview}
              </p>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button 
                size="lg" 
                className="gap-2 text-base font-semibold shadow-lg shadow-primary/30"
                onClick={handleWatch}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Assistir Agora
              </Button>
              <Button 
                size="lg" 
                variant="secondary" 
                className="gap-2 text-base bg-secondary/80 backdrop-blur-sm"
                onClick={handleWatch}
              >
                <Info className="w-5 h-5" />
                Mais Informações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
