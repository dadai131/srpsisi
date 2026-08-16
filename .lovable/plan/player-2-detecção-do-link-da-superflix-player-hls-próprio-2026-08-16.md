# Player 2: detecção do link da Superflix + player HLS próprio

O Player 2 deixa de usar embed de terceiros. Ele detecta o link real do vídeo (o mesmo que a Superflix usa no Player 1) e toca esse link em um player HLS dentro do site, sem anúncios e sem redirecionamentos.

## Como vai funcionar

1. Usuário abre um filme/episódio e escolhe o Player 2.
2. O backend busca a página da Superflix e aplica a lógica de detecção de mídia (inspirada no projeto media-grabber) para achar o link direto: `.m3u8`, `.mpd`, `.mp4` ou os links ofuscados `xn--...`.
3. Quando o link é um manifest HLS, o backend lê o manifest e lista as qualidades disponíveis (1080p, 720p, etc.), devolvendo a melhor primeiro.
4. O site toca esse link em um player HLS próprio, com controles, seletor de qualidade e tela cheia.
5. Se nada for encontrado, o Player 2 mostra a mensagem de erro "Stream não encontrado — use o Player 1". Nada de voltar para o iframe da Superflix.

Observação sobre o repositório indicado: `riponcm/media-grabber` é uma extensão do Chrome (usa APIs `chrome.*`), então não pode ser instalada no site. O que será aproveitado é a lógica dele: padrões de detecção de mídia, leitura de manifest HLS/DASH e ranqueamento de qualidades.

## Detalhes técnicos

**Backend (`supabase/functions/extract-stream/index.ts`)**
- Reescrever a detecção seguindo a abordagem do media-grabber:
  - varredura de `.m3u8`, `.mpd`, `.mp4`, `.ts` e do padrão `https://xn--.../m3/|/video/`;
  - extração de URLs também de strings JS escapadas (`\/\/`, `\u002f`) e de blocos `sources:`/`file:`/`atob(...)` base64;
  - seguir cadeia de iframes com profundidade máxima 2 e `Referer` correto por salto;
  - filtro de anúncios/analytics mantido e ampliado.
- Quando o resultado for `.m3u8`: baixar o manifest master e devolver `variants: [{ url, resolution, bandwidth }]` ordenado por bandwidth desc.
- Resposta: `{ streamUrl, kind: 'hls' | 'dash' | 'file', variants, referer }`. Sem link: `{ streamUrl: null }`.
- Novo endpoint auxiliar de proxy de playback (`?proxy=<url>`) para repassar segmentos com o `Referer`/`User-Agent` da Superflix, já que o CDN costuma exigir esses headers e o browser não os envia. O player usará esse proxy como origem.

**Frontend**
- Adicionar `hls.js` e usar um wrapper leve em `src/components/HlsPlayer.tsx`: `<video>` nativo + hls.js quando o navegador não tem suporte nativo a HLS, seletor de qualidade a partir dos níveis, e tratamento de erro fatal.
- `src/lib/api.ts`: `getDirectStreamUrl` passa a retornar o objeto completo (`streamUrl`, `kind`, `variants`) em vez de só a string; adicionar helper que monta a URL do proxy de playback.
- `src/pages/Watch.tsx`: no Player 2, renderizar `HlsPlayer` com o stream detectado; estado de carregamento "Detectando stream..."; em falha, exibir aviso "Stream não encontrado — use o Player 1" com botão que troca para o Player 1. Remover o fallback atual para o iframe da Superflix no Player 2. Player 1 permanece intacto.
- `index.html`: liberar em `connect-src`/`media-src` da CSP o domínio do backend usado pelo proxy de playback.
