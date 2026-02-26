import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const OnlineUsersCard: React.FC = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const channel = supabase.channel('online_users', {
      config: {
        presence: {
          key: 'user_' + Math.random().toString(36).substr(2, 9),
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineCount(users.length);
        setOnlineUsers(users.slice(0, 5));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineCount(prev => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineCount(prev => Math.max(0, prev - leftPresences.length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            page: 'admin',
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Usuários Online
        </CardTitle>
        <div className="relative">
          <Users className="h-4 w-4 text-green-500" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{onlineCount}</div>
        <p className="text-xs text-muted-foreground">Agora no site</p>
        {onlineUsers.length > 0 && (
          <div className="mt-2 flex -space-x-2">
            {onlineUsers.map((_, i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/50 border-2 border-card flex items-center justify-center text-[10px] text-primary-foreground font-bold"
              >
                {i + 1}
              </div>
            ))}
            {onlineCount > 5 && (
              <div className="h-6 w-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                +{onlineCount - 5}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
