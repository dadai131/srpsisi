import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import { ContentItem } from '@/types/content';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TrendingRowProps {
  items: ContentItem[];
  title?: string;
  isLoading?: boolean;
}

export function TrendingRow({ items, title = "Top 10 da Semana", isLoading }: TrendingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">{title}</h2>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[180px] md:w-[220px]">
                <div className="aspect-[2/3] rounded-lg bg-card animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="py-8 relative group">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-primary">🔥</span> {title}
        </h2>
        
        {/* Scroll Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 translate-y-4 z-10 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 translate-y-4 z-10 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
        >
          {items.map((item, index) => (
            <TrendingCard key={item.id} item={item} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TrendingCardProps {
  item: ContentItem;
  rank: number;
}

function TrendingCard({ item, rank }: TrendingCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/watch/${item.type}/${item.id}`);
  };

  return (
    <div 
      className="flex-shrink-0 flex items-end cursor-pointer group/card"
      onClick={handleClick}
    >
      {/* Rank Number */}
      <div className="relative -mr-6 z-10">
        <span 
          className={cn(
            "text-[120px] md:text-[150px] font-black leading-none select-none",
            "bg-gradient-to-b from-transparent via-background to-background bg-clip-text",
            "[-webkit-text-stroke:2px_hsl(var(--primary))]"
          )}
          style={{ 
            color: 'transparent',
            WebkitTextStroke: '3px hsl(var(--primary))',
          }}
        >
          {rank}
        </span>
      </div>

      {/* Card */}
      <div className="relative w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden shadow-xl transition-transform duration-300 group-hover/card:scale-105">
        <img
          src={item.poster}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary mx-auto mb-2">
              <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
            <p className="text-xs text-center font-medium text-foreground line-clamp-2">
              {item.title}
            </p>
          </div>
        </div>

        {/* Rating Badge */}
        {item.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium">{item.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
