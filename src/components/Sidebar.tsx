import { Home, Film, Tv, Radio, Sparkles, Heart, Flame } from 'lucide-react';
import { ContentType } from '@/types/content';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  activeCategory: ContentType;
  onCategoryChange: (category: ContentType) => void;
}

const sidebarItems = [
  { icon: Home, label: 'HOME', category: 'all' as ContentType, path: '/' },
  { icon: Film, label: 'FILMES', category: 'movie' as ContentType, path: '/' },
  { icon: Tv, label: 'SÉRIES', category: 'serie' as ContentType, path: '/' },
  { icon: Radio, label: 'TV', category: 'all' as ContentType, special: 'tv', path: '/tv' },
  { icon: Sparkles, label: 'ANIMES', category: 'anime' as ContentType, path: '/' },
  { icon: Heart, label: 'DORAMAS', category: 'dorama' as ContentType, path: '/' },
  { icon: Flame, label: 'ADULTO', category: 'all' as ContentType, special: 'adulto', path: '/' },
];

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleClick = (item: typeof sidebarItems[0]) => {
    if (item.special === 'adulto') {
      window.open('https://t.me/Brasilstorenet_bot?start=123', '_blank');
      return;
    }
    if (item.special === 'calendar') {
      navigate('/calendar');
      return;
    }
    if (item.special === 'tv') {
      navigate('/tv');
      return;
    }
    if (location.pathname !== '/') {
      navigate('/');
    }
    onCategoryChange(item.category);
  };

  const isItemActive = (item: typeof sidebarItems[0]) => {
    if (item.special === 'tv') return location.pathname === '/tv';
    if (item.special === 'calendar') return location.pathname === '/calendar';
    if (location.pathname !== '/') return false;
    return activeCategory === item.category;
  };

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 flex items-center justify-around px-1" style={{ height: 'calc(3rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {sidebarItems.map((item) => {
          const isActive = isItemActive(item);
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[8px] font-semibold whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[70px] bg-background border-r border-border/50 z-50 flex flex-col items-center pt-20 gap-1">
      {sidebarItems.map((item) => {
        const isActive = isItemActive(item);
        return (
          <button
            key={item.label}
            onClick={() => handleClick(item)}
            className={`flex flex-col items-center gap-1 w-full py-3 px-1 transition-colors relative ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
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
