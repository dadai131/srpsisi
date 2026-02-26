import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Play, Tv, Info, Gamepad2, Loader2, Calendar } from 'lucide-react';
import { channels as staticChannels, categories, Channel } from '@/data/channels';

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superflix-proxy`;
const PROXY_HEADERS: HeadersInit = {
  'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
};

interface Game {
  id: string;
  title: string;
  team1?: string;
  team2?: string;
  team1_logo?: string;
  team2_logo?: string;
  league?: string;
  time?: string;
  status?: string;
  embed?: string;
  [key: string]: unknown;
}

interface ApiChannel {
  id: string;
  name: string;
  logo?: string;
  category?: string;
  embed?: string;
  [key: string]: unknown;
}

interface EpgItem {
  channel_id?: string;
  title?: string;
  start?: string;
  end?: string;
  [key: string]: unknown;
}

const LiveTV = () => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'channels' | 'games'>('channels');
  const isMobile = useIsMobile();

  const [apiChannels, setApiChannels] = useState<Channel[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [epg, setEpg] = useState<EpgItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Fetch channels from API
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch(`${PROXY_BASE}?endpoint=channels`, { headers: PROXY_HEADERS });
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : data?.channels || data?.data || [];
          const mapped: Channel[] = arr.map((ch: ApiChannel) => ({
            id: ch.id || ch.name?.toLowerCase().replace(/\s+/g, ''),
            name: ch.name || ch.id,
            logo: ch.logo || '/placeholder.svg',
            category: ch.category || 'variedades',
            embed: ch.embed || `https://www2.embedtv.best/${ch.id}`,
          }));
          if (mapped.length > 0) setApiChannels(mapped);
        }
      } catch (e) {
        console.log('Usando lista estática de canais');
      } finally {
        setLoadingChannels(false);
      }
    };
    fetchChannels();
  }, []);

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(`${PROXY_BASE}?endpoint=jogos`, { headers: PROXY_HEADERS });
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : data?.jogos || data?.games || data?.data || [];
          setGames(arr);
        }
      } catch (e) {
        console.log('Sem jogos ao vivo');
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGames();
  }, []);

  // Fetch EPG
  useEffect(() => {
    const fetchEpg = async () => {
      try {
        const res = await fetch(`${PROXY_BASE}?endpoint=epgs`, { headers: PROXY_HEADERS });
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : data?.epg || data?.data || [];
          setEpg(arr);
        }
      } catch (e) {
        console.log('EPG indisponível');
      }
    };
    fetchEpg();
  }, []);

  // Use API channels if available, otherwise static
  const allChannels = apiChannels.length > 0 ? apiChannels : staticChannels;

  const filteredChannels = activeCategory === 'all'
    ? allChannels
    : allChannels.filter(ch => ch.category === activeCategory);

  // Get current EPG for selected channel
  const currentEpg = selectedChannel
    ? epg.filter(e => e.channel_id === selectedChannel.id).slice(0, 5)
    : [];

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game);
    setSelectedChannel(null);
  };

  const handleSelectChannel = (ch: Channel) => {
    setSelectedChannel(ch);
    setSelectedGame(null);
  };

  const activeEmbed = selectedGame?.embed || selectedChannel?.embed;
  const activeTitle = selectedGame
    ? (selectedGame.title || `${selectedGame.team1} x ${selectedGame.team2}`)
    : selectedChannel?.name;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeCategory="all" onCategoryChange={() => {}} />
      <Header onSearch={() => {}} />

      <main className={`${isMobile ? 'pt-14 pb-24' : 'pl-[70px] pt-14'}`}>
        {/* Player */}
        {activeEmbed && (
          <div className="sticky top-14 z-30 bg-black">
            <div className="w-full aspect-video max-h-[50vh]">
              <iframe
                key={activeEmbed}
                src={activeEmbed}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ border: 'none' }}
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50 gap-2">
              <div className="flex items-center gap-3">
                {selectedChannel && (
                  <img src={selectedChannel.logo} alt="" className="w-6 h-6 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                )}
                <span className="text-sm font-bold text-foreground">{activeTitle}</span>
                <span className="text-[10px] font-bold text-destructive-foreground px-2 py-0.5 rounded-full bg-destructive">AO VIVO</span>
              </div>
              {selectedChannel && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                  <span>{categories.find(c => c.id === selectedChannel.category)?.name}</span>
                </div>
              )}
              {selectedGame?.league && (
                <span className="text-xs text-muted-foreground">{selectedGame.league}</span>
              )}
            </div>

            {/* EPG for selected channel */}
            {currentEpg.length > 0 && (
              <div className="px-4 py-2 bg-card/50 border-b border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Programação</span>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {currentEpg.map((item, i) => (
                    <div key={i} className="flex-shrink-0 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{item.start}</span> {item.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-4 md:px-8 py-6">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'channels'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              <Tv className="w-4 h-4" />
              Canais ({allChannels.length})
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'games'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Jogos ao Vivo {games.length > 0 && `(${games.length})`}
            </button>
          </div>

          {/* GAMES TAB */}
          {activeTab === 'games' && (
            <div>
              {loadingGames ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : games.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-semibold">Nenhum jogo ao vivo no momento</p>
                  <p className="text-xs mt-1">Volte mais tarde para conferir as partidas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.map((game, i) => {
                    const isSelected = selectedGame?.id === game.id;
                    return (
                      <div
                        key={game.id || i}
                        onClick={() => game.embed && handlePlayGame(game)}
                        className={`bg-card rounded-xl p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                          isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'border border-border/50'
                        } ${!game.embed ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {game.league && (
                          <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider">{game.league}</p>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {game.team1_logo && <img src={game.team1_logo} alt="" className="w-7 h-7 object-contain" />}
                            <span className="text-sm font-semibold text-foreground truncate">{game.team1 || game.title}</span>
                          </div>
                          {game.team2 && (
                            <>
                              <span className="text-xs font-bold text-muted-foreground">VS</span>
                              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                <span className="text-sm font-semibold text-foreground truncate">{game.team2}</span>
                                {game.team2_logo && <img src={game.team2_logo} alt="" className="w-7 h-7 object-contain" />}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          {game.time && <span className="text-[11px] text-muted-foreground">{game.time}</span>}
                          {game.status && (
                            <span className="text-[10px] font-bold text-destructive-foreground px-2 py-0.5 rounded-full bg-destructive">
                              {game.status}
                            </span>
                          )}
                          {game.embed && <Play className="w-4 h-4 text-primary" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CHANNELS TAB */}
          {activeTab === 'channels' && (
            <>
              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {loadingChannels && apiChannels.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredChannels.map(ch => {
                    const isSelected = selectedChannel?.id === ch.id;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleSelectChannel(ch)}
                        className={`relative bg-card rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                          isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'border border-border/50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted/20 flex-shrink-0 flex items-center justify-center p-1.5">
                          <img
                            src={ch.logo}
                            alt={ch.name}
                            className="w-9 h-9 object-contain"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{ch.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {categories.find(c => c.id === ch.category)?.emoji} {categories.find(c => c.id === ch.category)?.name}
                          </p>
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
        </div>
      </main>
    </div>
  );
};

export default LiveTV;
