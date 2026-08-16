import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { channels } from '@/data/channels';
import { decodeToken } from '@/lib/playlist';

/** Serves channel links from our own domain: /live/:token/:file */
export default function LiveRedirect() {
  const { token = '', file = '' } = useParams();

  const state = useMemo(() => {
    const payload = decodeToken(token);
    if (!payload?.exp) return { error: 'Link inválido.' as string };
    if (payload.exp * 1000 < Date.now()) return { error: 'Seu acesso gratuito expirou. Gere uma nova lista.' };
    const id = decodeURIComponent(file).replace(/\.(m3u8|mpd|ts|xml)$/i, '');
    const ch = channels.find(c => c.id === id);
    if (!ch) return { error: 'Canal não encontrado.' };
    return { url: ch.embed };
  }, [token, file]);

  useEffect(() => {
    if (state.url) window.location.replace(state.url);
  }, [state.url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
      <p className="text-sm text-muted-foreground">
        {state.error ?? 'Conectando ao canal…'}
      </p>
    </div>
  );
}
