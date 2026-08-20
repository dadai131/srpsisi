import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { channels } from '@/data/channels';
import { decodeToken, buildM3U, downloadText, TrialAccess } from '@/lib/playlist';

/** Serves channel links from our own domain: /live/:token/:file */
export default function LiveRedirect() {
  const { token = '', file = '' } = useParams();

  const state = useMemo(() => {
    const payload = decodeToken(token);
    if (!payload?.exp) return { error: 'Link inválido.' };
    if (payload.exp * 1000 < Date.now()) return { error: 'Seu acesso gratuito expirou. Gere uma nova lista.' };
    
    // A request for the full playlist (playlist.m3u or playlist.m3u8)
    const isPlaylistRequest = file.toLowerCase() === 'playlist.m3u' || file.toLowerCase() === 'playlist.m3u8';
    
    if (isPlaylistRequest) {
      const trial: TrialAccess = {
        username: payload.u || 'user',
        password: '***',
        token: token,
        exp: payload.exp,
        expLabel: new Date(payload.exp * 1000).toLocaleString('pt-BR'),
        days: 5
      };
      return { isPlaylist: true, trial };
    }

    // A request for a specific channel ID (e.g. channel-id.m3u8)
    const id = decodeURIComponent(file).replace(/\.(m3u8|mpd|ts|xml)$/i, '');
    const ch = channels.find(c => c.id === id);
    if (!ch) return { error: 'Canal não encontrado.' };
    return { url: ch.embed };
  }, [token, file]);

  useEffect(() => {
    if (state.url) {
      window.location.replace(state.url);
    } else if (state.isPlaylist && state.trial) {
      const content = buildM3U(channels, 'm3u8', state.trial);
      downloadText('lokifilmes.m3u', 'audio/x-mpegurl', content);
    }
  }, [state.url, state.isPlaylist, state.trial]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md w-full space-y-4">
        <p className="text-sm text-muted-foreground">
          {state.error ?? (state.isPlaylist ? 'Gerando sua playlist M3U...' : 'Conectando ao canal…')}
        </p>
        {state.isPlaylist && !state.error && (
          <p className="text-xs text-primary animate-pulse">
            O download iniciará automaticamente. Se não iniciar, verifique se seu navegador bloqueou o pop-up.
          </p>
        )}
      </div>
    </div>
  );
}
