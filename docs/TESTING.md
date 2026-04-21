# 🧪 Guia de Testes — MasterQuiz

> Infraestrutura de testes, padrões de mock, contratos, CI/CD, E2E e troubleshooting
> Versão 2.44.0 | 21 de Abril de 2026 (Onda 5 — Testes Automatizados completa)
>
> **Nota:** Para documentação detalhada de uso do test-utils, mocking Supabase e padrões AAA, consulte as seções abaixo. O antigo `src/__tests__/README.md` foi consolidado neste documento.

---

## 📋 Índice

- [Stack de Testes](#stack-de-testes)
- [Executando](#executando)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Setup Global](#setup-global)
- [Padrões de Mock](#padrões-de-mock)
- [Mock Factory Supabase](#mock-factory-supabase)
- [Testes de Contrato (Zod)](#testes-de-contrato-zod)
- [Testes de Regressão](#testes-de-regressão)
- [Testes de Service](#testes-de-service)
- [Thresholds por Camada](#thresholds-por-camada)
- [CI/CD](#cicd)
- [Anti-Patterns](#anti-patterns)
- [E2E (Playwright — Futuro)](#e2e-playwright--futuro)
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
| Zod | 3.x | Validação de contratos RPC/API |
| Playwright | — | E2E (fixtures prontas, CI futuro) |

---

## Executando

```bash
npm run test                    # Single run
npm run test:watch              # Watch mode
npm run test:ui                 # Interface visual
npm run test:coverage           # Com cobertura
npm run test -- src/hooks/      # Rodar apenas hooks
npm run test -- src/services/   # Rodar apenas services
```

---

## Estrutura de Arquivos

```
src/
├── __tests__/
│   ├── setup.ts                # Mocks globais (CRÍTICO)
│   ├── test-utils.tsx          # Renders customizados
│   ├── mocks/
│   │   └── supabase.ts         # Mock factory reutilizável
│   ├── contracts/
│   │   └── rpc-schema.test.ts  # Validação de schemas RPC
│   └── regression/
│       └── README.md           # Template para testes de regressão
├── services/__tests__/         # observabilityService, gtmDiagnosticService
├── lib/__tests__/              # Utilitários (~165 testes)
├── hooks/__tests__/            # Hooks (~80 testes)
├── contexts/__tests__/         # AuthContext
├── components/quiz/__tests__/  # Componentes de quiz
└── pages/__tests__/            # Páginas
e2e/
├── fixtures/
│   ├── auth.ts                 # Mock roles & sessions
│   ├── api-mocks.ts            # Route interceptors Supabase
│   ├── seed-data.ts            # Dados determinísticos
│   └── test-fixtures.ts        # authenticatedTest fixture
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
```

### 5. Usar `test-utils.tsx` para renders com providers

```typescript
import { render, renderAuthenticated } from '@/__tests__/test-utils';
renderAuthenticated(<Dashboard />);
render(<MyComponent />);
```

### 6. Usar `vi.hoisted()` para mocks com variáveis externas

**IMPORTANTE**: `vi.mock` é hoisted para o topo do arquivo. Variáveis declaradas com `const` não estão disponíveis dentro da factory. Use `vi.hoisted()`:

```typescript
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));
```

---

## Mock Factory Supabase

Arquivo: `src/__tests__/mocks/supabase.ts`

Factory reutilizável com `createMockSupabaseClient()`. Expõe `_mockChain` para configuração por teste:

```typescript
import { createMockSupabaseClient } from '@/__tests__/mocks/supabase';

const mock = createMockSupabaseClient();
mock._mockChain.single.mockResolvedValue({ data: { id: '1', name: 'Test' }, error: null });
```

Inclui: `from`, `rpc`, `functions.invoke`, `auth.*`, `storage.from`, `channel`.

---

## Testes de Contrato (Zod)

Arquivo: `src/__tests__/contracts/rpc-schema.test.ts`

Validam que os schemas de RPCs e APIs estão corretos:

```typescript
import { z } from 'zod';

const TableSizeSchema = z.object({
  table_name: z.string(),
  total_size: z.string(),
});

it('aceita resposta válida', () => {
  const result = TableSizeSchema.safeParse({ table_name: 'quizzes', total_size: '2048 kB' });
  expect(result.success).toBe(true);
});
```

**Quando criar**: sempre que uma nova RPC ou endpoint for adicionado.

---

## Testes de Regressão

Pasta: `src/__tests__/regression/`

**Regra**: todo bug fix DEVE incluir um teste que reproduz o bug.

Convenção: `bug-<numero>-<descricao>.test.ts`

```typescript
describe('Regression: Bug #123 — contagem off-by-one', () => {
  it('conta corretamente incluindo zero', () => {
    expect([].length).toBe(0); // NÃO -1
  });
});
```

---

## Testes de Service

Os services do admin têm testes dedicados:

| Service | Testes | Arquivo |
|---------|--------|---------|
| `observabilityService` | 11 | `src/services/__tests__/observabilityService.test.ts` |
| `gtmDiagnosticService` | 7 | `src/services/__tests__/gtmDiagnosticService.test.ts` |

Padrão: mock do Supabase via `vi.hoisted()` + configuração de `mockFrom` por teste.

---

## Thresholds por Camada

### Configuração Global (`vitest.config.ts`)

| Métrica | Mínimo | Alvo |
|---------|--------|------|
| Lines | 40% | 60% |
| Statements | 40% | 60% |
| Functions | 40% | 60% |
| Branches | 25% | 50% |

### Por Camada (Referência)

| Camada | Mínimo | Alvo | Justificativa |
|--------|--------|------|---------------|
| Utils/Lib | 80% | 90% | Funções puras, fáceis de testar |
| Services | 60% | 80% | Lógica de negócio crítica |
| Hooks | 40% | 60% | Precisam de wrapper (QueryClient) |
| Components | 30% | 50% | Renderização + interação + snapshot |

---

## CI/CD

### GitHub Actions (`.github/workflows/test.yml`)

Executa automaticamente em push/PR para `main` e `develop`:
- Instala dependências
- Roda `npm run test:coverage`
- Upload de cobertura para Codecov
- Artefato de cobertura retido por 7 dias

### Codecov (`codecov.yml`)

- Project target: `auto` (threshold de 2%)
- Patch target: `80%` (código novo deve ter cobertura alta)

---

## Anti-Patterns

| ❌ Evitar | ✅ Correto | Por quê |
|-----------|-----------|---------|
| `expect(true).toBe(true)` | `expect(result).toEqual(expected)` | Assertion que nunca falha |
| `const mockFn = vi.fn()` em factory | `vi.hoisted(() => ({ mockFn: vi.fn() }))` | Hoisting causa ReferenceError |
| `console.log()` em testes | Silenciar ou mock do logger | Poluição no output |
| `await waitForTimeout(3000)` | `await waitFor(() => expect(...))` | Timing frágil, flaky |
| Testar implementação interna | Testar comportamento público | Quebra em refactoring |
| Mocks sem `vi.clearAllMocks()` | `beforeEach(() => vi.clearAllMocks())` | Estado vazado entre testes |

---

## E2E (Playwright)

Playwright está instalado e o smoke test mínimo roda no CI (job `e2e-smoke`, não-bloqueante).

### Estrutura

| Arquivo | Propósito |
|---------|-----------|
| `playwright.config.ts` (raiz) | Config: chromium, baseURL `http://localhost:8080`, webServer auto |
| `e2e/*.e2e.ts` | Specs E2E (testMatch `*.e2e.ts`) |
| `e2e/fixtures/auth.ts` | Mock de sessões por role (user, admin, master_admin) |
| `e2e/fixtures/api-mocks.ts` | Interceptors para auth, REST, RPC e Storage do Supabase |
| `e2e/fixtures/seed-data.ts` | Dados determinísticos (quizzes, profiles, responses) |
| `e2e/fixtures/test-fixtures.ts` | `authenticatedTest` fixture com role configurável |

### Comandos

```bash
npm run test:e2e:install   # Instala browsers (rodar uma vez)
npm run test:e2e           # Roda specs em modo headless
npm run test:e2e:ui        # Modo interativo (debug visual)
```

### Smoke ativo

`e2e/smoke-public-quiz.e2e.ts` valida:
- Landing pública carrega sem erros JS críticos
- Rota `/auth` renderiza inputs de login

### Como adicionar um fluxo autenticado

```ts
import { authenticatedTest as test, expect } from './fixtures/test-fixtures';

test.use({ role: 'admin' });
test('admin abre dashboard', async ({ authenticatedPage: page }) => {
  await page.goto('/admin');
  await expect(page.locator('h1')).toBeVisible();
});
```

### CI

Job `e2e-smoke` em `.github/workflows/test.yml` instala chromium, sobe Vite via `webServer` e roda o smoke. Marcado `continue-on-error: true` para não bloquear PR por flakiness — promova para bloqueante quando a suíte estabilizar.

---

## Troubleshooting

### "Cannot read properties of undefined"

**Causa comum:** Mock do supabase incompleto. Verifique se `functions.invoke`, `rpc`, `channel` estão mockados.

### "useAuth is not a function"

**Causa:** Conflito entre mock global e `vi.unmock`. Use `vi.unmock` **antes** dos imports.

### "Cannot access 'mockX' before initialization"

**Causa:** Variável usada dentro de `vi.mock()` factory sem `vi.hoisted()`. Veja seção [Anti-Patterns](#anti-patterns).

### Componente não renderiza conteúdo esperado

**Causa:** `useAuth` retorna `user: null` por padrão. Adicione override do mock com usuário autenticado.

### Timeout em `waitFor`

**Causa:** Queries assíncronas no jsdom são mais lentas. Aumente o timeout:

```typescript
await waitFor(() => {
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
}, { timeout: 3000 });
```

---

## Cobertura

### Executar cobertura

```bash
npm run test:coverage
```

### Relatório HTML

Após rodar cobertura, abra `coverage/index.html` no navegador.

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup e visão geral |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código (seção de testes) |
| [COMPONENTS.md](./COMPONENTS.md) | Componentes documentados |
| [BLOCKS.md](./BLOCKS.md) | Catálogo dos 34 tipos de blocos |
| [SERVICES.md](./SERVICES.md) | Catálogo de services testados |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões obrigatórios |
