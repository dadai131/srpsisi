import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerControls } from '@/components/PlayerControls';
import { PLAYER3_SOURCES, buildEmbedUrl } from '@/lib/player3Sources.js';
import { HlsPlayer } from '@/components/HlsPlayer';
import { EpisodePicker } from '@/components/EpisodePicker';
import { PlayerTheme } from '@/types/content';
import { getPlayerUrl, fetchTVMazeSeasons, SeasonInfo, tmdbUrl } from '@/lib/api';
import { extractStreamInBrowser, BrowserStream, ExtractionMode } from '@/lib/browserStreamExtractor';

const Watch = () => {
  const { type, id: rawId } = useParams<{ type: string; id: string }>();
  const id = /^\d{1,12}$/.test(rawId ?? '') ? String(parseInt(rawId!, 10)) : '';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [season, setSeason] = useState(Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(Number(searchParams.get('e')) || 1);
  const [activePlayer, setActivePlayer] = useState<1 | 3>(1);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [seasonSource, setSeasonSource] = useState<'TMDB' | 'TVmaze' | ''>('');
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeLoadedRef = useRef(false);
  const [theme, setTheme] = useState<PlayerTheme>({ color: 'e50914', transparent: false, noEpList: false });
  const isSeries = type === 'serie' || type === 'anime' || type === 'dorama';

  useEffect(() => {
    if (!isSeries || !id) return;
    setLoadingSeasons(true);
    const fetchTmdb = async (): Promise<SeasonInfo[]> => {
      const res = await fetch(tmdbUrl(`/tv/${id}`, 'language=pt-BR'));
      const data = await res.json();
      return (data.seasons || []).filter((s: any) => s.season_number > 0).map((s: any) => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name }));
    };
    Promise.allSettled([fetchTmdb(), fetchTVMazeSeasons(id)]).then(([a, b]) => {
      const tmdbSeasons = a.status === 'fulfilled' ? a.value : [];
      const tvmazeSeasons = b.status === 'fulfilled' ? b.value : [];
      const chosen = tvmazeSeasons.length > tmdbSeasons.length ? tvmazeSeasons : tmdbSeasons.length ? tmdbSeasons : tvmazeSeasons;
      setSeasonSource(tvmazeSeasons.length > tmdbSeasons.length ? 'TVmaze' : tmdbSeasons.length ? 'TMDB' : 'TVmaze');
      setSeasons(chosen);
      if (chosen.length) setSeason(prev => chosen.some(s => s.season_number === prev) ? prev : chosen[0].season_number);
    }).finally(() => setLoadingSeasons(false));
  }, [id, isSeries]);

  useEffect(() => {
    const current = seasons.find(s => s.season_number === season);
    const count = current?.episode_count || 1;
    setEpisodeCount(count);
    if (episode > count) setEpisode(1);
    setIframeLoading(true);
    setIframeError(false);
    iframeLoadedRef.current = false;

    const timer = setTimeout(() => setIframeLoading(false), 1500);

    // Timeout de 10s: só mostra erro se o iframe realmente não tiver carregado.
    const errorTimer = setTimeout(() => {
      if (activePlayer !== 3 && !iframeLoadedRef.current) setIframeError(true);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(errorTimer);
    };
  }, [season, episode, seasons, activePlayer]);


  // Player 3: V2-style browser extraction where CORS permits; no backend.
  const [player3Source, setPlayer3Source] = useState('mgeb');
  const [player3LoadError, setPlayer3LoadError] = useState(false);
  const player3EmbedUrl = id ? buildEmbedUrl(player3Source, id, isSeries ? 'serie' : 'movie', season, episode) : null;
  const [resolved, setResolved] = useState<BrowserStream | null>(null);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('regex');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [resolveRetry, setResolveRetry] = useState(0);
  useEffect(() => {
    if (activePlayer !== 3 || !id) return;
    const controller = new AbortController();
    setResolved(null); setResolveError(''); setResolving(true);
    extractStreamInBrowser(id, isSeries ? 'serie' : 'movie', season, episode, controller.signal, extractionMode)
      .then(result => {
        if (controller.signal.aborted) return;
        if (result.stream) setResolved(result.stream);
        else setResolveError(result.blockedByCors
          ? 'O navegador não conseguiu ler as fontes (CORS ou falha de rede). Use o embed ou uma fonte que permita CORS.'
          : 'Nenhum M3U8 ou MP4 encontrado nas páginas acessíveis. Tente outra fonte.');
      })
      .catch(() => { if (!controller.signal.aborted) setResolveError('Falha na busca pelo navegador.'); })
      .finally(() => { if (!controller.signal.aborted) setResolving(false); });
    return () => controller.abort();
  }, [activePlayer, id, isSeries, season, episode, resolveRetry, extractionMode]);
  useEffect(() => {
    setPlayer3LoadError(false);
  }, [id, season, episode, player3Source]);

  useEffect(() => {
    if (!isSeries) return;
    const params = new URLSearchParams();
    if (season > 1) params.set('s', String(season));
    if (episode > 1) params.set('e', String(episode));
    setSearchParams(params, { replace: true });
  }, [season, episode, isSeries, setSearchParams]);

  const ALLOWED_PLAYER_HOSTS = ['superflixapi.quest','www2.superflixapi.quest','www.primevicio.lat','primevicio.lat'];
  const isAllowedPlayerUrl = (url: string) => { try { const u = new URL(url); return u.protocol === 'https:' && ALLOWED_PLAYER_HOSTS.includes(u.hostname); } catch { return false; } };
  const rawPlayerUrl = id ? getPlayerUrl(id, isSeries ? 'serie' : 'movie', isSeries ? season : undefined, isSeries ? episode : undefined, theme, 1) : '';
  const playerUrl = isAllowedPlayerUrl(rawPlayerUrl) ? rawPlayerUrl : '';
  const invalidContent = !id;

  const handlePrevEpisode = () => { if (episode > 1) setEpisode(episode - 1); else if (season > 1) { const prev = seasons.find(s => s.season_number === season - 1); setSeason(season - 1); setEpisode(prev?.episode_count || 1); } };
  const handleNextEpisode = () => { const current = seasons.find(s => s.season_number === season); if (current && episode < current.episode_count) setEpisode(episode + 1); else { const next = seasons.find(s => s.season_number === season + 1); if (next) { setSeason(season + 1); setEpisode(1); } } };
  const isLastEpisode = () => { const last = seasons[seasons.length - 1]; return !!last && season === last.season_number && episode >= last.episode_count; };

  return <div className="min-h-screen bg-background">
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect"><div className="container mx-auto px-4"><div className="flex items-center justify-between h-14">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
      {isSeries && <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">T{season} E{episode}</span></div>}
    </div></div></header>

    <main className="pt-14"><div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 mb-3">
        <button onClick={() => { setActivePlayer(1); }} className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activePlayer === 1 ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>Player 1</button>
        <button onClick={() => { setActivePlayer(3); }} className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activePlayer === 3 ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>Player 3 • Loki</button>
      </div>

      {activePlayer === 3 && <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Método
          <select aria-label="Método de extração" value={extractionMode} onChange={event => setExtractionMode(event.target.value as ExtractionMode)} className="rounded-md border border-border bg-background px-2 py-2 text-foreground">
            <option value="regex">Regex JavaScript</option>
            <option value="dom">DOMParser</option>
            <option value="playlist">m3u8-parser</option>
          </select>
        </label>
        <Button size="sm" variant="outline" onClick={() => setResolveRetry(v => v + 1)} disabled={resolving}>{resolving ? 'Buscando vídeo...' : 'Tentar extrair novamente'}</Button>
        {PLAYER3_SOURCES.map(source => <Button key={source.id} size="sm" variant={player3Source === source.id ? 'default' : 'secondary'} onClick={() => { setPlayer3Source(source.id); setResolved(null); }}>{source.label}</Button>)}
        {resolveError && <p role="status" className="w-full text-xs text-muted-foreground">{resolveError}</p>}
      </div>}
      <div className="relative w-full aspect-video sm:min-h-[400px] bg-card rounded-lg overflow-hidden shadow-2xl mb-5">
        {invalidContent ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center"><p className="text-foreground font-semibold">Conteúdo indisponível</p><p className="text-sm text-muted-foreground">O link acessado não é válido (ID: {rawId}).</p><Button variant="secondary" size="sm" onClick={() => navigate('/')}>Voltar ao início</Button></div>
        : activePlayer === 3 && resolving ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm">Procurando vídeo...</p></div>
        : activePlayer === 3 && resolved?.streamUrl ? <HlsPlayer key={resolved.streamUrl} src={resolved.streamUrl} isHls={resolved.kind === 'hls' || /\.m3u8(?:[?#]|$)/i.test(resolved.streamUrl)} onFatalError={() => { setResolved(null); setResolveError('Link encontrado, mas a reprodução direta foi recusada (CORS, token ou formato).'); }} />
        : activePlayer === 3 && player3EmbedUrl && !player3LoadError ? <iframe
            key={`p3-${player3Source}-${id}-${season}-${episode}`}
            src={player3EmbedUrl}
            title="Player 3 — fonte externa"
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setPlayer3LoadError(true)}
          />
        : activePlayer === 3 ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center">
            <p className="text-foreground font-semibold">Fonte do Player 3 indisponível</p>
            <p className="text-sm text-muted-foreground">A fonte pode bloquear incorporação ou estar fora do ar. Experimente outra fonte.</p>
            <Button variant="secondary" size="sm" onClick={() => setActivePlayer(1)}>Ir para o Player 1</Button>
          </div>
        : activePlayer === 1 && iframeError ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center">
            <p className="text-foreground font-semibold">Este conteúdo está bloqueado.</p>
            <p className="text-sm text-muted-foreground">Contacte o proprietário do site para corrigir o problema.</p>
            <Button variant="default" size="sm" onClick={() => { iframeLoadedRef.current = false; setIframeError(false); setIframeLoading(true); setTimeout(() => setIframeLoading(false), 1500); }}>Tentar novamente</Button>
          </div>
        : activePlayer === 1 && (iframeLoading || !playerUrl) ? <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-2">{!playerUrl ? <><p className="text-foreground font-semibold">Player indisponível</p><p className="text-sm text-muted-foreground">Não foi possível carregar este player.</p></> : <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />}</div>
        : activePlayer === 1 && playerUrl ? <iframe key={`${activePlayer}-${id}-${season}-${episode}`} src={playerUrl} className="absolute inset-0 w-full h-full border-0" allowFullScreen frameBorder="0" scrolling="no" referrerPolicy="no-referrer-when-downgrade" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" onLoad={() => { iframeLoadedRef.current = true; setIframeLoading(false); setIframeError(false); }} title="Player" />
        : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center"><p className="text-foreground font-semibold">Conteúdo indisponível</p><Button variant="secondary" size="sm" onClick={() => navigate('/')}>Voltar ao início</Button></div>}
      </div>

      {isSeries && <>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Button variant="secondary" className="h-12 text-base" onClick={handlePrevEpisode} disabled={season === 1 && episode === 1}><ChevronLeft className="w-5 h-5 mr-1" />Anterior</Button>
          <Button variant="secondary" className="h-12 text-base" onClick={handleNextEpisode} disabled={isLastEpisode()}>Próximo<ChevronRight className="w-5 h-5 ml-1" /></Button>
        </div>
        {loadingSeasons ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          : <EpisodePicker id={id} seasons={seasons} season={season} episode={episode} episodeCount={episodeCount} onSeason={s => { setSeason(s); setEpisode(1); }} onEpisode={setEpisode} />}
        {seasonSource && <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4"><Database className="w-3 h-3" /><span>{seasonSource}</span></div>}
      </>}
      {activePlayer === 1 && <PlayerControls theme={theme} onThemeChange={setTheme} />}
    </div></main>
  </div>;
};

export default Watch;
