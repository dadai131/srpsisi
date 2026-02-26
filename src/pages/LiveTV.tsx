import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Play, Tv, Info } from 'lucide-react';
import { channels, categories, Channel } from '@/data/channels';

const LiveTV = () => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const isMobile = useIsMobile();

  const filteredChannels = activeCategory === 'all'
    ? channels
    : channels.filter(ch => ch.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeCategory="all" onCategoryChange={() => {}} />
      <Header onSearch={() => {}} />

      <main className={`${isMobile ? 'pt-14 pb-24' : 'pl-[70px] pt-14'}`}>
        {/* Player */}
        {selectedChannel && (
          <div className="sticky top-14 z-30 bg-black">
            <div className="w-full aspect-video max-h-[50vh]">
              <iframe
                key={selectedChannel.id}
                src={selectedChannel.embed}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ border: 'none' }}
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50 gap-2">
              <div className="flex items-center gap-3">
                <img src={selectedChannel.logo} alt="" className="w-6 h-6 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                <span className="text-sm font-bold text-foreground">{selectedChannel.name}</span>
                <span className="text-[10px] font-bold text-destructive-foreground px-2 py-0.5 rounded-full bg-destructive">AO VIVO</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5" />
                <span>{categories.find(c => c.id === selectedChannel.category)?.name}</span>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 md:px-8 py-6">
          {/* Title */}
          <div className="flex items-center gap-2 mb-6">
            <Tv className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">TV ao Vivo</h2>
            <span className="text-xs text-muted-foreground">({filteredChannels.length} canais)</span>
          </div>

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

          {/* Channel grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredChannels.map(ch => {
              const isSelected = selectedChannel?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
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
        </div>
      </main>
    </div>
  );
};

export default LiveTV;
