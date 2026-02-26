

## Plano: Site de Wallpapers nos domínios Lovable

**Objetivo:** Mostrar um site de wallpapers quando acessado por `lokifil1.lovable.app` OU qualquer domínio `lovable.app`/`lovable.dev` (incluindo preview). O site normal (LokiFilmes) aparece apenas no domínio customizado.

### Arquivos a criar

1. **`src/pages/WallpaperHome.tsx`** - Página principal do site de wallpapers
   - Header com logo e nome (ex: "WallPaper HD")
   - Barra de busca
   - Filtro por categorias: Natureza, Anime, Games, Abstrato, Carros, Espaço, Animais
   - Grid responsivo de wallpapers usando imagens do Unsplash (via URL direta, sem API key)
   - Botão de download em cada card
   - Visual moderno com tema escuro

### Arquivos a modificar

2. **`src/App.tsx`** - Detectar domínio e renderizar site correto
   - Verificar `window.location.hostname`:
     - Se contém `lovable.app` ou `lovable.dev` → renderizar rotas do WallpaperHome
     - Caso contrário → renderizar rotas normais (LokiFilmes)

### Lógica de detecção

```text
App.tsx
├── hostname includes "lovable.app" OR "lovable.dev"
│   └── WallpaperHome (site de wallpapers)
└── else
    └── Site normal (LokiFilmes - rotas existentes)
```

### Detalhes do site de wallpapers
- Categorias com emojis e grid de imagens
- Imagens via Unsplash URLs diretas (ex: `https://images.unsplash.com/photo-xxx?w=800`)
- Cards com hover effect mostrando botão de download e nome
- Layout responsivo (2 cols mobile, 3 tablet, 4 desktop)
- Sem sidebar, sem dependência do LokiFilmes

