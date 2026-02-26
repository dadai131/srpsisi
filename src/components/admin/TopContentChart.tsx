import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Film } from 'lucide-react';

interface TopContent {
  id: string;
  title: string;
  views: number;
  type?: 'movie' | 'tv';
}

interface TopContentChartProps {
  data: TopContent[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(346, 77%, 50%)',
  'hsl(346, 77%, 55%)',
  'hsl(346, 77%, 60%)',
  'hsl(346, 77%, 65%)',
  'hsl(var(--muted))',
  'hsl(var(--muted))',
  'hsl(var(--muted))',
  'hsl(var(--muted))',
  'hsl(var(--muted))',
];

export const TopContentChart: React.FC<TopContentChartProps> = ({ data }) => {
  const chartData = data.slice(0, 10).map((item, index) => ({
    ...item,
    shortTitle: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
    rank: index + 1
  }));

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <CardTitle className="text-foreground">Top 10 Mais Vistos</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Conteúdos mais assistidos este mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="shortTitle"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Visualizações']}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.shortTitle === label);
                    return item?.title || label;
                  }}
                />
                <Bar 
                  dataKey="views" 
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
