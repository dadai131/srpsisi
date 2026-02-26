import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Play, Radio, Clock, Trophy, Tv, Info } from 'lucide-react';

// --- Types ---
interface GameTeam { name: string; image: string; }
interface GameData { league: string; timer: { start: number; end: number }; teams: { home: GameTeam; away: GameTeam }; }
interface LiveGame { title: string; image: string; data: GameData; players: string[]; }
interface TVCategory { id: number; name: string; }
interface TVChannel { id: string; image: string; name: string; categories: number[]; url: string; }
interface EPGItem { id: string; epg: { title: string; desc: string; start_date: string; }; }

// --- Helpers ---
function getGameStatus(start: number, end: number) {
  const now = Date.now() / 1000;
  if (now >= start && now <= end) return { label: 'AO VIVO', color: 'bg-red-600' };
  if (now < start) {
    const diff = start - now;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return { label: h > 0 ? `Em ${h}h${m}m` : `Em ${m}min`, color: 'bg-yellow-600' };
  }
  return { label: 'ENCERRADO', color: 'bg-muted' };
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatEpgTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

type TabType = 'games' | 'channels';

const LiveTV = () => {
  const [tab, setTab] = useState<TabType>('channels');
  const [games, setGames] = useState<LiveGame[]>([]);
  const [channels, setChannels] = useState<TVChannel[]>([]);
  const [categories, setCategories] = useState<TVCategory[]>([]);
  const [epgData, setEpgData] = useState<Record<string, EPGItem['epg']>>({});
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const isMobile = useIsMobile();

  // Load games
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('https://embedtv.best/api/jogos');
        if (res.ok) { const data = await res.json(); setGames(data); }
      } catch (e) { console.error('Erro jogos:', e); }
      finally { setIsLoadingGames(false); }
    }
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, []);

  // Load channels + EPG
  useEffect(() => {
    async function load() {
      try {
        const [chRes, epgRes] = await Promise.all([
          fetch('https://embedtv.best/api/channels'),
          fetch('https://embedtv.best/api/epg'),
        ]);
        if (chRes.ok) {
          const data = await chRes.json();
          setCategories(data.categories || []);
          setChannels(data.channels || []);
        }
        if (epgRes.ok) {
          const epgArr: EPGItem[] = await epgRes.json();
          const map: Record<string, EPGItem['epg']> = {};
          epgArr.forEach(e => { map[e.id] = e.epg; });
          setEpgData(map);
        }
      } catch (e) { console.error('Erro canais/epg:', e); }
      finally { setIsLoadingChannels(false); }
    }
    load();
  }, []);

  // Tick for live status
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(c => c + 1), 30000); return () => clearInterval(t); }, []);

  const playerUrl = tab === 'games'
    ? selectedGame?.players?.[0] || ''
    : selectedChannel?.url || '';

  const filteredChannels = activeCategory === 0
    ? channels
    : channels.filter(ch => ch.categories.includes(activeCategory));

  const selectedEpg = selectedChannel ? epgData[selectedChannel.id] : null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeCategory="all" onCategoryChange={() => {}} />
      <Header onSearch={() => {}} />

      <main className={`${isMobile ? 'pt-14 pb-20' : 'pl-[70px] pt-14'}`}>
        {/* Player */}
        {playerUrl && (
          <div className="sticky top-14 z-30 bg-black">
            <div className="w-full aspect-video max-h-[50vh]">
              <iframe
                key={playerUrl}
                src={playerUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ border: 'none' }}
              />
            </div>
            {/* Info bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50 gap-2 flex-wrap">
              {tab === 'games' && selectedGame ? (
                <>
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
                </>
              ) : selectedChannel ? (
                <>
                  <div className="flex items-center gap-3">
                    <img src={selectedChannel.image} alt="" className="w-6 h-6 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <span className="text-sm font-bold text-foreground">{selectedChannel.name}</span>
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-red-600">AO VIVO</span>
                  </div>
                  {selectedEpg && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5" />
                      <span className="font-medium text-foreground">{selectedEpg.title}</span>
                      <span>• {formatEpgTime(selectedEpg.start_date)}</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}

        <div className="px-4 md:px-8 py-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('channels')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                tab === 'channels' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              <Tv className="w-4 h-4" /> Canais
            </button>
            <button
              onClick={() => setTab('games')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                tab === 'games' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              <Trophy className="w-4 h-4" /> Jogos
              {games.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{games.length}</span>
              )}
            </button>
          </div>

          {/* === CHANNELS TAB === */}
          {tab === 'channels' && (
            <>
              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {isLoadingChannels ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredChannels.map(ch => {
                    const isSelected = selectedChannel?.id === ch.id && tab === 'channels';
                    const chEpg = epgData[ch.id];
                    return (
                      <div
                        key={ch.id}
                        onClick={() => { setSelectedChannel(ch); setSelectedGame(null); setTab('channels'); }}
                        className={`relative bg-card rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                          isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'border border-border/50'
                        }`}
                      >
                        {/* Channel logo */}
                        <div className="w-12 h-12 rounded-lg bg-muted/20 flex-shrink-0 flex items-center justify-center p-1.5">
                          <img
                            src={ch.image}
                            alt={ch.name}
                            className="w-9 h-9 object-contain"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{ch.name}</p>
                          {chEpg ? (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              <span className="text-primary font-medium">{formatEpgTime(chEpg.start_date)}</span>
                              {' '}{chEpg.title}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground mt-0.5">Programação indisponível</p>
                          )}
                        </div>
                        {isSelected && (
                          <Play className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* === GAMES TAB === */}
          {tab === 'games' && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                <h2 className="text-lg font-bold text-foreground">Jogos Ao Vivo</h2>
              </div>

              {isLoadingGames ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : games.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">Nenhum jogo disponível no momento.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.map((game, i) => {
                    const status = getGameStatus(game.data.timer.start, game.data.timer.end);
                    const isSelected = selectedGame?.title === game.title && tab === 'games';
                    return (
                      <div
                        key={i}
                        onClick={() => { setSelectedGame(game); setSelectedChannel(null); setTab('games'); }}
                        className={`relative bg-card rounded-xl p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                          isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'border border-border/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">{game.data.league}</span>
                          </div>
                          <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center p-2">
                              <img src={game.data.teams.home.image} alt={game.data.teams.home.name} className="w-10 h-10 object-contain" onError={e => { e.currentTarget.src = '/placeholder.svg'; }} />
                            </div>
                            <span className="text-xs font-semibold text-foreground text-center leading-tight">{game.data.teams.home.name}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-lg font-extrabold text-primary">VS</span>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px]">{formatTime(game.data.timer.start)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center p-2">
                              <img src={game.data.teams.away.image} alt={game.data.teams.away.name} className="w-10 h-10 object-contain" onError={e => { e.currentTarget.src = '/placeholder.svg'; }} />
                            </div>
                            <span className="text-xs font-semibold text-foreground text-center leading-tight">{game.data.teams.away.name}</span>
                          </div>
                        </div>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveTV;
