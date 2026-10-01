import { useState } from 'react';
import { Button } from '@/components/ui/button';

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'xfqocptliyukeypvylom'}.supabase.co/functions/v1/xtream-test`;

const XtreamTest = () => {
  const [vod, setVod] = useState('45345');
  const [src, setSrc] = useState(`${BASE}?vod=45345`);
  return (
    <div className="min-h-screen bg-background text-foreground p-4 space-y-4">
      <h1 className="text-xl font-bold">Teste Player 3 • Xtream</h1>
      <div className="flex gap-2">
        <input value={vod} onChange={e => setVod(e.target.value.replace(/\D/g, ''))}
          className="flex-1 rounded-md border border-border bg-card px-3 py-2" placeholder="ID do filme" />
        <Button onClick={() => setSrc(`${BASE}?vod=${vod}`)}>Carregar</Button>
      </div>
      <video key={src} src={src} controls autoPlay className="w-full aspect-video bg-card rounded-lg" />
      <p className="text-sm text-muted-foreground">Padrão: 007 Cassino Royale (ID 45345). Conta de teste expira hoje.</p>
    </div>
  );
};
export default XtreamTest;
