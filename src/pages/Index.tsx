import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
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
  const sec = (s: string) => content.filter(c => (c as any)._section === s);
  const moviesTrending = sec('movies_trending');
  const nowPlaying = sec('nowplaying');
  const moviesPopular = sec('movies_popular');
  const moviesTopRated = sec('movies_top');
  const seriesTrending = sec('series_trending');
  const seriesPopular = sec('series_popular');
  const seriesTopRated = sec('series_top');
  const seriesToday = sec('series_today');
  const seriesNew = seriesToday.length ? seriesToday : seriesPopular.slice(10);
  const animes = sec('anime');
  const animesTopRated = sec('anime_top');
  const animesRecent = sec('anime_recent');
  const animesToday = sec('anime_today');
  const doramas = sec('dorama');
  const doramasTopRated = sec('dorama_top');
  const doramasRecent = sec('dorama_recent');

  const movieRows = [
    { id: 'f-alta', pill: '🔥 Filmes em Alta', title: '🔥 Filmes em Alta', items: moviesTrending },
    { id: 'f-top', pill: '🏆 Top Filmes', title: '🏆 Top 10 Filmes', items: moviesPopular.slice(0, 10), rank: true },
    { id: 'f-mais', pill: '👀 Mais Assistidos', title: '👀 Filmes Mais Assistidos', items: moviesPopular },
    { id: 'f-lanc', pill: '🆕 Lançamentos', title: '🆕 Lançamentos', items: nowPlaying },
    { id: 'f-aval', pill: '⭐ Avaliados', title: '⭐ Filmes Mais Bem Avaliados', items: moviesTopRated },
  ];
  const seriesRows = [
    { id: 's-alta', pill: '🔥 Séries em Alta', title: '🔥 Séries em Alta', items: seriesTrending },
    { id: 's-top', pill: '🏆 Top Séries', title: '🏆 Top 10 Séries', items: seriesPopular.slice(0, 10), rank: true },
    { id: 's-mais', pill: '👀 Mais Assistidas', title: '👀 Séries Mais Assistidas', items: seriesPopular },
    { id: 's-novas', pill: '🆕 Novas', title: '🆕 Novas Séries', items: seriesNew },
    { id: 's-aval', pill: '⭐ Avaliadas', title: '⭐ Séries Mais Bem Avaliadas', items: seriesTopRated },
  ];
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const Pills = ({ rows }: { rows: typeof movieRows }) => (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-2 pb-4 mb-2">
      {rows.filter(r => r.items.length).map(r => (
        <button key={r.id} onClick={() => goTo(r.id)} className="flex-shrink-0 min-h-[40px] px-4 rounded-full bg-secondary text-foreground text-sm font-semibold border border-border/50 active:bg-primary active:text-primary-foreground hover:bg-accent transition-colors">{r.pill}</button>
      ))}
    </div>
  );
  const Rows = ({ rows }: { rows: typeof movieRows }) => <>{rows.map(r => r.items.length > 0 && (
    <div key={r.id} id={r.id} className="scroll-mt-20"><ContentRow title={r.title} items={r.items} showRank={r.rank} /></div>
  ))}</>;
  const showMovies = activeCategory === 'all' || activeCategory === 'movie';
  const showSeries = activeCategory === 'all' || activeCategory === 'serie';

  const featuredItem = moviesTrending[0] || content[0] || null;

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
            content.length > 0 ? (
              <ContentRow title="Resultados da Busca" items={content} />
            ) : (
              <p className="text-muted-foreground py-10 text-center">
                Nenhum resultado encontrado para "{searchQuery}".
              </p>
            )
          ) : (
            <>
              {showMovies && <section className="mb-4">
                <h2 className="text-xl font-extrabold text-foreground px-2 mb-3">🎬 FILMES</h2>
                <Pills rows={movieRows} />
                <Rows rows={movieRows} />
              </section>}
              {showSeries && <section className="mb-4">
                <h2 className="text-xl font-extrabold text-foreground px-2 mb-3">📺 SÉRIES</h2>
                <Pills rows={seriesRows} />
                <Rows rows={seriesRows} />
              </section>}

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
