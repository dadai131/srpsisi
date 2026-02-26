import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Eye, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentActivity {
  id: string;
  type: 'view' | 'play' | 'search';
  contentTitle: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: RecentActivity[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'view':
      return <Eye className="h-4 w-4 text-blue-500" />;
    case 'play':
      return <Play className="h-4 w-4 text-green-500" />;
    default:
      return <TrendingUp className="h-4 w-4 text-primary" />;
  }
};

const getActivityLabel = (type: string) => {
  switch (type) {
    case 'view':
      return 'Visualizou';
    case 'play':
      return 'Assistiu';
    default:
      return 'Ação';
  }
};

export const RecentActivityCard: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          Tempo real
        </Badge>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">
                      {getActivityLabel(activity.type)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {activity.contentTitle}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
