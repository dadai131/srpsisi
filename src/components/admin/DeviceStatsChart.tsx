import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeviceData {
  name: string;
  value: number;
  icon: React.ReactNode;
}

interface DeviceStatsProps {
  desktop: number;
  mobile: number;
  tablet: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)'];

export const DeviceStatsChart: React.FC<DeviceStatsProps> = ({ desktop, mobile, tablet }) => {
  const total = desktop + mobile + tablet;
  
  const data: DeviceData[] = [
    { name: 'Desktop', value: desktop, icon: <Monitor className="h-4 w-4" /> },
    { name: 'Mobile', value: mobile, icon: <Smartphone className="h-4 w-4" /> },
    { name: 'Tablet', value: tablet, icon: <Tablet className="h-4 w-4" /> },
  ].filter(d => d.value > 0);

  if (total === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Dispositivos</CardTitle>
          <CardDescription className="text-muted-foreground">
            Nenhum dado disponível
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Dispositivos</CardTitle>
        <CardDescription className="text-muted-foreground">
          Distribuição por tipo de dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [
                  `${value.toLocaleString('pt-BR')} (${((value / total) * 100).toFixed(1)}%)`,
                  'Acessos'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }} 
                />
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
