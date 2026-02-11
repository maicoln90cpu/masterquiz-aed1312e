

# Plano: Fix GTM para visitantes nao logados + Botao Renomear visivel

## Problema 1: GTM nao carrega para visitantes anonimos

### Causa raiz
A tabela `system_settings` tem RLS habilitado com **apenas uma politica**: `Admins manage system settings` que exige `has_role(auth.uid(), 'admin')` ou `master_admin`. Nao existe politica de SELECT publica.

Quando o `useGlobalTracking` hook executa `supabase.from('system_settings').select(...)` sem usuario logado, o Supabase retorna **zero linhas** (RLS bloqueia). O hook recebe `gtm_container_id: null` e nunca injeta o script.

Para usuarios logados com role admin/master_admin, a politica permite leitura e o GTM carrega normalmente.

### Correcao
Adicionar uma politica RLS de SELECT publica na tabela `system_settings` **apenas para as chaves de tracking** (gtm_container_id, facebook_pixel_id, require_cookie_consent). Isso evita expor configuracoes sensiveis.

**SQL Migration:**
```sql
CREATE POLICY "Anyone can read tracking settings"
  ON public.system_settings
  FOR SELECT
  USING (setting_key IN ('gtm_container_id', 'facebook_pixel_id', 'require_cookie_consent'));
```

Isso permite que visitantes anonimos leiam apenas as 3 chaves de tracking, mantendo todas as outras configuracoes protegidas.

---

## Problema 2: Botao Renomear Pergunta invisivel

### Causa raiz
O botao de renomear (Edit3 icon) e o botao de deletar (Trash2 icon) estao dentro de um container `absolute` com `bg-card/90 backdrop-blur-sm` (linha 295). O problema e que:

1. O container usa `bg-card/90` que em alguns temas pode ter transparencia excessiva, fazendo os icones se perderem visualmente
2. Os botoes tem `variant="ghost"` que nao tem fundo/borda, e o icone Edit3 usa `text-primary` que pode se confundir com o fundo quando a pergunta esta selecionada (`bg-primary/10`)
3. Os botoes so aparecem com visibilidade total — nao ha `opacity-0 group-hover:opacity-100` entao deveriam estar sempre visiveis, mas o contraste visual e baixo

### Correcao
Tornar os botoes mais visiveis com:
- Adicionar `border border-border` no container dos botoes para dar destaque visual
- Aumentar opacidade do fundo para `bg-card` (sem transparencia)
- Adicionar `shadow-sm` para separar visualmente do conteudo

**Arquivo:** `src/components/quiz/QuestionsList.tsx`, linha 295

De:
```
className="absolute top-1.5 right-1 flex gap-0.5 z-30 bg-card/90 rounded-md p-0.5 backdrop-blur-sm min-w-fit shrink-0"
```

Para:
```
className="absolute top-1.5 right-1 flex gap-0.5 z-30 bg-card border border-border rounded-md p-0.5 shadow-sm min-w-fit shrink-0"
```

---

## Resumo de Alteracoes

| Arquivo / Recurso | Alteracao |
|---|---|
| SQL Migration | Adicionar politica RLS publica para leitura de chaves de tracking em `system_settings` |
| `src/components/quiz/QuestionsList.tsx` (linha 295) | Aumentar visibilidade dos botoes de acao (fundo solido + borda + sombra) |

## Ordem de Execucao
1. SQL Migration (RLS policy)
2. Corrigir estilo dos botoes no QuestionsList
