import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Users, Film, TrendingUp, Clock, Percent } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    topContent: Array<{ id: string; title: string; views: number }>;
    todayViews?: number;
    avgSessionDuration?: number;
    bounceRate?: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Visualizações Totais',
      value: stats.totalViews.toLocaleString('pt-BR'),
      description: 'Últimos 30 dias',
      icon: Eye,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Visualizações Hoje',
      value: (stats.todayViews || 0).toLocaleString('pt-BR'),
      description: 'Acessos de hoje',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Visitantes Únicos',
      value: stats.uniqueVisitors.toLocaleString('pt-BR'),
      description: 'Usuários diferentes',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Conteúdos Vistos',
      value: stats.topContent.length.toString(),
      description: 'Títulos acessados',
      icon: Film,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Tempo Médio',
      value: stats.avgSessionDuration 
        ? `${Math.floor(stats.avgSessionDuration / 60)}m ${stats.avgSessionDuration % 60}s`
        : '—',
      description: 'Duração da sessão',
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Taxa de Rejeição',
      value: stats.bounceRate ? `${stats.bounceRate.toFixed(1)}%` : '—',
      description: 'Saídas rápidas',
      icon: Percent,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => (
        <Card key={index} className="bg-card border-border hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.title}
            </CardTitle>
            <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
