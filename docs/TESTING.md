# 🧪 Guia de Testes — MasterQuiz

> Infraestrutura de testes, padrões de mock e troubleshooting
> Versão 2.37 | 21 de Março de 2026

---

## 📋 Índice

- [Stack de Testes](#stack-de-testes)
- [Executando](#executando)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Setup Global](#setup-global)
- [Padrões de Mock](#padrões-de-mock)
- [Troubleshooting](#troubleshooting)
- [Cobertura](#cobertura)

---

## Stack de Testes

| Ferramenta | Versão | Propósito |
|------------|--------|-----------|
| Vitest | 4.x | Framework de testes |
| @testing-library/react | 16.x | Renderização de componentes |
| @testing-library/user-event | 14.x | Simulação de interações |
| @testing-library/jest-dom | 6.x | Matchers de DOM |
| jsdom | 27.x | Ambiente de navegador |

---

## Executando

```bash
npm run test                    # Single run
npm run test -- --watch         # Watch mode
npm run test -- --ui            # Interface visual
npm run test -- --coverage      # Com cobertura
npm run test -- src/hooks/      # Rodar apenas hooks
```

---

## Estrutura de Arquivos

```
src/
├── __tests__/
│   ├── setup.ts              # Mocks globais (CRÍTICO)
│   └── test-utils.tsx         # Renders customizados
├── lib/__tests__/             # Utilitários (~165 testes)
├── hooks/__tests__/           # Hooks (~80 testes)
├── contexts/__tests__/        # AuthContext
├── components/quiz/__tests__/ # Componentes de quiz
└── pages/__tests__/           # Páginas
```

---

## Setup Global (`setup.ts`)

O `setup.ts` é carregado antes de **todos** os testes via `vitest.config.ts`. Ele configura:

### Mocks Globais Ativos

| Mock | O que faz |
|------|-----------|
| `@/integrations/supabase/client` | Supabase com `from`, `auth`, `functions`, `storage`, `channel` |
| `@/contexts/AuthContext` | `useAuth` retorna `{ user: null, session: null, loading: false }` |
| `@/hooks/useUserRole` | `useUserRole` retorna `{ role: null, isAdmin: false, isMasterAdmin: false, loading: false }` |
| `react-i18next` | `useTranslation` retorna `t(key) => key` (passthrough) |
| `matchMedia` | Mock para media queries no jsdom |
| `IntersectionObserver` | Stub para componentes com lazy loading |
| `ResizeObserver` | Stub para componentes com resize detection |

### Implicação Importante

Como `useAuth` retorna `user: null` por padrão, **componentes que dependem de autenticação não renderizam conteúdo autenticado** a menos que o mock seja sobrescrito no arquivo de teste.

---

## Padrões de Mock

### 1. Sobrescrever `useAuth` com usuário autenticado

```typescript
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
    session: { access_token: 'token' },
    loading: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

### 2. Mock de `DashboardLayout` (para testes de páginas)

Páginas como Dashboard, CRM, Analytics usam `DashboardLayout` que tem `DashboardSidebar` com dependências complexas de auth. **Mock obrigatório:**

```typescript
vi.mock('@/components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));
```

### 3. Mock de `useUserStage` e `useTrackPageView`

```typescript
vi.mock('@/hooks/useUserStage', () => ({
  useUserStage: () => ({
    currentStage: 'explorador',
    stageLabel: 'Explorador',
    primaryCTA: { label: 'Criar Quiz', action: vi.fn(), variant: 'default' },
  }),
  useTrackPageView: () => {},
}));
```

### 4. Testar hooks reais com `vi.unmock`

Quando precisar testar a implementação real (ex: `useUserRole`), desfaça o mock global:

```typescript
vi.unmock('@/hooks/useUserRole');
vi.unmock('@/contexts/AuthContext');

// Defina mock local do supabase com todos os métodos necessários
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn() },
    rpc: vi.fn(),
    // ... outros métodos
  }
}));
```

### 5. Usar `test-utils.tsx` para renders com providers

```typescript
import { render, renderAuthenticated } from '@/__tests__/test-utils';

// Render com MockAuthProvider (user autenticado)
renderAuthenticated(<Dashboard />);

// Render básico (user null do mock global)
render(<MyComponent />);
```

---

## Troubleshooting

### "Cannot read properties of undefined"

**Causa comum:** Mock do supabase incompleto. Verifique se `functions.invoke`, `rpc`, `channel` estão mockados.

### "useAuth is not a function"

**Causa:** Conflito entre mock global e `vi.unmock`. Use `vi.unmock('@/contexts/AuthContext')` **antes** dos imports do módulo testado.

### Componente não renderiza conteúdo esperado

**Causa:** `useAuth` retorna `user: null` por padrão. Adicione override do mock com usuário autenticado.

### Timeout em `waitFor`

**Causa:** Queries assíncronas no jsdom são mais lentas. Aumente o timeout:

```typescript
await waitFor(() => {
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
}, { timeout: 3000 });
```

### Assertion `getByLabelText` falha

**Causa:** O componente pode renderizar como `<button>` ou `<div>` em vez de `<label>` + `<input>`. Use `getByText` ou `getByRole` em vez de `getByLabelText`.

---

## Cobertura

### Thresholds Mínimos

| Métrica | Mínimo | Meta |
|---------|--------|------|
| Lines | 50% | 80% |
| Statements | 50% | 80% |
| Functions | 50% | 80% |
| Branches | 40% | 70% |

### Executar cobertura

```bash
npm run test -- --coverage
```

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup e visão geral |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código (seção de testes) |
| [COMPONENTS.md](./COMPONENTS.md) | Componentes documentados |
| [BLOCKS.md](./BLOCKS.md) | Catálogo dos 34 tipos de blocos |
