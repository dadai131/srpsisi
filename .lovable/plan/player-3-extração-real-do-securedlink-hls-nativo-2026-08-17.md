# Player 3 — extração real do `securedLink` (HLS nativo)

Os arquivos enviados mostram exatamente a cadeia de requisições que o Superflix usa. Vou reescrever a extração do Player 3 para reproduzir essa cadeia passo a passo em vez de tentar adivinhar links no HTML.

## Cadeia identificada nos arquivos

```text
1) GET  superflixapi.pro/filme/{tmdb}        -> HTML contém contentid + page_token
2) POST superflixapi.pro/player/bootstrap    -> lista de "options" (ID do servidor, ex. 478041)
   body: contentid, type, season, episode, page_token
3) POST superflixapi.pro/player/source       -> { data: { video_url: ".../player/redirect?t=...&pt=..." } }
   body: video_id={option.ID}, page_token
4) GET  video_url (segue redirect)           -> https://xn--...com/video/{hash}
5) POST {host}/player/index.php?data={hash}&do=getVideo
   body: hash={hash}&r=https%3A%2F%2Fsuperflixapi.pro%2F
   -> { hls: true, securedLink: "https://.../master.m3u8?md5=...&expires=..." }
```

O `securedLink` (m3u8) é o que o Player 3 deve tocar.

## O que vou fazer

**Backend (`extract-stream`)**
- Implementar a cadeia acima em ordem, com os headers que o site real envia (`X-Requested-With: XMLHttpRequest`, `X-Page-Token`, `Referer` de cada etapa, User-Agent de browser).
- Extrair `contentid` e `page_token` do HTML da página do embed via regex nas variáveis JS / atributos.
- Para séries: enviar `type=serie` com `season` e `episode`.
- Escolher a option: preferir o servidor numérico (type 1, `is_file: false`); se falhar, tentar as outras options da lista (inclui `native_media_v2:` / MP4).
- Retornar `{ streamUrl: securedLink, kind: "hls" | "mp4", expiresAt, referer }`. Manter o fallback antigo de varredura de HTML apenas se a cadeia falhar.
- Manter o modo proxy de playback (`?proxy=`) para reescrever o manifest e repassar `Referer`/`Origin` do host de origem, já que o CDN valida referer.

**Frontend**
- `src/lib/api.ts`: tipar a resposta nova e apontar o `HlsPlayer` para a URL via proxy.
- Player nativo do site: usar/ajustar `src/components/HlsPlayer.tsx` (hls.js) com controles próprios — play/pause, barra de progresso, volume, fullscreen, seletor de qualidade, e retry automático em erro de rede/expiração do token (reextrai o link).
- `src/pages/Watch.tsx`: Player 3 = player nativo puro (sem iframe), com estado de carregando/erro e aviso para usar o Player 1 se a extração falhar.
- Atualizar CSP em `index.html` (`connect-src`/`media-src`) conforme os hosts usados pelo proxy.

## Detalhes técnicos
- Toda a extração fica na Edge Function (nunca no browser) — o CDN bloqueia por referer e CORS.
- `securedLink` expira (`expires` unix, ~10 min): o front reextrai quando o hls.js reportar erro fatal de rede.
- Segmentos `.ts` e manifests variantes também passam pelo proxy para herdar o referer.
