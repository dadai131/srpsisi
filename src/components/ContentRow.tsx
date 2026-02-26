import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
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
    <section className="mb-8">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      {/* Scrollable Row */}
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-2 scroll-smooth"
        >
          {items.map((item, index) => {
            const type = item.type === 'movie' ? 'movie' : 'serie';
            return (
              <div
                key={item.id + index}
                className="flex-shrink-0 w-[140px] md:w-[160px] cursor-pointer group/card relative"
                onClick={() => navigate(`/watch/${type}/${item.id}`)}
              >
                {showRank && (
                  <span className="absolute -left-2 -bottom-2 text-6xl font-black text-foreground/10 z-0 select-none">
                    {index + 1}
                  </span>
                )}
                <div className="relative rounded-lg overflow-hidden hover-lift aspect-[2/3]">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
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
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </section>
  );
}
