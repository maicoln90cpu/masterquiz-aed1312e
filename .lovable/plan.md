

# Fix: Botao "Continuar" cortado no Modal de Objetivos

## Causa Raiz

O componente `DialogContent` (em `src/components/ui/dialog.tsx`, linha 39) aplica estas classes base:

```
max-h-[90vh] overflow-y-auto
```

No `UserObjectiveModal.tsx`, as classes de override sao:

```
max-h-none overflow-visible
```

O problema: `overflow-visible` (shorthand) **nao sobrescreve** `overflow-y-auto` (eixo especifico) no tailwind-merge. Resultado: o modal fica limitado a 90vh com scroll interno, e o botao fica abaixo da area visivel.

## Correcao

### Arquivo: `src/components/UserObjectiveModal.tsx`

Trocar as classes do `DialogContent` para usar `overflow-y-visible` (mesmo eixo que a base) e adicionar `!` (important) para garantir o override:

```typescript
className="sm:max-w-lg [&>button]:hidden !max-h-none !overflow-y-visible"
```

Isso garante que o tailwind-merge substitua corretamente as classes base, removendo o limite de altura e o scroll que esconde o botao.

## Resumo

| Arquivo | Alteracao |
|---------|----------|
| `src/components/UserObjectiveModal.tsx` | Trocar `max-h-none overflow-visible` por `!max-h-none !overflow-y-visible` na className do DialogContent |

Nenhuma outra mudanca necessaria. O botao ja esta renderizado junto com o modal e desabilitado ate selecionar uma opcao — o unico problema e a visibilidade CSS.

