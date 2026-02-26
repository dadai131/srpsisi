import { Home, Film, Tv, Radio, Sparkles, Heart, Ticket, Calendar } from 'lucide-react';
import { ContentType } from '@/types/content';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  activeCategory: ContentType;
  onCategoryChange: (category: ContentType) => void;
}

const sidebarItems = [
  { icon: Home, label: 'HOME', category: 'all' as ContentType },
  { icon: Film, label: 'FILMES', category: 'movie' as ContentType },
  { icon: Tv, label: 'SÉRIES', category: 'serie' as ContentType },
  { icon: Radio, label: 'TV AO VIVO', category: 'all' as ContentType, special: 'tv' },
  { icon: Sparkles, label: 'ANIMES', category: 'anime' as ContentType },
  { icon: Heart, label: 'DORAMAS', category: 'dorama' as ContentType },
  { icon: Ticket, label: 'TICKET', category: 'all' as ContentType, special: 'ticket' },
  { icon: Calendar, label: 'AGENDA', category: 'all' as ContentType, special: 'calendar' },
];

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleClick = (item: typeof sidebarItems[0]) => {
    if (item.special === 'calendar') {
      navigate('/calendar');
      return;
    }
    onCategoryChange(item.category);
  };

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 flex justify-around items-center h-16 px-1">
        {sidebarItems.slice(0, 5).map((item) => {
          const isActive = !item.special && activeCategory === item.category;
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[70px] bg-background border-r border-border/50 z-50 flex flex-col items-center pt-20 gap-1">
      {sidebarItems.map((item) => {
        const isActive = !item.special && activeCategory === item.category;
        return (
          <button
            key={item.label}
            onClick={() => handleClick(item)}
            className={`flex flex-col items-center gap-1 w-full py-3 px-1 transition-colors relative ${
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />
            )}
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-tight text-center">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
