

## Integrar TVmaze como segunda fonte de temporadas

O TVmaze ainda não foi adicionado ao código. Aqui está o plano de implementação:

### 1. `src/lib/api.ts` — Nova função `fetchTVMazeSeasons`

Adicionar no final do arquivo uma função exportada que:
- Recebe o TMDB ID da série
- Busca `external_ids` no TMDB para obter o `imdb_id` (`/tv/{id}/external_ids`)
- Faz lookup no TVmaze: `GET https://api.tvmaze.com/lookup/shows?imdb={imdb_id}`
- Busca temporadas: `GET https://api.tvmaze.com/shows/{tvmaze_id}/seasons`
- Converte para o formato `SeasonInfo[]` (`season_number`, `episode_count`, `name`)
- Filtra temporada 0 (especiais)
- Retorna o array ou `[]` em caso de erro

### 2. `src/pages/Watch.tsx` — Usar ambas as fontes em paralelo

No `useEffect` de fetch de temporadas (linhas 38-59):
- Importar `fetchTVMazeSeasons` de `api.ts`
- Executar ambas as buscas com `Promise.allSettled`
- Comparar: usar a lista que retornar **mais temporadas**
- Se uma falhar, usar a outra
- Log no console indicando qual fonte foi usada

Nenhuma mudança visual — apenas a fonte de dados melhora.

