import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { AdBanner } from '@/components/AdBanner';
import { ContentType, ContentItem } from '@/types/content';
import { fetchContent } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchContent(activeCategory, searchQuery);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: ContentType) => {
    setActiveCategory(category);
    setSearchQuery('');
  };

  // Split content into sections
  const movies = content.filter(c => c.type === 'movie');
  const series = content.filter(c => c.type === 'serie');
  const animes = content.filter(c => c.type === 'anime');
  const doramas = content.filter(c => c.type === 'dorama');

  const featuredItem = content.length > 0 ? content[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
      <Header onSearch={handleSearch} />

      {/* Main Content Area */}
      <main className={`${isMobile ? 'pt-14 pb-20' : 'pl-[70px] pt-14'}`}>
        {/* Hero Banner */}
        {!searchQuery && <HeroBanner item={featuredItem} />}

        {/* Content Sections */}
        <div className="px-4 md:px-8 py-6">
          {searchQuery && (
            <p className="text-muted-foreground mb-6">
              Resultados para: <span className="text-foreground font-medium">"{searchQuery}"</span>
            </p>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchQuery ? (
            <ContentRow title="Resultados da Busca" items={content} />
          ) : (
            <>
              {movies.length > 0 && (
                <ContentRow title="🔥 Top 10 Filmes da Semana" items={movies.slice(0, 10)} showRank />
              )}
              {series.length > 0 && (
                <ContentRow title="Séries Populares" items={series} />
              )}
              {animes.length > 0 && (
                <ContentRow title="Animes em Destaque" items={animes} />
              )}
              {doramas.length > 0 && (
                <ContentRow title="Doramas" items={doramas} />
              )}
              {movies.length > 10 && (
                <ContentRow title="Mais Filmes" items={movies.slice(10)} />
              )}
            </>
          )}
        </div>

        {/* Ad Banner */}
        <AdBanner position="bottom" />

        {/* Footer */}
        <footer className="border-t border-border/50 py-6">
          <div className="px-4 md:px-8 text-center">
            <p className="text-muted-foreground text-sm">
              © 2024 LokiFilmes. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
