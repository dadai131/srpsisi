import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ContentGrid } from '@/components/ContentGrid';
import { HeroSection } from '@/components/HeroSection';
import { TrendingRow } from '@/components/TrendingRow';
import { GenreFilter } from '@/components/GenreFilter';
import { ContentType, ContentItem } from '@/types/content';
import { fetchContent, searchContent, fetchTrending, fetchByGenre, SearchResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  
  // Hero e Trending
  const [heroItem, setHeroItem] = useState<ContentItem | undefined>();
  const [trendingMovies, setTrendingMovies] = useState<ContentItem[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<ContentItem[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  
  // Gêneros
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  // Carregar trending para Hero e Rows
  useEffect(() => {
    const loadTrending = async () => {
      setIsTrendingLoading(true);
      const [movies, series] = await Promise.all([
        fetchTrending('movie', 'week'),
        fetchTrending('tv', 'week'),
      ]);
      setTrendingMovies(movies);
      setTrendingSeries(series);
      if (movies.length > 0) {
        setHeroItem(movies[0]);
      }
      setIsTrendingLoading(false);
    };
    loadTrending();
  }, []);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    try {
      let result: SearchResult;
      
      if (searchQuery && searchQuery.trim()) {
        result = await searchContent(searchQuery, currentPage);
      } else if (selectedGenre) {
        const genreResult = await fetchByGenre(selectedGenre, 'movie', currentPage);
        result = {
          items: genreResult.items,
          totalResults: genreResult.totalResults,
          totalPages: genreResult.totalPages,
          currentPage: currentPage,
        };
      } else {
        result = await fetchContent(activeCategory, currentPage);
      }
      
      setContent(result.items);
      setTotalPages(result.totalPages);
      setTotalResults(result.totalResults);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, currentPage, selectedGenre]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSelectedGenre(null);
  };

  const handleCategoryChange = (category: ContentType) => {
    setActiveCategory(category);
    setSearchQuery('');
    setCurrentPage(1);
    setTotalPages(0);
    setSelectedGenre(null);
  };

  const handleGenreChange = (genreId: number | null) => {
    setSelectedGenre(genreId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Mostrar hero e trending apenas na página inicial sem busca/filtro
  const showHeroAndTrending = !searchQuery && !selectedGenre && activeCategory === 'all' && currentPage === 1;

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      {/* Hero Section */}
      {showHeroAndTrending && (
        <section className="pt-16 md:pt-20">
          <HeroSection item={heroItem} isLoading={isTrendingLoading} />
        </section>
      )}

      {/* Trending Movies Row */}
      {showHeroAndTrending && (
        <TrendingRow title="Top 10 Filmes da Semana" items={trendingMovies} isLoading={isTrendingLoading} />
      )}

      {/* Trending Series Row */}
      {showHeroAndTrending && (
        <TrendingRow title="Top 10 Séries da Semana" items={trendingSeries} isLoading={isTrendingLoading} />
      )}

      {/* Simple Hero for non-home views */}
      {!showHeroAndTrending && (
        <section className="pt-24 md:pt-28 pb-4">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="text-foreground">Descubra seu próximo </span>
                <span className="text-gradient">favorito</span>
              </h1>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
            <div className="flex-shrink-0">
              <GenreFilter
                selectedGenre={selectedGenre}
                onGenreChange={handleGenreChange}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {searchQuery && (
            <p className="text-muted-foreground mb-6">
              Resultados para: <span className="text-foreground font-medium">"{searchQuery}"</span>
              {totalResults > 0 && (
                <span className="ml-2">({totalResults} encontrados)</span>
              )}
            </p>
          )}
          
          {selectedGenre && (
            <p className="text-muted-foreground mb-6">
              Filtrando por gênero
              {totalResults > 0 && (
                <span className="ml-2">({totalResults} encontrados)</span>
              )}
            </p>
          )}
          
          <ContentGrid items={content} isLoading={isLoading} />

          {/* Paginação Melhorada */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
                {/* Primeira página */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1}
                  title="Primeira página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                
                {/* Página anterior */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Páginas */}
                {(() => {
                  const pages: number[] = [];
                  const maxVisible = 7;
                  
                  if (totalPages <= maxVisible) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    
                    let start = Math.max(2, currentPage - 2);
                    let end = Math.min(totalPages - 1, currentPage + 2);
                    
                    if (currentPage <= 3) {
                      end = 5;
                    } else if (currentPage >= totalPages - 2) {
                      start = totalPages - 4;
                    }
                    
                    if (start > 2) pages.push(-1); // ellipsis
                    
                    for (let i = start; i <= end; i++) pages.push(i);
                    
                    if (end < totalPages - 1) pages.push(-2); // ellipsis
                    
                    pages.push(totalPages);
                  }
                  
                  return pages.map((pageNum, idx) => {
                    if (pageNum < 0) {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  });
                })()}
                
                {/* Próxima página */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Última página */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages}
                  title="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Info da página */}
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-8 pb-20">
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
