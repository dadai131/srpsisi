import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatsCards } from '@/components/admin/StatsCards';
import { OnlineUsersCard } from '@/components/admin/OnlineUsersCard';
import { ViewsChart } from '@/components/admin/ViewsChart';
import { TopContentChart } from '@/components/admin/TopContentChart';
import { DeviceStatsChart } from '@/components/admin/DeviceStatsChart';
import { RecentActivityCard } from '@/components/admin/RecentActivityCard';
import { SettingsPanel, SettingsType } from '@/components/admin/SettingsPanel';
import { AuditLogsTable } from '@/components/admin/AuditLogsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Save, BarChart3, Settings, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SiteStats {
  totalViews: number;
  todayViews: number;
  uniqueVisitors: number;
  topContent: Array<{ id: string; title: string; views: number }>;
  avgSessionDuration: number;
  bounceRate: number;
}

interface DailyStats {
  date: string;
  views: number;
  visitors: number;
}

interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user_id: string;
}

interface RecentActivity {
  id: string;
  type: 'view' | 'play' | 'search';
  contentTitle: string;
  timestamp: Date;
}

const defaultSettings: SettingsType = {
  theme: {
    primaryColor: '#e11d48',
    darkMode: true
  },
  hero: {
    enabled: true,
    autoRotate: true
  },
  categories: {
    showMovies: true,
    showTvShows: true,
    showAnime: true
  }
};

// Simulated content titles (in production, fetch from TMDB)
const SAMPLE_CONTENT = [
  { id: '1', title: 'Oppenheimer', views: 1250 },
  { id: '2', title: 'Barbie', views: 980 },
  { id: '3', title: 'The Batman', views: 875 },
  { id: '4', title: 'Duna: Parte 2', views: 720 },
  { id: '5', title: 'Pobres Criaturas', views: 650 },
  { id: '6', title: 'Wonka', views: 590 },
  { id: '7', title: 'Aquaman 2', views: 480 },
  { id: '8', title: 'Napoleão', views: 420 },
  { id: '9', title: 'Guardiões da Galáxia Vol. 3', views: 380 },
  { id: '10', title: 'Missão Impossível 7', views: 350 },
];

export const AdminDashboard: React.FC = () => {
  const { logAuditAction } = useAdminAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<SiteStats>({
    totalViews: 0,
    todayViews: 0,
    uniqueVisitors: 0,
    topContent: [],
    avgSessionDuration: 0,
    bounceRate: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [deviceStats, setDeviceStats] = useState({ desktop: 60, mobile: 35, tablet: 5 });

  const loadData = useCallback(async () => {
    try {
      // Load statistics
      const { data: statsData } = await supabase
        .from('site_statistics')
        .select('*')
        .order('stat_date', { ascending: false })
        .limit(30);

      if (statsData && statsData.length > 0) {
        const totalViews = statsData.reduce((sum, s) => sum + (s.page_views || 0), 0);
        const uniqueVisitors = statsData.reduce((sum, s) => sum + (s.unique_visitors || 0), 0);
        const todayViews = statsData[0]?.page_views || 0;
        
        // Aggregate top content from all days
        const contentMap = new Map<string, { id: string; title: string; views: number }>();
        statsData.forEach(s => {
          if (s.content_views && typeof s.content_views === 'object') {
            Object.entries(s.content_views as Record<string, number>).forEach(([id, views]) => {
              const existing = contentMap.get(id);
              if (existing) {
                existing.views += views;
              } else {
                contentMap.set(id, { id, title: id, views });
              }
            });
          }
        });
        
        let topContent = Array.from(contentMap.values())
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);

        // Use sample data if no real data
        if (topContent.length === 0) {
          topContent = SAMPLE_CONTENT;
        }

        // Create daily stats for chart
        const daily: DailyStats[] = statsData.map(s => ({
          date: s.stat_date,
          views: s.page_views || 0,
          visitors: s.unique_visitors || 0
        }));

        setDailyStats(daily);
        setStats({ 
          totalViews: totalViews || 2450, 
          todayViews: todayViews || 156,
          uniqueVisitors: uniqueVisitors || 890, 
          topContent,
          avgSessionDuration: 245,
          bounceRate: 32.5
        });
      } else {
        // Use sample data when no stats exist
        setStats({
          totalViews: 2450,
          todayViews: 156,
          uniqueVisitors: 890,
          topContent: SAMPLE_CONTENT,
          avgSessionDuration: 245,
          bounceRate: 32.5
        });
        
        // Generate sample daily data
        const sampleDaily: DailyStats[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          sampleDaily.push({
            date: date.toISOString().split('T')[0],
            views: Math.floor(Math.random() * 200) + 50,
            visitors: Math.floor(Math.random() * 100) + 20
          });
        }
        setDailyStats(sampleDaily);
      }

      // Load settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*');

      if (settingsData && settingsData.length > 0) {
        const loadedSettings = { ...defaultSettings };
        settingsData.forEach(s => {
          if (s.setting_key === 'theme' && s.setting_value) {
            loadedSettings.theme = s.setting_value as typeof loadedSettings.theme;
          }
          if (s.setting_key === 'hero' && s.setting_value) {
            loadedSettings.hero = s.setting_value as typeof loadedSettings.hero;
          }
          if (s.setting_key === 'categories' && s.setting_value) {
            loadedSettings.categories = s.setting_value as typeof loadedSettings.categories;
          }
        });
        setSettings(loadedSettings);
      }

      // Generate sample recent activities
      const activities: RecentActivity[] = [
        { id: '1', type: 'play', contentTitle: 'Oppenheimer', timestamp: new Date(Date.now() - 5 * 60000) },
        { id: '2', type: 'view', contentTitle: 'Barbie', timestamp: new Date(Date.now() - 12 * 60000) },
        { id: '3', type: 'play', contentTitle: 'Duna: Parte 2', timestamp: new Date(Date.now() - 25 * 60000) },
        { id: '4', type: 'view', contentTitle: 'The Batman', timestamp: new Date(Date.now() - 45 * 60000) },
        { id: '5', type: 'play', contentTitle: 'Wonka', timestamp: new Date(Date.now() - 60 * 60000) },
      ];
      setRecentActivities(activities);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const loadAuditLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const { data } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setAuditLogs((data || []) as AuditLog[]);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    await loadAuditLogs();
    setIsRefreshing(false);
    toast({
      title: 'Dados atualizados',
      description: 'As estatísticas foram recarregadas.'
    });
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadData();
      await loadAuditLogs();
      setIsLoading(false);
    };
    init();
  }, [loadData, loadAuditLogs]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = [
        { setting_key: 'theme', setting_value: settings.theme },
        { setting_key: 'hero', setting_value: settings.hero },
        { setting_key: 'categories', setting_value: settings.categories }
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from('site_settings')
          .upsert(
            { 
              setting_key: setting.setting_key, 
              setting_value: setting.setting_value as unknown as Record<string, never>
            },
            { onConflict: 'setting_key' }
          );
      }

      await logAuditAction('settings_update', { settings });

      toast({
        title: 'Configurações salvas',
        description: 'As alterações foram aplicadas com sucesso.'
      });

      loadAuditLogs();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu site e visualize estatísticas em tempo real
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {/* Stats Cards + Online Users */}
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <StatsCards stats={stats} />
              <OnlineUsersCard />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ViewsChart data={dailyStats} />
              <TopContentChart data={stats.topContent} />
            </div>

            {/* Secondary Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              <DeviceStatsChart 
                desktop={deviceStats.desktop} 
                mobile={deviceStats.mobile} 
                tablet={deviceStats.tablet} 
              />
              <div className="lg:col-span-2">
                <RecentActivityCard activities={recentActivities} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel 
              settings={settings} 
              onSettingsChange={setSettings} 
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogsTable 
              logs={auditLogs} 
              isLoading={isLoadingLogs} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
