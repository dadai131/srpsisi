import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerControls } from '@/components/PlayerControls';
import { PlayerTheme } from '@/types/content';
import { getPlayerUrl } from '@/lib/api';

const Watch = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [season, setSeason] = useState(Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(Number(searchParams.get('e')) || 1);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [theme, setTheme] = useState<PlayerTheme>({
    color: 'e50914',
    transparent: false,
    noEpList: false,
  });

  const isSeries = type === 'serie' || type === 'anime' || type === 'dorama';

  useEffect(() => {
    if (isSeries) {
      const params = new URLSearchParams();
      if (season > 1) params.set('s', season.toString());
      if (episode > 1) params.set('e', episode.toString());
      setSearchParams(params);
    }
  }, [season, episode, isSeries, setSearchParams]);

  const playerUrl = id
    ? getPlayerUrl(
        id,
        isSeries ? 'serie' : 'movie',
        isSeries ? season : undefined,
        isSeries ? episode : undefined,
        theme,
        activePlayer
      )
    : '';

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
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {isSeries && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  T{season} E{episode}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Player Section */}
      <main className="pt-14">
        <div className="container mx-auto px-4 py-6">
          {/* Player Switcher above player */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setActivePlayer(1)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activePlayer === 1
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              Player 1
            </button>
            <button
              onClick={() => setActivePlayer(2)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activePlayer === 2
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              Player 2
            </button>
          </div>
          {/* Player Container */}
          <div className="relative w-full aspect-video bg-card rounded-lg overflow-hidden shadow-2xl mb-6">
            <iframe
              key={`${activePlayer}-${id}-${season}-${episode}`}
              src={playerUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Player"
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
          {activePlayer === 1 && (
            <PlayerControls theme={theme} onThemeChange={setTheme} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Watch;
