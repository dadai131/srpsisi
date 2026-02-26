import { useState } from 'react';
import { Search, Send, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import logoImg from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className={`fixed top-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/30 ${isMobile ? 'left-0' : 'left-[70px]'}`}>
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoImg} alt="LokiFilmes" className="w-9 h-9 rounded-lg object-cover" />
          <span className="text-lg font-bold text-foreground hidden sm:block">
            Loki<span className="text-green-500">Filmes</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar filmes, séries, animes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-secondary border-border/50 focus:border-primary text-sm"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            asChild
          >
            <a href="https://t.me/lokifilmes" target="_blank" rel="noopener noreferrer">
              <Send className="w-4 h-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            onClick={() => navigate('/calendar')}
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
