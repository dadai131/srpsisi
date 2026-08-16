import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
        video.play().catch(() => undefined);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setCurrentLevel(data.level));

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        console.error('Erro fatal no HLS:', data.type, data.details);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }
        hls.destroy();
        hlsRef.current = null;
        onFatalError?.();
      });
    } else {
      video.src = src;
      video.play().catch(() => undefined);
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isHls]);

  const changeQuality = (index: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = index;
    setCurrentLevel(index);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="w-full h-full"
        crossOrigin="anonymous"
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>

      {qualities.length > 1 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 backdrop-blur">
          <span className="text-xs text-muted-foreground">Qualidade</span>
          <select
            value={currentLevel}
            onChange={(e) => changeQuality(Number(e.target.value))}
            className="bg-secondary text-foreground text-xs px-2 py-1 rounded border border-border"
          >
            <option value={-1}>Auto</option>
            {qualities.map((q) => (
              <option key={q.index} value={q.index}>
                {q.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
