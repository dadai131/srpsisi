import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerControls } from '@/components/PlayerControls';
import { HlsPlayer } from '@/components/HlsPlayer';
import { PlayerTheme } from '@/types/content';
import {
  getPlayerUrl,
  fetchTVMazeSeasons,
  SeasonInfo,
  tmdbUrl,
  getDirectStreamUrl,
  playbackProxyUrl,
  DirectStream,
} from '@/lib/api';

const Watch = () => {
  const { type, id: rawId } = useParams<{ type: string; id: string }>();
  // Só aceitamos IDs numéricos do TMDB — evita injeção de URL nos players/API
  const id = /^\d{1,12}$/.test(rawId ?? '') ? String(parseInt(rawId!, 10)) : '';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [season, setSeason] = useState(Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(Number(searchParams.get('e')) || 1);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [seasonSource, setSeasonSource] = useState<'TMDB' | 'TVmaze' | ''>('');
  const [iframeLoading, setIframeLoading] = useState(false);
  const [directStream, setDirectStream] = useState<DirectStream | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);
  const [theme, setTheme] = useState<PlayerTheme>({
    color: 'e50914',
    transparent: false,
    noEpList: false,
  });

  const isSeries = type === 'serie' || type === 'anime' || type === 'dorama';

  // Fetch seasons from TMDB + TVmaze in parallel
  useEffect(() => {
    if (!isSeries || !id) return;
    setLoadingSeasons(true);

    const fetchTmdb = async (): Promise<SeasonInfo[]> => {
      const res = await fetch(tmdbUrl(`/tv/${id}`, 'language=pt-BR'));
      const data = await res.json();
      return (data.seasons || [])
        .filter((s: any) => s.season_number > 0)
        .map((s: any) => ({
          season_number: s.season_number,
          episode_count: s.episode_count,
          name: s.name,
        }));
    };

    Promise.allSettled([fetchTmdb(), fetchTVMazeSeasons(id)])
      .then(([tmdbResult, tvmazeResult]) => {
        const tmdbSeasons = tmdbResult.status === 'fulfilled' ? tmdbResult.value : [];
        const tvmazeSeasons = tvmazeResult.status === 'fulfilled' ? tvmazeResult.value : [];

        let chosen: SeasonInfo[];
        let source: 'TMDB' | 'TVmaze';
        if (tvmazeSeasons.length > tmdbSeasons.length) {
          chosen = tvmazeSeasons;
          source = 'TVmaze';
          console.log(`Fonte de temporadas: TVmaze (${tvmazeSeasons.length} vs TMDB ${tmdbSeasons.length})`);
        } else {
          chosen = tmdbSeasons.length > 0 ? tmdbSeasons : tvmazeSeasons;
          source = tmdbSeasons.length > 0 ? 'TMDB' : 'TVmaze';
          console.log(`Fonte de temporadas: ${source} (TMDB ${tmdbSeasons.length}, TVmaze ${tvmazeSeasons.length})`);
        }

        setSeasonSource(source);
        setSeasons(chosen);
        if (chosen.length > 0) {
          setSeason((prev) => {
            const exists = chosen.some((s) => s.season_number === prev);
            return exists ? prev : chosen[0].season_number;
          });
        }
      })
      .finally(() => setLoadingSeasons(false));
  }, [id, isSeries]);

  // Update episode count when season changes
  useEffect(() => {
    const current = seasons.find((s) => s.season_number === season);
    if (current) {
      const count = current.episode_count > 0 ? current.episode_count : 1;
      setEpisodeCount(count);
      if (episode > count) setEpisode(1);
    } else if (seasons.length === 0) {
      setEpisodeCount(1);
    }
    setIframeLoading(true);
    setDirectStream(null);
    setStreamFailed(false);
    const timer = setTimeout(() => setIframeLoading(false), 100);
    return () => clearTimeout(timer);
  }, [season, episode, seasons]);

  // Player 2: detecta o link real da Superflix e toca no player HLS próprio
  useEffect(() => {
    if (activePlayer !== 2 || !id) {
      setDirectStream(null);
      setStreamFailed(false);
      return;
    }

    const superflixUrl = getPlayerUrl(
      id,
      isSeries ? 'serie' : 'movie',
      isSeries ? season : undefined,
      isSeries ? episode : undefined,
      theme,
      1,
    );

    let cancelled = false;
    setLoadingStream(true);
    setStreamFailed(false);
    setDirectStream(null);

    getDirectStreamUrl(superflixUrl)
      .then((data) => {
        if (cancelled) return;
        if (data?.streamUrl) {
          console.log('Stream direto extraído:', data.kind, data.streamUrl);
          setDirectStream(data);
          setStreamFailed(false);
        } else {
          console.log('Stream não encontrado');
          setDirectStream(null);
          setStreamFailed(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erro na extração do Player 2:', err);
        setDirectStream(null);
        setStreamFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingStream(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activePlayer, id, season, episode, isSeries, theme]);

  useEffect(() => {
    if (isSeries) {
      const params = new URLSearchParams();
      if (season > 1) params.set('s', season.toString());
      if (episode > 1) params.set('e', episode.toString());
      setSearchParams(params, { replace: true });
    }
  }, [season, episode, isSeries, setSearchParams]);

  const ALLOWED_PLAYER_HOSTS = [
    'superflixapi.pro',
    'superflixapi.cyou',
    'superflixapi.fit',
    'superflixapi.best',
    'superflixapi.rest',
    'superflixapi.help',
    'www.primevicio.lat',
    'primevicio.lat',
  ];
  const isAllowedPlayerUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && ALLOWED_PLAYER_HOSTS.includes(u.hostname);
    } catch {
      return false;
    }
  };

  const rawPlayerUrl = id
    ? getPlayerUrl(
        id,
        isSeries ? 'serie' : 'movie',
        isSeries ? season : undefined,
        isSeries ? episode : undefined,
        theme,
        1,
      )
    : '';
  const playerUrl = isAllowedPlayerUrl(rawPlayerUrl) ? rawPlayerUrl : '';
  const invalidContent = !id;

  const playbackSrc = directStream
    ? playbackProxyUrl(directStream.streamUrl, directStream.referer)
    : null;
  const isHls =
    directStream?.kind === 'hls' ||
    !!directStream?.streamUrl?.includes('.m3u8') ||
    !!directStream?.streamUrl?.includes('/m3/') ||
    !!directStream?.streamUrl?.includes('master.txt');

  const handlePrevEpisode = () => {
    if (episode > 1) {
      setEpisode(episode - 1);
    } else if (season > 1) {
      const prevSeason = seasons.find((s) => s.season_number === season - 1);
      setSeason(season - 1);
      setEpisode(prevSeason?.episode_count || 1);
    }
  };

  const handleNextEpisode = () => {
    const current = seasons.find((s) => s.season_number === season);
    if (current && episode < current.episode_count) {
      setEpisode(episode + 1);
    } else {
      const nextSeason = seasons.find((s) => s.season_number === season + 1);
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

      <main className="pt-14">
        <div className="max-w-6xl mx-auto px-4 py-6">
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

          <div
            className="relative w-full bg-card rounded-lg overflow-hidden shadow-2xl mb-6"
            style={{ paddingBottom: '56.25%', minHeight: '400px' }}
          >
            {invalidContent ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center">
                <p className="text-foreground font-semibold">Conteúdo indisponível</p>
                <p className="text-sm text-muted-foreground">O link acessado não é válido.</p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                  Voltar ao início
                </Button>
              </div>
            ) : activePlayer === 2 && loadingStream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Detectando stream...</p>
              </div>
            ) : activePlayer === 2 && streamFailed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center">
                <p className="text-foreground font-semibold">Stream não encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Não foi possível extrair o link direto. Use o Player 1.
                </p>
                <Button variant="default" size="sm" onClick={() => setActivePlayer(1)}>
                  Ir para o Player 1
                </Button>
              </div>
            ) : activePlayer === 2 && playbackSrc ? (
              <HlsPlayer
                key={playbackSrc}
                src={playbackSrc}
                isHls={isHls}
                onFatalError={() => {
                  setDirectStream(null);
                  setStreamFailed(true);
                }}
              />
            ) : activePlayer === 1 && (iframeLoading || !playerUrl) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-2">
                {!playerUrl ? (
                  <>
                    <p className="text-foreground font-semibold">Player indisponível</p>
                    <p className="text-sm text-muted-foreground">
                      Não foi possível carregar este player. Tente o outro player.
                    </p>
                  </>
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                )}
              </div>
            ) : activePlayer === 1 && playerUrl ? (
              <iframe
                key={`\( {activePlayer}- \){id}-\( {season}- \){episode}`}
                src={playerUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                frameBorder="0"
                scrolling="no"
                referrerPolicy="no-referrer-when-downgrade"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                title="Player"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center">
                <p className="text-foreground font-semibold">Conteúdo indisponível</p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                  Voltar ao início
                </Button>
              </div>
            )}
          </div>

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

                    {seasonSource && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                        <Database className="w-3 h-3" />
                        <span>{seasonSource}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <Button variant="secondary" onClick={handleNextEpisode} disabled={isLastEpisode()}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {activePlayer === 1 && <PlayerControls theme={theme} onThemeChange={setTheme} />}
        </div>
      </main>
    </div>
  );
};

export default Watch;
