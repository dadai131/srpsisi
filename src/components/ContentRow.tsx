import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, Star } from 'lucide-react';
import { ContentItem } from '@/types/content';
import { useNavigate } from 'react-router-dom';

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  showRank?: boolean;
}

export function ContentRow({ title, items, showRank }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      {/* Title */}
      <div className="flex items-center gap-2 mb-5 px-2">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      {/* Scrollable Row */}
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-7 h-7 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-2 scroll-smooth snap-x snap-mandatory"
        >
          {items.map((item, index) => {
            const type = item.type === 'movie' ? 'movie' : 'serie';
            return (
              <div
                key={item.id + '-' + index}
                className="flex-shrink-0 cursor-pointer relative snap-start"
                style={{ width: showRank ? '180px' : '140px' }}
                onClick={() => navigate(`/watch/${type}/${item.id}`)}
              >
                {/* Rank Number */}
                {showRank && (
                  <span
                    className="absolute -left-4 bottom-8 z-10 select-none pointer-events-none"
                    style={{
                      fontSize: '120px',
                      fontWeight: 900,
                      lineHeight: 1,
                      color: 'transparent',
                      WebkitTextStroke: '2px hsl(var(--primary))',
                      textShadow: '0 0 20px hsl(var(--primary) / 0.3)',
                    }}
                  >
                    {index + 1}
                  </span>
                )}

                {/* Card */}
                <div className={`relative rounded-lg overflow-hidden hover-lift aspect-[2/3] ${showRank ? 'ml-6' : ''}`}>
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop';
                    }}
                  />

                  {/* Rating Badge */}
                  {item.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold px-2 py-1 rounded-md">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {item.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                </div>

                <p className="mt-2 text-xs font-medium text-foreground truncate">{item.title}</p>
                {item.year && (
                  <p className="text-[10px] text-muted-foreground">{item.year}</p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-7 h-7 text-foreground" />
        </button>
      </div>
    </section>
  );
}
