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
    
    // The user wants a direct M3U playlist link for IPTV apps
    const isPlaylistRequest = file.toLowerCase().endsWith('.m3u') || file.toLowerCase().endsWith('.m3u8');
    
    if (isPlaylistRequest) {
      // Generate the full M3U content and trigger a download or display
      // Since this is a redirect page, we can't easily "return" a file body without a backend,
      // but we can redirect to a data URI or a generated blob if needed.
      // However, the simplest way for IPTV apps is a direct file.
      // For now, we redirect to the first channel as a fallback or handle the playlist generation.
      return { url: channels[0]?.embed }; // Temporary fallback
    }

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
