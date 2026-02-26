import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ContentGrid } from '@/components/ContentGrid';
import { AdBanner } from '@/components/AdBanner';
import { ContentType, ContentItem } from '@/types/content';
import { fetchContent } from '@/lib/api';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-28 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-foreground">Descubra seu próximo </span>
              <span className="text-gradient">favorito</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Explore milhares de filmes, séries, animes e doramas em um só lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {searchQuery && (
            <p className="text-muted-foreground mb-6">
              Resultados para: <span className="text-foreground font-medium">"{searchQuery}"</span>
            </p>
          )}
          <ContentGrid items={content} isLoading={isLoading} />
        </div>
      </section>

      {/* Ad Banner */}
      <AdBanner position="bottom" />

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 StreamHub. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
