import { Star, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentItem } from '@/types/content';
import { useNavigate } from 'react-router-dom';

interface HeroBannerProps {
  item: ContentItem | null;
}

const BACKDROP_FALLBACK = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=800&fit=crop';

export function HeroBanner({ item }: HeroBannerProps) {
  const navigate = useNavigate();

  if (!item) return null;

  const backdrop = item.backdrop || BACKDROP_FALLBACK;
  const type = item.type === 'movie' ? 'movie' : 'serie';

  return (
    <div className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
      {/* Backdrop Image */}
      <img
        src={backdrop}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { e.currentTarget.src = BACKDROP_FALLBACK; }}
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="px-6 md:px-12 max-w-xl">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              #1 EM ALTA
            </span>
            {item.rating && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                {item.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-2 leading-tight">
            {item.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            {item.year && <span>{item.year}</span>}
            {item.rating && <span>{Math.round(item.rating * 100)} votos</span>}
          </div>

          {/* Overview */}
          {item.overview && (
            <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
              {item.overview}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="gap-2 font-bold"
              onClick={() => navigate(`/watch/${type}/${item.id}`)}
            >
              <Play className="w-5 h-5 fill-current" />
              Assistir Agora
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-muted-foreground/30 text-foreground"
            >
              <Info className="w-5 h-5" />
              Mais Informações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
