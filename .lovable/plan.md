

## Plano: Atualizar domínio do Superflix

A lógica de roteamento para animes já está correta - animes usam o caminho `/serie/{id}` no Superflix, igual às séries. O que precisa mudar é o **domínio base** da API.

### Alteração

**`src/lib/api.ts`** (linha 450):
- De: `https://superflixapi.buzz`
- Para: `https://superflixapi.help`

Isso afeta todas as URLs do Player 1 (Superflix) para filmes, séries, animes e doramas.

