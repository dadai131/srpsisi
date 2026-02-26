import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Play, Radio, Clock, Trophy } from 'lucide-react';

interface GameTeam {
  name: string;
  image: string;
}

interface GameData {
  league: string;
  timer: { start: number; end: number };
  teams: { home: GameTeam; away: GameTeam };
}

interface LiveGame {
  title: string;
  image: string;
  data: GameData;
  players: string[];
}

function getGameStatus(start: number, end: number): { label: string; color: string } {
  const now = Date.now() / 1000;
  if (now >= start && now <= end) return { label: 'AO VIVO', color: 'bg-red-600' };
  if (now < start) {
    const diff = start - now;
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    if (hours > 0) return { label: `Em ${hours}h${mins}m`, color: 'bg-yellow-600' };
    return { label: `Em ${mins}min`, color: 'bg-yellow-600' };
  }
  return { label: 'ENCERRADO', color: 'bg-muted' };
}

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const LiveTV = () => {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function loadGames() {
      try {
        const res = await fetch('https://embedtv.best/api/jogos');
        if (res.ok) {
          const data = await res.json();
          setGames(data);
          if (data.length > 0) setSelectedGame(data[0]);
        }
      } catch (e) {
        console.error('Erro ao carregar jogos:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadGames();
    const interval = setInterval(loadGames, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh status every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(c => c + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const playerUrl = selectedGame?.players?.[0] || '';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeCategory="all" onCategoryChange={() => {}} />
      <Header onSearch={() => {}} />

      <main className={`${isMobile ? 'pt-14 pb-20' : 'pl-[70px] pt-14'}`}>
        {/* Player */}
        {selectedGame && playerUrl && (
          <div className="sticky top-14 z-30 bg-black">
            <div className="w-full aspect-video max-h-[50vh]">
              <iframe
                src={playerUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ border: 'none' }}
              />
            </div>
            {/* Game info bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50">
              <div className="flex items-center gap-3">
                <img src={selectedGame.data.teams.home.image} alt="" className="w-6 h-6 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                <span className="text-sm font-bold text-foreground">{selectedGame.data.teams.home.name}</span>
                <span className="text-muted-foreground text-xs">vs</span>
                <span className="text-sm font-bold text-foreground">{selectedGame.data.teams.away.name}</span>
                <img src={selectedGame.data.teams.away.image} alt="" className="w-6 h-6 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{selectedGame.data.league}</span>
                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${getGameStatus(selectedGame.data.timer.start, selectedGame.data.timer.end).color}`}>
                  {getGameStatus(selectedGame.data.timer.start, selectedGame.data.timer.end).label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Games List */}
        <div className="px-4 md:px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-xl font-bold text-foreground">Jogos Ao Vivo</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Nenhum jogo disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game, i) => {
                const status = getGameStatus(game.data.timer.start, game.data.timer.end);
                const isSelected = selectedGame?.title === game.title;

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedGame(game)}
                    className={`relative bg-card rounded-xl p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                      isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'border border-border/50'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{game.data.league}</span>
                      </div>
                      <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Teams */}
                    <div className="flex items-center justify-between">
                      {/* Home */}
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center p-2">
                          <img
                            src={game.data.teams.home.image}
                            alt={game.data.teams.home.name}
                            className="w-10 h-10 object-contain"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground text-center leading-tight">
                          {game.data.teams.home.name}
                        </span>
                      </div>

                      {/* VS / Time */}
                      <div className="flex flex-col items-center gap-1 px-4">
                        <span className="text-lg font-extrabold text-primary">VS</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">{formatTime(game.data.timer.start)}</span>
                        </div>
                      </div>

                      {/* Away */}
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center p-2">
                          <img
                            src={game.data.teams.away.image}
                            alt={game.data.teams.away.name}
                            className="w-10 h-10 object-contain"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground text-center leading-tight">
                          {game.data.teams.away.name}
                        </span>
                      </div>
                    </div>

                    {/* Play indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <Play className="w-4 h-4 text-primary fill-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveTV;
