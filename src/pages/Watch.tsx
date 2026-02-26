import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerControls } from '@/components/PlayerControls';
import { PlayerTheme, ContentItem } from '@/types/content';
import { getPlayerUrl, fetchMovieDetails } from '@/lib/api';

type PlayerSource = 'superflix' | 'primevicio';

function getPrimeVicioUrl(id: string, isSeries: boolean, season?: number, episode?: number): string {
  if (isSeries) {
    return `https://www.primevicio.lat/embed/tv/${id}/${season || 1}/${episode || 1}`;
  }
  return `https://www.primevicio.lat/embed/movie/${id}`;
}

const Watch = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [season, setSeason] = useState(Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(Number(searchParams.get('e')) || 1);
  const [contentDetails, setContentDetails] = useState<ContentItem | null>(null);
  const [playerSource, setPlayerSource] = useState<PlayerSource>('primevicio');
  const [theme, setTheme] = useState<PlayerTheme>({
    color: 'e50914',
    transparent: false,
    noEpList: false,
  });

  const isSeries = type === 'serie' || type === 'anime' || type === 'dorama';

  useEffect(() => {
    if (id && type) {
      fetchMovieDetails(id, 'tmdb', type as any).then(setContentDetails);
    }
  }, [id, type]);

  useEffect(() => {
    if (isSeries) {
      const params = new URLSearchParams();
      if (season > 1) params.set('s', season.toString());
      if (episode > 1) params.set('e', episode.toString());
      setSearchParams(params);
    }
  }, [season, episode, isSeries, setSearchParams]);

  const superflixUrl = id
    ? getPlayerUrl(
        id,
        isSeries ? 'serie' : 'movie',
        isSeries ? season : undefined,
        isSeries ? episode : undefined,
        theme
      )
    : '';

  const primeVicioUrl = id ? getPrimeVicioUrl(id, isSeries, season, episode) : '';
  const playerUrl = playerSource === 'superflix' ? superflixUrl : primeVicioUrl;

  const handlePrevEpisode = () => {
    if (episode > 1) {
      setEpisode(episode - 1);
    } else if (season > 1) {
      setSeason(season - 1);
      setEpisode(1);
    }
  };

  const handleNextEpisode = () => {
    setEpisode(episode + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="flex items-center gap-2 text-sm">
              {contentDetails && (
                <span className="text-foreground font-medium">{contentDetails.title}</span>
              )}
              {isSeries && (
                <span className="text-muted-foreground">
                  • T{season} E{episode}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Player Section */}
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Content Info */}
          {contentDetails && (
            <div className="flex gap-6 mb-6">
              <img
                src={contentDetails.poster}
                alt={contentDetails.title}
                className="w-32 h-48 object-cover rounded-lg shadow-lg hidden md:block"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">{contentDetails.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {contentDetails.year && <span>{contentDetails.year}</span>}
                  {contentDetails.rating && (
                    <span className="flex items-center gap-1">
                      ⭐ {contentDetails.rating}
                    </span>
                  )}
                  <span className="capitalize">{type}</span>
                </div>
              </div>
            </div>
          )}

          {/* Player Source Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Player:</span>
            <Button
              variant={playerSource === 'primevicio' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlayerSource('primevicio')}
            >
              Player 1
            </Button>
            <Button
              variant={playerSource === 'superflix' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlayerSource('superflix')}
            >
              Player 2
            </Button>
          </div>

          {/* Player Container */}
          <div className="relative w-full aspect-video bg-card rounded-lg overflow-hidden shadow-2xl mb-4">
            <iframe
              key={playerUrl}
              src={playerUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
              referrerPolicy="no-referrer-when-downgrade"
              title="Player"
              style={{ border: 'none' }}
            />
          </div>

          {/* Episode Navigation (for series) */}
          {isSeries && (
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="secondary"
                onClick={handlePrevEpisode}
                disabled={season === 1 && episode === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Temporada:</label>
                  <select
                    value={season}
                    onChange={(e) => {
                      setSeason(Number(e.target.value));
                      setEpisode(1);
                    }}
                    className="bg-secondary text-foreground px-3 py-1 rounded-md border border-border"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Episódio:</label>
                  <select
                    value={episode}
                    onChange={(e) => setEpisode(Number(e.target.value))}
                    className="bg-secondary text-foreground px-3 py-1 rounded-md border border-border"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button variant="secondary" onClick={handleNextEpisode}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Player Controls (only for Superflix) */}
          {playerSource === 'superflix' && (
            <PlayerControls theme={theme} onThemeChange={setTheme} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Watch;