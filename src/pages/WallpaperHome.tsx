import { useState, useMemo } from 'react';
import { Search, Download, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const categories = [
  { id: 'all', name: 'Todos', emoji: '🎨' },
  { id: 'nature', name: 'Natureza', emoji: '🌿' },
  { id: 'anime', name: 'Anime', emoji: '🎌' },
  { id: 'games', name: 'Games', emoji: '🎮' },
  { id: 'abstract', name: 'Abstrato', emoji: '🔮' },
  { id: 'cars', name: 'Carros', emoji: '🏎️' },
  { id: 'space', name: 'Espaço', emoji: '🚀' },
  { id: 'animals', name: 'Animais', emoji: '🐾' },
];

const wallpapers = [
  { id: 1, name: 'Montanhas ao Pôr do Sol', category: 'nature', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
  { id: 2, name: 'Floresta Encantada', category: 'nature', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' },
  { id: 3, name: 'Lago Cristalino', category: 'nature', url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80' },
  { id: 4, name: 'Aurora Boreal', category: 'nature', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80' },
  { id: 5, name: 'Nebulosa Colorida', category: 'space', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80' },
  { id: 6, name: 'Via Láctea', category: 'space', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80' },
  { id: 7, name: 'Galáxia Espiral', category: 'space', url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=800&q=80' },
  { id: 8, name: 'Planeta Saturno', category: 'space', url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80' },
  { id: 9, name: 'Ondas Abstratas', category: 'abstract', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&q=80' },
  { id: 10, name: 'Geometria Neon', category: 'abstract', url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&q=80' },
  { id: 11, name: 'Fluido Digital', category: 'abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80' },
  { id: 12, name: 'Cores Vibrantes', category: 'abstract', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80' },
  { id: 13, name: 'Supercar Vermelho', category: 'cars', url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80' },
  { id: 14, name: 'Carro Esportivo', category: 'cars', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80' },
  { id: 15, name: 'Muscle Car', category: 'cars', url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80' },
  { id: 16, name: 'Tigre Majestoso', category: 'animals', url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80' },
  { id: 17, name: 'Lobo na Neve', category: 'animals', url: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&q=80' },
  { id: 18, name: 'Águia em Voo', category: 'animals', url: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=800&q=80' },
  { id: 19, name: 'Leão Dourado', category: 'animals', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&q=80' },
  { id: 20, name: 'Setup Gamer RGB', category: 'games', url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80' },
  { id: 21, name: 'Controle Neon', category: 'games', url: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80' },
  { id: 22, name: 'Teclado Mecânico', category: 'games', url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80' },
  { id: 23, name: 'Sakura Anime', category: 'anime', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80' },
  { id: 24, name: 'Tokyo Neon', category: 'anime', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' },
];

const handleDownload = async (url: string, name: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name}.jpg`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    window.open(url, '_blank');
  }
};

export default function WallpaperHome() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    return wallpapers.filter((w) => {
      const matchCategory = activeCategory === 'all' || w.category === activeCategory;
      const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Image className="w-7 h-7 text-violet-400" />
            <h1 className="text-xl font-bold">
              Wall<span className="text-violet-400">Paper</span> HD
            </h1>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="search"
              placeholder="Buscar wallpapers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-12 px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-3">
          Wallpapers em <span className="text-violet-400">Alta Qualidade</span>
        </h2>
        <p className="text-white/50 text-sm md:text-base max-w-lg mx-auto">
          Baixe gratuitamente wallpapers incríveis para seu desktop e celular.
        </p>
      </section>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum wallpaper encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((wall) => (
              <div
                key={wall.id}
                className="group relative aspect-[3/2] rounded-xl overflow-hidden bg-white/5 cursor-pointer"
              >
                <img
                  src={wall.url}
                  alt={wall.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="text-sm font-medium truncate">{wall.name}</p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(wall.url, wall.name);
                    }}
                    className="mt-2 bg-violet-500 hover:bg-violet-600 text-white text-xs h-8 w-full"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-white/30 text-xs">
        © 2026 WallPaper HD — Todos os direitos reservados
      </footer>
    </div>
  );
}
