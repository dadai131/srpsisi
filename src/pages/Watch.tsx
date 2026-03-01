import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerControls } from '@/components/PlayerControls';
import { PlayerTheme } from '@/types/content';
import { getPlayerUrl } from '@/lib/api';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '690cf0eddb8284392e1a4e3a9dae4b09';
const TMDB_BASE = 'https://api.themoviedb.org/3';

interface SeasonInfo {
  season_number: number;
  episode_count: number;
  name: string;
}

const Watch = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [season, setSeason] = useState(Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(Number(searchParams.get('e')) || 1);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [theme, setTheme] = useState<PlayerTheme>({
    color: 'e50914',
    transparent: false,
    noEpList: false,
  });

  const isSeries = type === 'serie' || type === 'anime' || type === 'dorama';

  // Fetch seasons from TMDB
  useEffect(() => {
    if (!isSeries || !id) return;
    setLoadingSeasons(true);
    fetch(`${TMDB_BASE}/tv/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      .then(res => res.json())
      .then(data => {
        const tvSeasons: SeasonInfo[] = (data.seasons || [])
          .filter((s: any) => s.season_number > 0)
          .map((s: any) => ({
            season_number: s.season_number,
            episode_count: s.episode_count,
            name: s.name,
          }));
        setSeasons(tvSeasons);
        // Set episode count for current season
        const current = tvSeasons.find(s => s.season_number === season);
        if (current) setEpisodeCount(current.episode_count);
      })
      .catch(e => console.error('Erro TMDB seasons:', e))
      .finally(() => setLoadingSeasons(false));
  }, [id, isSeries]);

  // Update episode count when season changes
  useEffect(() => {
    const current = seasons.find(s => s.season_number === season);
    if (current) {
      setEpisodeCount(current.episode_count);
      if (episode > current.episode_count) setEpisode(1);
    }
  }, [season, seasons]);

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
      const prevSeason = seasons.find(s => s.season_number === season - 1);
      setSeason(season - 1);
      setEpisode(prevSeason?.episode_count || 1);
    }
  };

  const handleNextEpisode = () => {
    const current = seasons.find(s => s.season_number === season);
    if (current && episode < current.episode_count) {
      setEpisode(episode + 1);
    } else {
      // Go to next season
      const nextSeason = seasons.find(s => s.season_number === season + 1);
      if (nextSeason) {
        setSeason(season + 1);
        setEpisode(1);
      }
    }
  };

  const isLastEpisode = () => {
    const lastSeason = seasons[seasons.length - 1];
    return lastSeason && season === lastSeason.season_number && episode >= lastSeason.episode_count;
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
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              frameBorder="0"
              scrolling="no"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="origin"
              title="Player"
            />
          </div>

          {/* Episode Navigation (for series) */}
          {isSeries && (
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={handlePrevEpisode}
                disabled={season === 1 && episode === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-4 flex-wrap">
                {loadingSeasons ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
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
                        {seasons.map((s) => (
                          <option key={s.season_number} value={s.season_number}>
                            {s.season_number}
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
                        {Array.from({ length: episodeCount }, (_, i) => i + 1).map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <Button
                variant="secondary"
                onClick={handleNextEpisode}
                disabled={isLastEpisode()}
              >
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
