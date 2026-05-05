# 📚 STORYBOOK — Componentes UI Base

> MasterQuiz — Showcase de componentes shadcn/ui
> Versão 2.44.0 | 5 de Maio de 2026

---

## 🚀 Setup local (opcional)

Os arquivos `*.stories.tsx` seguem **Storybook CSF 3.0** e funcionam imediatamente quando você instalar o Storybook:

```bash
npm i -D storybook @storybook/react-vite @storybook/addon-essentials @storybook/addon-a11y
npm i -D @storybook/blocks @storybook/test
npx storybook init --type react --builder vite

# Rodar
npx storybook dev -p 6006

# Build estático para deploy
npx storybook build -o storybook-static
```

Configs já prontas:
- `.storybook/main.ts` — entry points em `src/components/ui/**/*.stories.tsx`
- `.storybook/preview.ts` — importa `index.css` (tokens HSL Tailwind aplicados)

---

## 📦 Stories disponíveis (5 componentes core)

| Componente | Stories | Variantes |
|------------|---------|-----------|
| **Button** | 9 | default, destructive, outline, secondary, ghost, link, loading, withIcon, sizes |
| **Input** | 4 | default, email, disabled, withLabel |
| **Card** | 1 | default (header + content + footer) |
| **Badge** | 4 | default, secondary, destructive, outline |
| **Alert** | 2 | default, destructive |

> Total: **20 stories** cobrindo as variantes mais usadas.

---

## ✍️ Como adicionar uma story

```tsx
// src/components/ui/{nome}.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MeuComponente } from './meu-componente';

const meta: Meta<typeof MeuComponente> = {
  title: 'UI/MeuComponente',
  component: MeuComponente,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof MeuComponente>;
export const Default: Story = { args: { /* ... */ } };
```

### Regras
- ✅ Use **tokens HSL semânticos** nos exemplos (nunca cores hardcoded)
- ✅ Adicione `tags: ['autodocs']` para gerar a página de documentação
- ✅ Cubra ao menos: default, variantes, estados (loading/disabled), composição
- ❌ Não importe estado global (Auth, Query) — stories devem ser autocontidas

---

## 🔗 Documentação relacionada

| Doc | Descrição |
|-----|-----------|
| [COMPONENTS.md](./COMPONENTS.md) | Catálogo geral de componentes |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Tokens semânticos obrigatórios |
| [HOOKS.md](./HOOKS.md) | Hooks customizados |
