import { ContentItem } from '@/types/content';
import { ContentCard } from './ContentCard';

interface ContentGridProps {
  items: ContentItem[];
  isLoading?: boolean;
}

export function ContentGrid({ items, isLoading }: ContentGridProps) {
  if (isLoading) {
    return (
      <div className="content-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-lg bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="text-4xl">🎬</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum conteúdo encontrado</h3>
        <p className="text-muted-foreground">Tente buscar por outro termo ou categoria</p>
      </div>
    );
  }

  return (
    <div className="content-grid">
      {items.map((item, index) => (
        <ContentCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}
