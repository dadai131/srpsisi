import { useState } from 'react';
import { Search, Menu, X, Film, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-110">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold hidden sm:block">
              <span className="text-primary">Stream</span>
              <span className="text-foreground">Hub</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar filmes, séries, animes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border/50 focus:border-primary transition-colors"
              />
            </div>
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/calendar')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendário
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border/50"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/calendar');
                  setIsMenuOpen(false);
                }}
                className="justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendário
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
