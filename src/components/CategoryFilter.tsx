import { ContentType } from '@/types/content';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  activeCategory: ContentType;
  onCategoryChange: (category: ContentType) => void;
}

const categories: { value: ContentType; label: string; emoji: string }[] = [
  { value: 'all', label: 'Todos', emoji: '🎬' },
  { value: 'movie', label: 'Filmes', emoji: '🎥' },
  { value: 'serie', label: 'Séries', emoji: '📺' },
  { value: 'anime', label: 'Animes', emoji: '🎌' },
  { value: 'dorama', label: 'Doramas', emoji: '🇰🇷' },
];

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300',
            activeCategory === category.value
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
          )}
        >
          <span>{category.emoji}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
}
