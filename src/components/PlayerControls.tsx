import { useState } from 'react';
import { Palette, Eye, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerTheme } from '@/types/content';
import { cn } from '@/lib/utils';

interface PlayerControlsProps {
  theme: PlayerTheme;
  onThemeChange: (theme: PlayerTheme) => void;
}

const colorOptions = [
  { value: 'e50914', label: 'Vermelho', color: '#e50914' },
  { value: '00d4aa', label: 'Verde', color: '#00d4aa' },
  { value: '0066ff', label: 'Azul', color: '#0066ff' },
  { value: 'ff6b00', label: 'Laranja', color: '#ff6b00' },
  { value: '9b59b6', label: 'Roxo', color: '#9b59b6' },
  { value: 'ffffff', label: 'Branco', color: '#ffffff' },
];

export function PlayerControls({ theme, onThemeChange }: PlayerControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card/80 backdrop-blur-lg rounded-lg border border-border/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-card-hover transition-colors"
      >
        <span className="text-sm font-medium">Configurações do Player</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-slide-up">
          {/* Color Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cor do tema</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onThemeChange({ ...theme, color: option.value })}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110',
                    theme.color === option.value ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: option.color }}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={theme.transparent ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onThemeChange({ ...theme, transparent: !theme.transparent })}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Transparente
            </Button>
            <Button
              variant={theme.noEpList ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onThemeChange({ ...theme, noEpList: !theme.noEpList })}
              className="text-xs"
            >
              <List className="w-3 h-3 mr-1" />
              Ocultar Episódios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
