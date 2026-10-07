import { useEffect, useRef, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { tmdbUrl, SeasonInfo } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Ep { episode_number: number; name?: string; still_path?: string | null; runtime?: number | null; overview?: string }

interface Props {
  id: string;
  seasons: SeasonInfo[];
  season: number;
  episode: number;
  episodeCount: number;
  onSeason: (s: number) => void;
  onEpisode: (e: number) => void;
}

export function EpisodePicker({ id, seasons, season, episode, episodeCount, onSeason, onEpisode }: Props) {
  const [eps, setEps] = useState<Ep[]>([]);
  const [loading, setLoading] = useState(false);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(tmdbUrl(`/tv/${id}/season/${season}`, 'language=pt-BR'))
      .then(r => r.json())
      .then(d => { if (!cancelled) setEps(Array.isArray(d?.episodes) ? d.episodes : []); })
      .catch(() => { if (!cancelled) setEps([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, season]);

  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }, [episode, eps]);

  const total = Math.max(episodeCount, eps.length);
  const list: Ep[] = Array.from({ length: total }, (_, i) => eps.find(e => e.episode_number === i + 1) || { episode_number: i + 1 });

  return (
    <section className="mb-6">
      <h3 className="text-lg font-bold text-foreground mb-3">Temporadas</h3>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x">
        {seasons.map(s => (
          <button key={s.season_number} onClick={() => onSeason(s.season_number)}
            className={cn('snap-start flex-shrink-0 min-h-[44px] px-5 rounded-full text-sm font-semibold transition-colors',
              s.season_number === season ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground active:bg-accent')}>
            Temporada {s.season_number}
          </button>
        ))}
      </div>

      <h3 className="text-lg font-bold text-foreground mt-4 mb-3">Episódios {loading && <Loader2 className="inline w-4 h-4 animate-spin ml-2" />}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(ep => {
          const active = ep.episode_number === episode;
          return (
            <button key={ep.episode_number} ref={active ? activeRef : undefined} onClick={() => { onEpisode(ep.episode_number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={cn('flex gap-3 text-left rounded-xl p-2 transition-colors border',
                active ? 'bg-primary/15 border-primary' : 'bg-card border-border/50 active:bg-secondary')}>
              <div className="relative w-36 sm:w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-secondary">
                {ep.still_path
                  ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name || `Episódio ${ep.episode_number}`} loading="lazy" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-muted-foreground">{ep.episode_number}</div>}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn('w-9 h-9 rounded-full flex items-center justify-center', active ? 'bg-primary' : 'bg-background/70')}>
                    <Play className="w-4 h-4 fill-current text-foreground" />
                  </span>
                </div>
              </div>
              <div className="min-w-0 py-1">
                <p className={cn('text-xs font-bold', active ? 'text-primary' : 'text-muted-foreground')}>EP {String(ep.episode_number).padStart(2, '0')}{ep.runtime ? ` • ${ep.runtime} min` : ''}</p>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{ep.name || `Episódio ${ep.episode_number}`}</p>
                {ep.overview && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ep.overview}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
