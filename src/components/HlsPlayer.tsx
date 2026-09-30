import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, Loader2 } from 'lucide-react';

interface Quality {
  index: number;
  label: string;
}

interface HlsPlayerProps {
  src: string;
  isHls: boolean;
  onFatalError?: () => void;
}

/** Player de vídeo próprio: <video> nativo + hls.js quando necessário. */
export const HlsPlayer = ({ src, isHls, onFatalError }: HlsPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [notice, setNotice] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const onFatalErrorRef = useRef(onFatalError);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);

  // Mantém o callback atualizado sem recriar o player (evita closure velha).
  useEffect(() => {
    onFatalErrorRef.current = onFatalError;
  }, [onFatalError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setPlaying(false); setWaiting(true); setPosition(0); setDuration(0); setSpeed(1);
    setQualities([]);
    setCurrentLevel(-1);

    const nativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isHls && Hls.isSupported() && !nativeHls) {

      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setQualities(
          data.levels.map((lvl, index) => ({
            index,
            label: lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)}kbps`,
          })),
        );
        video.play().catch(() => setWaiting(false));
      });

      // Keep Auto selected while adaptive playback changes the actual level.

      let networkRetries = 0;
      let mediaRetries = 0;
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        console.error('Erro fatal no HLS:', data.type, data.details);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 2) {
          networkRetries += 1;
          hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries++ < 2) {
          hls.recoverMediaError();
          return;
        }
        hls.destroy();
        hlsRef.current = null;
        onFatalErrorRef.current?.();
      });
    } else {
      video.src = src;
      video.play().catch(() => setWaiting(false));
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isHls]);

  const changeQuality = (index: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = index;
    setCurrentLevel(index);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    return `${hours ? hours + ':' : ''}${hours ? String(Math.floor(total / 60) % 60).padStart(2, '0') : Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => { setWaiting(false); setNotice('Toque em reproduzir para iniciar.'); });
    else video.pause();
  };
  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) video.currentTime = Math.max(0, Math.min(video.duration, seconds));
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (containerRef.current?.requestFullscreen) await containerRef.current.requestFullscreen();
      else {
        const video = videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
        if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
        else setNotice('Tela cheia não disponível neste navegador.');
      }
    } catch { setNotice('Não foi possível abrir a tela cheia.'); }
  };
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const iconButton = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500';

  return (
    <div ref={containerRef} className="absolute inset-0 flex h-full w-full flex-col bg-black text-white" tabIndex={0}
      aria-label="Player LokiFilms" onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === ' ' || event.key.toLowerCase() === 'k') { event.preventDefault(); togglePlay(); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); seek(position - 10); }
        if (event.key === 'ArrowRight') { event.preventDefault(); seek(position + 10); }
        if (event.key.toLowerCase() === 'f') { event.preventDefault(); void toggleFullscreen(); }
      }}>
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-contain"
        onClick={togglePlay} onDoubleClick={() => void toggleFullscreen()}
        onPlay={() => { setPlaying(true); setNotice(''); }} onPause={() => setPlaying(false)}
        onPlaying={() => setWaiting(false)} onWaiting={() => setWaiting(true)}
        onCanPlay={() => setWaiting(false)} onSeeking={() => setWaiting(true)} onSeeked={() => setWaiting(false)}
        onEnded={() => { setPlaying(false); setWaiting(false); }}
        onTimeUpdate={() => setPosition(videoRef.current?.currentTime || 0)}
        onDurationChange={() => { const value = videoRef.current?.duration || 0; setDuration(Number.isFinite(value) ? value : 0); }}
        onVolumeChange={() => { setVolume(videoRef.current?.volume ?? 1); setMuted(videoRef.current?.muted ?? false); }}
        onError={() => { if (!hlsRef.current) onFatalErrorRef.current?.(); }}>
        Seu navegador não suporta vídeo.
      </video>
      <div className="pointer-events-none relative flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6">
        <span className="text-sm font-black tracking-[0.18em]">LOKI<span className="text-red-500">FILMS</span></span>
        <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-widest">Player 3</span>
      </div>
      <div className="pointer-events-none relative flex flex-1 items-center justify-center">
        {waiting ? <div role="status" className="flex flex-col items-center gap-3"><Loader2 className="h-10 w-10 animate-spin text-red-500" /><span className="text-xs">Carregando vídeo...</span></div> : !playing &&
          <button aria-label="Reproduzir" onClick={togglePlay} className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition hover:scale-105 hover:bg-red-500"><Play className="ml-1 h-7 w-7 fill-current" /></button>}
      </div>
      <div className="relative bg-gradient-to-t from-black via-black/90 to-transparent px-3 pb-3 pt-8 sm:px-6 sm:pb-5">
        {notice && <p role="status" className="mb-2 text-center text-xs text-white/80">{notice}</p>}
        <input aria-label="Posição do vídeo" type="range" min={0} max={duration || 1} step={0.1} value={Math.min(position, duration || 1)} disabled={!duration}
          onChange={event => seek(Number(event.target.value))} className="mb-3 block h-1 w-full cursor-pointer accent-red-600" />
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button className={iconButton} aria-label={playing ? 'Pausar' : 'Reproduzir'} onClick={togglePlay}>{playing ? <Pause size={21} /> : <Play size={21} />}</button>
          <button className={iconButton} aria-label="Voltar 10 segundos" title="Voltar 10 segundos" onClick={() => seek(position - 10)}><RotateCcw size={19} /></button>
          <button className={iconButton} aria-label="Avançar 10 segundos" title="Avançar 10 segundos" onClick={() => seek(position + 10)}><RotateCw size={19} /></button>
          <button className={iconButton} aria-label={muted ? 'Ativar som' : 'Silenciar'} onClick={() => { if (videoRef.current) videoRef.current.muted = !muted; }}>{muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
          <input aria-label="Volume" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={event => { if (videoRef.current) { videoRef.current.volume = Number(event.target.value); videoRef.current.muted = false; } }} className="hidden w-16 accent-red-600 sm:block" />
          <span className="mr-auto whitespace-nowrap px-1 text-xs tabular-nums text-white/70">{formatTime(position)} / {formatTime(duration)}</span>
          <select aria-label="Velocidade de reprodução" value={speed} onChange={event => { const value = Number(event.target.value); if (videoRef.current) videoRef.current.playbackRate = value; setSpeed(value); }} className="h-8 rounded-md border border-white/15 bg-zinc-900 px-1 text-xs">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}
          </select>
          {qualities.length > 1 && <select aria-label="Qualidade do vídeo" value={currentLevel} onChange={event => changeQuality(Number(event.target.value))} className="h-8 rounded-md border border-white/15 bg-zinc-900 px-1 text-xs">
            <option value={-1}>Auto</option>{qualities.map(quality => <option key={quality.index} value={quality.index}>{quality.label}</option>)}
          </select>}
          <button className={iconButton} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
        </div>
      </div>
    </div>
  );
};
