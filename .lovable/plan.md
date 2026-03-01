

## Diagnóstico: Player 1 Superflix

Entendi - o domínio `lokifilms.qzz.io` já está aprovado na Superflix. O problema pode estar no iframe do nosso código.

Comparando o iframe da Superflix com o nosso:

**Embed oficial da Superflix:**
```html
<iframe src="https://superflixapi.help/filme/299534" 
  allow="autoplay; encrypted-media; picture-in-picture" 
  allowfullscreen frameborder="0" scrolling="no" 
  style="width:100%;aspect-ratio:16/9;height:auto;max-width:100%;border:0;border-radius:12px;">
</iframe>
```

**Nosso iframe atual (`Watch.tsx` linha 174-181):**
```html
<iframe src="..." 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowFullScreen title="Player" />
```

### Possíveis causas

1. **Falta `referrerPolicy`** — A Superflix valida o domínio pelo header `Referer`. No preview do Lovable, o referer enviado é `lovableproject.com`, não `lokifilms.qzz.io`. Isso explica porque não funciona nem no preview nem no site publicado pelo Lovable (que usa `lokifil1.lovable.app`). **O player só funcionará quando acessado pelo domínio aprovado `lokifilms.qzz.io`.**

2. **Atributos faltando** — Nosso iframe não tem `frameBorder="0"` e `scrolling="no"` que o embed oficial usa.

### Plano de alteração

**Arquivo: `src/pages/Watch.tsx`** (linhas 174-181)

Atualizar o iframe para corresponder exatamente ao embed oficial da Superflix:
- Adicionar `frameBorder="0"` e `scrolling="no"`
- Ajustar o atributo `allow` para corresponder ao oficial
- Adicionar `referrerPolicy="origin"` para garantir que o referer seja enviado corretamente

Isso deve resolver o problema quando acessado via `lokifilms.qzz.io`. No preview do Lovable continuará sem funcionar porque o referer será diferente do domínio aprovado.

