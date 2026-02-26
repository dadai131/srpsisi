import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarItem } from '@/types/content';
import { fetchCalendar } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Calendar = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const data = await fetchCalendar();
        setItems(data);
      } catch (error) {
        console.error('Error loading calendar:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalendar();
  }, []);

  // Group items by date
  const groupedItems = items.reduce((acc, item) => {
    const date = item.releaseDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, CalendarItem[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 md:h-20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Page Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Calendário</h1>
              <p className="text-muted-foreground">Lançamentos recentes e próximos</p>
            </div>
          </div>

          {/* Calendar Items */}
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 w-48 bg-card rounded mb-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="aspect-[2/3] rounded-lg bg-card" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedItems).map(([date, dateItems]) => (
                <div key={date} className="animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground mb-4 capitalize">
                    {formatDate(date)}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {dateItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/watch/${item.type}/${item.id}`)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card hover-lift">
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-sm font-medium text-foreground line-clamp-2">
                              {item.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Calendar;
