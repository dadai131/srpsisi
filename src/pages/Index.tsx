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
  const movies = content.filter(c => c.type === 'movie' && !(c as any)._section);
  const nowPlaying = content.filter(c => (c as any)._section === 'nowplaying');
  const moviesPopular = content.filter(c => (c as any)._section === 'movies_popular');
  const moviesTopRated = content.filter(c => (c as any)._section === 'movies_top');
  const moviesUpcoming = content.filter(c => (c as any)._section === 'movies_upcoming');
  const series = content.filter(c => c.type === 'serie' && !(c as any)._section);
  const seriesPopular = content.filter(c => (c as any)._section === 'series_popular');
  const seriesTopRated = content.filter(c => (c as any)._section === 'series_top');
  const seriesToday = content.filter(c => (c as any)._section === 'series_today');
  const animes = content.filter(c => c.type === 'anime' && !(c as any)._section);
  const animesTopRated = content.filter(c => (c as any)._section === 'anime_top');
  const animesRecent = content.filter(c => (c as any)._section === 'anime_recent');
  const animesToday = content.filter(c => (c as any)._section === 'anime_today');
  const doramas = content.filter(c => c.type === 'dorama' && !(c as any)._section);
  const doramasTopRated = content.filter(c => (c as any)._section === 'dorama_top');
  const doramasRecent = content.filter(c => (c as any)._section === 'dorama_recent');

  const featuredItem = content.length > 0 ? content[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
      <Header onSearch={handleSearch} />

      <main className={`${isMobile ? 'pt-14 pb-24' : 'pl-[70px] pt-14'}`}>
        {!searchQuery && <HeroBanner item={featuredItem} />}

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
              {/* FILMES */}
              {nowPlaying.length > 0 && (
                <ContentRow title="🎬 Nos Cinemas Agora" items={nowPlaying.slice(0, 10)} showRank />
              )}
              {movies.length > 0 && (
                <ContentRow title="🔥 Top 10 Filmes da Semana" items={movies.slice(0, 10)} showRank />
              )}
              {moviesPopular.length > 0 && (
                <ContentRow title="🎥 Filmes Populares" items={moviesPopular} />
              )}
              {moviesTopRated.length > 0 && (
                <ContentRow title="⭐ Filmes Mais Bem Avaliados" items={moviesTopRated} />
              )}
              {moviesUpcoming.length > 0 && (
                <ContentRow title="📅 Em Breve nos Cinemas" items={moviesUpcoming} />
              )}

              {/* SÉRIES */}
              {series.length > 0 && (
                <ContentRow title="🔥 Top 10 Séries da Semana" items={series.slice(0, 10)} showRank />
              )}
              {seriesToday.length > 0 && (
                <ContentRow title="📺 Séries Lançadas Hoje" items={seriesToday} />
              )}
              {seriesPopular.length > 0 && (
                <ContentRow title="🎬 Séries Populares" items={seriesPopular} />
              )}
              {seriesTopRated.length > 0 && (
                <ContentRow title="⭐ Séries Mais Bem Avaliadas" items={seriesTopRated} />
              )}

              {/* ANIMES */}
              {animesToday.length > 0 && (
                <ContentRow title="📺 Animes Lançados Hoje" items={animesToday} />
              )}
              {animes.length > 0 && (
                <ContentRow title="🔥 Animes Populares" items={animes} />
              )}
              {animesTopRated.length > 0 && (
                <ContentRow title="⭐ Animes Mais Bem Avaliados" items={animesTopRated} />
              )}
              {animesRecent.length > 0 && (
                <ContentRow title="🆕 Animes Recentes" items={animesRecent} />
              )}

              {/* DORAMAS */}
              {doramas.length > 0 && (
                <ContentRow title="🔥 Doramas Populares" items={doramas} />
              )}
              {doramasTopRated.length > 0 && (
                <ContentRow title="⭐ Doramas Mais Bem Avaliados" items={doramasTopRated} />
              )}
              {doramasRecent.length > 0 && (
                <ContentRow title="🆕 Doramas Recentes" items={doramasRecent} />
              )}
            </>
          )}
        </div>

        <AdBanner position="bottom" />

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
