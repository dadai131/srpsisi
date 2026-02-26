import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// Validation schemas
const settingsSchema = z.object({
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
    darkMode: z.boolean()
  }),
  hero: z.object({
    enabled: z.boolean(),
    autoRotate: z.boolean()
  }),
  categories: z.object({
    showMovies: z.boolean(),
    showTvShows: z.boolean(),
    showAnime: z.boolean()
  })
});

export type SettingsType = z.infer<typeof settingsSchema>;

interface SettingsPanelProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const updateTheme = (key: keyof SettingsType['theme'], value: string | boolean) => {
    onSettingsChange({
      ...settings,
      theme: { ...settings.theme, [key]: value }
    });
  };

  const updateHero = (key: keyof SettingsType['hero'], value: boolean) => {
    onSettingsChange({
      ...settings,
      hero: { ...settings.hero, [key]: value }
    });
  };

  const updateCategories = (key: keyof SettingsType['categories'], value: boolean) => {
    onSettingsChange({
      ...settings,
      categories: { ...settings.categories, [key]: value }
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Tema</CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure as cores e aparência do site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="primaryColor" className="text-foreground">Cor Primária</Label>
              <p className="text-sm text-muted-foreground">Cor principal do site</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={settings.theme.primaryColor}
                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                className="w-12 h-10 p-1 bg-secondary border-border cursor-pointer"
              />
              <Input
                type="text"
                value={settings.theme.primaryColor}
                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                className="w-24 bg-secondary border-border text-foreground"
                maxLength={7}
              />
            </div>
          </div>
          
          <Separator className="bg-border" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="darkMode" className="text-foreground">Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">Ativar tema escuro por padrão</p>
            </div>
            <Switch
              id="darkMode"
              checked={settings.theme.darkMode}
              onCheckedChange={(checked) => updateTheme('darkMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hero Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Seção Hero</CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure o banner principal do site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="heroEnabled" className="text-foreground">Exibir Hero</Label>
              <p className="text-sm text-muted-foreground">Mostrar banner na página inicial</p>
            </div>
            <Switch
              id="heroEnabled"
              checked={settings.hero.enabled}
              onCheckedChange={(checked) => updateHero('enabled', checked)}
            />
          </div>
          
          <Separator className="bg-border" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoRotate" className="text-foreground">Rotação Automática</Label>
              <p className="text-sm text-muted-foreground">Alternar conteúdos automaticamente</p>
            </div>
            <Switch
              id="autoRotate"
              checked={settings.hero.autoRotate}
              onCheckedChange={(checked) => updateHero('autoRotate', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Categorias</CardTitle>
          <CardDescription className="text-muted-foreground">
            Selecione quais categorias exibir no site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showMovies" className="text-foreground">Filmes</Label>
              <p className="text-sm text-muted-foreground">Exibir seção de filmes</p>
            </div>
            <Switch
              id="showMovies"
              checked={settings.categories.showMovies}
              onCheckedChange={(checked) => updateCategories('showMovies', checked)}
            />
          </div>
          
          <Separator className="bg-border" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showTvShows" className="text-foreground">Séries</Label>
              <p className="text-sm text-muted-foreground">Exibir seção de séries</p>
            </div>
            <Switch
              id="showTvShows"
              checked={settings.categories.showTvShows}
              onCheckedChange={(checked) => updateCategories('showTvShows', checked)}
            />
          </div>
          
          <Separator className="bg-border" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showAnime" className="text-foreground">Animes</Label>
              <p className="text-sm text-muted-foreground">Exibir seção de animes</p>
            </div>
            <Switch
              id="showAnime"
              checked={settings.categories.showAnime}
              onCheckedChange={(checked) => updateCategories('showAnime', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
