import { useMemo, useState } from 'react';
import { Download, Copy, ChevronDown, ChevronUp, ListVideo, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Channel } from '@/data/channels';
import { PlaylistFormat, buildPlaylist, formatMeta, downloadText } from '@/lib/playlist';
import { toast } from '@/hooks/use-toast';

interface PlaylistExportProps {
  channels: Channel[];
  scopeLabel: string;
}

const order: PlaylistFormat[] = ['m3u', 'm3u8', 'hls', 'dash', 'ts', 'xtream', 'xmltv'];

export function PlaylistExport({ channels, scopeLabel }: PlaylistExportProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<PlaylistFormat>('m3u8');
  const [copied, setCopied] = useState(false);

  const content = useMemo(() => buildPlaylist(channels, format), [channels, format]);
  const meta = formatMeta[format];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copiado', description: `${meta.label} copiado para a área de transferência.` });
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    downloadText(`lokifilmes-tv.${meta.ext}`, meta.mime, content);
  };

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-hover transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListVideo className="w-4 h-4 text-primary" />
          Gerar lista de canais (M3U, HLS, DASH, TS, Xtream, XMLTV)
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {order.map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  format === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/20 text-muted-foreground hover:text-foreground border border-border/50'
                }`}
              >
                {formatMeta[f].label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {meta.hint} · {channels.length} canais ({scopeLabel}) · arquivo <span className="text-foreground">lokifilmes-tv.{meta.ext}</span>
          </p>

          <pre className="max-h-52 overflow-auto rounded-lg bg-background/80 border border-border/50 p-3 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
            {content.slice(0, 4000)}
            {content.length > 4000 ? '\n…' : ''}
          </pre>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5 mr-1" /> Baixar {meta.label}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />} Copiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}