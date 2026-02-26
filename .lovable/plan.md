

## Problema

O diretório `src/` está vazio. Todos os arquivos da aplicação foram removidos, causando o erro de build.

## Plano

1. **Restaurar os arquivos essenciais mínimos** para o projeto compilar e funcionar:
   - `src/main.tsx` — ponto de entrada da aplicação
   - `src/App.tsx` — componente raiz com roteamento
   - `src/App.css` / `src/index.css` — estilos base com Tailwind
   - `src/vite-env.d.ts` — tipos do Vite
   - `src/integrations/supabase/client.ts` — cliente Supabase (gerado automaticamente)
   - `src/integrations/supabase/types.ts` — tipos do banco (gerado automaticamente)

2. **Criar uma página inicial básica** (`src/pages/Index.tsx`) como ponto de partida.

3. **Recriar os componentes UI base** (pasta `src/components/ui/`) conforme necessário.

### Recomendação

Como o projeto inteiro foi perdido, a forma mais rápida seria **restaurar uma versão anterior** do histórico do projeto que ainda continha os arquivos. Isso recuperaria todo o código de uma vez.

