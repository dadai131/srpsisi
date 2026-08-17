# Implementação do Player 3 e Hardening de Stream

Este plano descreve a criação do Player 3, integrando a lógica de extração de streams HLS diretamente do Player 1 (Superflix) utilizando um player nativo sem anúncios, conforme solicitado. Também inclui ajustes no sistema de playlist de TV ao vivo.

## O que será construído

- **Player 3 HLS**: Um novo player na interface de reprodução que utiliza `hls.js` para reproduzir o stream extraído do Superflix (`securedLink`).
- **Extração de Stream Hardened**: Atualização da lógica de detecção de mídia para mapear corretamente o fluxo de tokens e hashes do Superflix.
- **Integração de UI**: Adição do botão "Player 3 • HLS" com estados de carregamento e mensagens de erro específicas.
- **Hardening de CSP**: Ajuste das políticas de segurança para permitir a comunicação com os domínios de extração e proxy.
- **Correção de Playlist**: Ajuste no formato das URLs de canais individuais para o redirecionamento funcionar corretamente.
- **Manutenção de Catálogo**: Restauração da função de calendário no backend para evitar erros de compilação.

## Detalhes Técnicos

- **Frontend**:
  - Integração do `getDirectStreamUrl` no `Watch.tsx`.
  - Uso do componente `HlsPlayer` para reprodução direta via proxy (`playbackProxyUrl`).
  - Tratamento de estados `loadingStream` e `streamFailed`.
- **Backend (Edge Functions)**:
  - A função `extract-stream` já foi atualizada para reconhecer padrões `securedLink`, `xn--...` e decodificar base64.
- **Segurança**:
  - Atualização da tag `meta` de CSP no `index.html` para incluir `connect-src` e `media-src` necessários para o backend e novos domínios de embed.
- **Redirecionamento**:
  - Ajuste na `LiveRedirect.tsx` para diferenciar pedidos de playlist completa de pedidos de canais individuais.

## Próximos Passos

1. Finalizar as substituições de código no `Watch.tsx`, `api.ts`, `playlist.ts` e `LiveRedirect.tsx`.
2. Validar o fluxo de extração no ambiente de preview.
3. Verificar a correção dos erros de compilação relacionados ao `fetchCalendar`.
