

## Diagnóstico

O site perdeu o layout anterior (sidebar + hero banner com filme em destaque) e voltou para um layout simples com header horizontal e grid de cards. A imagem mostra como deveria estar: sidebar lateral com ícones, header com logo "LokiFilmes", hero banner com filme em destaque e seções de conteúdo tipo "Top 10".

## Plano de Reconstrução

### 1. Criar componente Sidebar
- Sidebar fixa à esquerda com ícones e labels: HOME, FILMES, SÉRIES, TV AO VIVO, ANIMES, DORAMAS, TICKET, AGENDA
- Largura ~70px, ícones centralizados, item ativo em vermelho
- Cada item filtra a categoria ou navega para rota específica
- Responsivo: esconde em mobile, mostra como bottom bar ou drawer

### 2. Redesenhar Header
- Logo "LokiFilmes" à esquerda (com ícone verde)
- Barra de busca centralizada: "Buscar filmes, séries, animes..."
- Links Telegram + Calendário à direita
- Posicionado ao lado da sidebar (left offset)

### 3. Criar componente HeroBanner
- Filme em destaque com imagem backdrop full-width
- Badge "#1 EM ALTA" em vermelho + nota com estrela
- Título grande, ano, votos, sinopse truncada
- Botões "Assistir Agora" (vermelho) e "Mais Informações" (outline)
- Gradiente escuro da esquerda para legibilidade do texto
- Usa o primeiro item do conteúdo carregado como destaque

### 4. Criar seções de conteúdo horizontal
- Substituir grid por rows horizontais com scroll: "Top 10 Filmes da Semana", "Séries Populares", etc.
- Cards em formato horizontal scrollable (carousel)
- Cada seção com título e ícone de fogo

### 5. Atualizar Index.tsx
- Layout: sidebar fixa + área principal com header, hero e seções
- Remover CategoryFilter horizontal (substituído pela sidebar)
- Remover hero text simples (substituído pelo HeroBanner)

### 6. Corrigir api.ts
- Remover chamada POST duplicada em `fetchIdsFromSuperflix` (linhas 59-62) para acelerar carregamento
- Manter mock data com imagens Unsplash por enquanto

### Arquivos a criar/modificar
- **Criar**: `src/components/Sidebar.tsx`, `src/components/HeroBanner.tsx`, `src/components/ContentRow.tsx`
- **Modificar**: `src/pages/Index.tsx`, `src/components/Header.tsx`, `src/lib/api.ts`, `src/index.css`

