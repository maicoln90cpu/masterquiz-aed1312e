# 🧪 Testes Automatizados - MasterQuiz

> Para padrões de código, veja [docs/STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md). Para arquitetura, veja [docs/SYSTEM_DESIGN.md](../../docs/SYSTEM_DESIGN.md).

> Guia completo para escrever, executar e manter testes automatizados no projeto.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Executando os Testes](#executando-os-testes)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Como os Testes Funcionam](#como-os-testes-funcionam)
- [Usando test-utils.tsx](#usando-test-utilstsx)
- [Mocking Supabase](#mocking-supabase)
- [Escrevendo Novos Testes](#escrevendo-novos-testes)
- [Cobertura de Código](#cobertura-de-código)
- [CI/CD Integration](#cicd-integration)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

O projeto utiliza **Vitest** como framework de testes e **Testing Library** para testes de componentes React. A suíte de testes cobre:

| Categoria | Arquivos | Testes | Cobertura |
|-----------|----------|--------|-----------|
| Validações (Zod) | 1 | 45+ | Schemas de email, WhatsApp, slug, quiz, lead |
| Sanitização (XSS) | 1 | 40+ | Proteção contra scripts maliciosos |
| Tratamento de Erros | 1 | 25+ | Mapeamento de erros Supabase |
| Motor de Cálculo | 1 | 25+ | Fórmulas e variáveis |
| Lógica Condicional | 1 | 30+ | Operadores e AND/OR |
| Hook useAutoSave | 1 | 15+ | Debounce, estados, callbacks |
| Hook useVideoAnalytics | 1 | 20+ | Tracking de eventos de vídeo |
| Hook useFunnelData | 1 | 15+ | Dados do funil |
| Hook useABTest | 1 | 15+ | Testes A/B |
| AuthContext | 1 | 15+ | Estados de autenticação |
| LivePreview | 1 | 35+ | Renderização de blocos |
| AIQuizGenerator | 1 | 15+ | Geração com IA |
| ConditionBuilder | 1 | 15+ | Lógica condicional |
| Login Page | 1 | 40+ | Fluxo de login/signup |
| QuizView Page | 1 | 30+ | Fluxo público de quiz |
| Dashboard Page | 1 | 20+ | Estatísticas e cards |
| CRM Page | 1 | 15+ | Kanban de leads |
| Analytics Page | 1 | 15+ | Gráficos e métricas |
| **Total** | **18** | **~430** | **70%+** |

---

## Executando os Testes

### Comandos Disponíveis

```bash
# Rodar todos os testes uma vez
npm run test

# Modo watch (re-executa ao salvar arquivos)
npm run test -- --watch

# Interface visual do Vitest
npm run test -- --ui
# Abre em http://localhost:51204/__vitest__/

# Gerar relatório de cobertura
npm run test -- --coverage
# Relatório disponível em ./coverage/index.html
```

### Rodar Testes Específicos

```bash
# Testes de um arquivo específico
npm run test -- validations

# Testes com padrão no nome
npm run test -- "sanitize"

# Testes de uma pasta
npm run test -- src/lib/__tests__

# Testes de um describe específico
npm run test -- -t "emailSchema"
```

---

## Estrutura de Arquivos

```
src/
├── __tests__/
│   ├── setup.ts              # Configuração global (mocks, ambiente)
│   ├── test-utils.tsx        # Utilities customizadas (render com providers)
│   └── README.md             # Esta documentação
│
├── lib/__tests__/            # Testes de funções utilitárias
│   ├── validations.test.ts   # Schemas Zod
│   ├── sanitize.test.ts      # Segurança XSS
│   ├── errorHandler.test.ts  # Tratamento de erros
│   ├── calculatorEngine.test.ts  # Motor de cálculo
│   └── conditionEvaluator.test.ts # Lógica condicional
│
├── hooks/__tests__/          # Testes de hooks
│   ├── useAutoSave.test.ts   # ⭐ Hook de autosave com debounce
│   ├── useVideoAnalytics.test.ts # ⭐ Tracking de eventos de vídeo
│   ├── useFunnelData.test.ts # ⭐ Dados do funil de conversão
│   ├── useABTest.test.ts     # ⭐ Gestão de testes A/B
│   ├── useOnboarding.test.ts
│   └── usePlanFeatures.test.tsx
│
├── contexts/__tests__/       # Testes de contexts
│   └── AuthContext.test.tsx  # AuthProvider
│
├── components/
│   ├── __tests__/            # Testes de componentes gerais
│   │   └── AudioUploader.test.tsx
│   └── quiz/__tests__/       # Testes de componentes de quiz
│       ├── LivePreview.test.tsx
│       ├── AIQuizGenerator.test.tsx  # ⭐ Geração com IA
│       └── ConditionBuilder.test.tsx # ⭐ Lógica condicional
│
└── pages/__tests__/          # Testes de páginas
    ├── Login.test.tsx
    ├── QuizView.test.tsx
    ├── Dashboard.test.tsx    # ⭐ Dashboard principal
    ├── CRM.test.tsx          # ⭐ Kanban de leads
    └── Analytics.test.tsx    # ⭐ Gráficos e métricas
```

---

## Como os Testes Funcionam

### Durante o Desenvolvimento

Os testes automatizados funcionam como uma **rede de segurança** durante alterações no código:

1. **Detecção de Regressões**
   - Quando você altera uma função, os testes verificam se o comportamento esperado ainda funciona
   - Se um teste falha, você sabe imediatamente que quebrou algo

2. **Documentação Viva**
   - Os testes descrevem como o código deve funcionar
   - Exemplo: `test('sanitizeHtml removes script tags', ...)` documenta o comportamento

3. **Refatoração Segura**
   - Você pode reorganizar código com confiança
   - Se os testes passam, o comportamento está preservado

### Durante PRs (CI/CD)

O pipeline de CI/CD executa automaticamente:

```yaml
- name: Run Tests with Coverage
  run: npm run test -- --coverage
  
- name: Check Coverage Threshold
  # Falha se cobertura < 50%
```

**Fluxo:**
1. Você abre um PR
2. GitHub Actions executa os testes
3. Se algum teste falha → PR bloqueado
4. Se cobertura < 50% → PR bloqueado
5. Comentário automático com métricas no PR

### Prevenção de Erros

| Tipo de Erro | Como o Teste Previne |
|--------------|---------------------|
| XSS Injection | `sanitize.test.ts` verifica que scripts são removidos |
| Validação quebrada | `validations.test.ts` verifica schemas Zod |
| Cálculos errados | `calculatorEngine.test.ts` verifica fórmulas |
| Auth quebrada | `AuthContext.test.tsx` verifica estados |
| UI quebrada | `LivePreview.test.tsx` verifica renderização |
| Fluxos quebrados | `Login.test.tsx`, `QuizView.test.tsx` |

---

## Usando test-utils.tsx

### Render Básico

```tsx
import { render, screen } from '@/__tests__/test-utils';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Render com Usuário Autenticado

```tsx
import { renderAuthenticated, screen } from '@/__tests__/test-utils';
import Dashboard from './Dashboard';

test('shows user data when authenticated', () => {
  renderAuthenticated(<Dashboard />);
  expect(screen.getByText('Welcome')).toBeInTheDocument();
});
```

### Render com Usuário Customizado

```tsx
import { render, screen, createMockUser, createMockSession } from '@/__tests__/test-utils';
import Profile from './Profile';

test('shows custom user name', () => {
  const user = createMockUser({ 
    email: 'admin@example.com',
    user_metadata: { full_name: 'Admin User' }
  });
  const session = createMockSession(user);
  
  render(<Profile />, { user, session });
  expect(screen.getByText('Admin User')).toBeInTheDocument();
});
```

### Render com Rota Específica

```tsx
import { render, screen } from '@/__tests__/test-utils';
import QuizView from './QuizView';

test('renders quiz at specific route', () => {
  render(<QuizView />, { 
    initialRoute: '/quiz/abc123',
    useMemoryRouter: true 
  });
  expect(screen.getByText('Quiz')).toBeInTheDocument();
});
```

### Render com Estado de Loading

```tsx
import { renderLoading, screen } from '@/__tests__/test-utils';
import ProtectedRoute from './ProtectedRoute';

test('shows loading spinner', () => {
  renderLoading(<ProtectedRoute />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

---

## Mocking Supabase

O mock do Supabase é configurado globalmente em `setup.ts`, mas você pode sobrescrever em testes específicos:

```tsx
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock de uma query específica
vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ 
        data: { id: '1', name: 'Test Quiz' }, 
        error: null 
      })
    })
  })
} as any);

// Mock de auth
vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
  data: { user: mockUser, session: mockSession },
  error: null
});
```

---

## Escrevendo Novos Testes

### Template Básico

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@/__tests__/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders correctly with default props', () => {
      render(<MyComponent />);
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('handles click correctly', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<MyComponent onClick={onClick} />);
      await user.click(screen.getByRole('button'));
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty data gracefully', () => {
      render(<MyComponent data={[]} />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });
});
```

### Padrão AAA (Arrange-Act-Assert)

```tsx
it('increments counter when button is clicked', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Counter initialValue={0} />);
  
  // Act
  await user.click(screen.getByRole('button', { name: '+' }));
  
  // Assert
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

---

## Cobertura de Código

### Metas de Cobertura

| Métrica | Mínimo Requerido | Meta Ideal |
|---------|------------------|------------|
| Statements | 50% | 80% |
| Branches | 40% | 70% |
| Functions | 50% | 80% |
| Lines | 50% | 80% |

### Verificando Cobertura

```bash
npm run test -- --coverage
open coverage/index.html
```

O relatório mostra:
- % de linhas cobertas por arquivo
- Linhas não cobertas (destacadas em vermelho)
- Branches não testados (if/else)

### Aumentando Cobertura

1. **Identifique arquivos com baixa cobertura** no relatório
2. **Priorize arquivos críticos**: lib/, contexts/, componentes principais
3. **Teste edge cases**: erros, valores vazios, limites
4. **Teste branches**: if/else, switch, ternários

---

## CI/CD Integration

### Pipeline de PR

O arquivo `.github/workflows/pr.yml` executa:

```yaml
jobs:
  validate:
    steps:
      - Run Tests with Coverage
      - Upload Coverage Report (artifact)
      - Check Coverage Threshold (>= 50%)
      - Comment PR with Results
```

### Comentário Automático no PR

O bot comenta com:

```markdown
## 🧪 Test Coverage

| Metric | Coverage | Status |
|--------|----------|--------|
| Average | 65.23% | 🟡 |
| Lines | 68.45% | 🟡 |
| Functions | 62.10% | 🟡 |

**Threshold Check:** ✅ Passed (minimum: 50%)
```

### Artefatos de Cobertura

O relatório HTML fica disponível como artifact por 14 dias:
- Actions → Workflow Run → Artifacts → `coverage-report`

---

## Boas Práticas

### 1. Nomes Descritivos

```tsx
// ❌ Ruim
test('works', () => {});

// ✅ Bom
test('renders error message when email is invalid', () => {});
```

### 2. Use describe para Agrupar

```tsx
describe('LoginForm', () => {
  describe('validation', () => {
    test('shows error for invalid email', ...);
    test('shows error for short password', ...);
  });
  describe('submission', () => {
    test('calls onSubmit with form data', ...);
  });
});
```

### 3. Um Conceito por Teste

```tsx
// ❌ Ruim - testa múltiplas coisas
test('form works', async () => {
  render(<Form />);
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
  await user.type(...);
  await user.click(...);
  expect(mockSubmit).toHaveBeenCalled();
});

// ✅ Bom - testes separados
test('renders email input', () => {...});
test('submits form with valid data', () => {...});
```

### 4. Evite Testar Implementação

```tsx
// ❌ Ruim - testa implementação
expect(component.state.count).toBe(1);

// ✅ Bom - testa comportamento
expect(screen.getByText('1')).toBeInTheDocument();
```

### 5. Testes Independentes

Cada teste deve poder rodar sozinho, sem depender de outros:

```tsx
// ❌ Ruim - depende de estado anterior
test('first test sets up data', () => {...});
test('second test uses that data', () => {...});

// ✅ Bom - cada teste é independente
beforeEach(() => {
  // Setup fresh para cada teste
});
test('first scenario', () => {...});
test('second scenario', () => {...});
```

---

## Troubleshooting

### "Cannot find module '@/__tests__/test-utils'"

Verifique se o alias `@` está configurado no `vitest.config.ts`:

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### "useAuth must be used within an AuthProvider"

Use `render` do test-utils ao invés de `@testing-library/react`:

```tsx
// ❌ Errado
import { render } from '@testing-library/react';

// ✅ Correto
import { render } from '@/__tests__/test-utils';
```

### Testes Lentos

1. Certifique-se de que o QueryClient tem `retry: false`:
   ```ts
   new QueryClient({
     defaultOptions: { queries: { retry: false } }
   });
   ```

2. Use `vi.useFakeTimers()` para testes com setTimeout/setInterval

### Mock Não Funciona

1. Verifique se o mock está no escopo correto (beforeEach vs beforeAll)
2. Use `vi.clearAllMocks()` no beforeEach
3. Verifique a ordem: mock antes de import do componente

### Teste Passa Localmente mas Falha no CI

1. Verifique timezone (use UTC)
2. Verifique ordem de execução (testes devem ser independentes)
3. Verifique mocks que dependem de ambiente

---

## Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Mistakes with RTL](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [README.md](../../README.md) | Setup geral do projeto |
| [STYLE_GUIDE.md](../../STYLE_GUIDE.md) | Padrões de código |
| [PENDENCIAS.md](../../PENDENCIAS.md) | Changelog e histórico |
