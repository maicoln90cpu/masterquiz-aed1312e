# 📐 STYLE GUIDE - MasterQuiz

Guia de padrões de código e estilo para o projeto MasterQuiz.

---

## 📋 Sumário

1. [Formatação (Prettier)](#formatação-prettier)
2. [Linting (ESLint)](#linting-eslint)
3. [Logger](#logger)
4. [Nomenclatura](#nomenclatura)
5. [Estrutura de Arquivos](#estrutura-de-arquivos)
6. [TypeScript](#typescript)
7. [Componentes React](#componentes-react)
8. [Imports](#imports)
9. [CSS/Tailwind](#csstailwind)
10. [Testes Automatizados](#testes-automatizados)

---

## 📝 Formatação (Prettier)

Configuração em `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "jsxSingleQuote": false,
  "bracketSameLine": false
}
```

### Comandos
```bash
# Formatar todos os arquivos
npx prettier --write .

# Verificar formatação
npx prettier --check .
```

---

## 🔍 Linting (ESLint)

Configuração em `eslint.config.js`:

### Regras Principais

| Regra | Valor | Descrição |
|-------|-------|-----------|
| `@typescript-eslint/no-unused-vars` | warn | Avisa sobre variáveis não usadas |
| `complexity` | max: 20 | Limita complexidade ciclomática |
| `import/order` | warn | Ordena imports automaticamente |
| `import/no-duplicates` | warn | Evita imports duplicados |

### Ignorar Variáveis
Prefixe com `_` para ignorar intencionalmente:

```typescript
// ✅ Correto - ignora parâmetro não usado
const handleClick = (_event: MouseEvent) => { ... }

// ✅ Correto - ignora variável não usada
const [_unused, setUsed] = useState();
```

### Comandos
```bash
# Verificar erros
npm run lint

# Corrigir automaticamente
npm run lint -- --fix
```

---

## 📊 Logger

**NUNCA use `console.log` diretamente!** Use o logger em `src/lib/logger.ts`.

### Importação
```typescript
import { logger } from '@/lib/logger';
```

### Métodos Básicos
```typescript
logger.log('Mensagem geral');
logger.warn('Aviso');
logger.error('Erro crítico'); // Sempre aparece, mesmo em produção
logger.info('Informação');
logger.debug('Debug detalhado');
```

### Métodos Categorizados (Recomendado)
```typescript
logger.quiz('Quiz carregado', quizData);
logger.auth('Usuário logado');
logger.api('Requisição enviada', { endpoint, payload });
logger.form('Formulário salvo');
logger.analytics('Evento trackado');
logger.integration('Webhook enviado');
logger.admin('Configuração alterada');
```

### Benefícios
- **Produção**: Apenas `logger.error()` aparece
- **Desenvolvimento**: Todos os logs com timestamp
- **Categorização**: Fácil filtrar por categoria no console

---

## 📛 Nomenclatura

### Arquivos e Pastas
| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `QuizEditor.tsx` |
| Hooks | camelCase com `use` | `useQuizData.ts` |
| Utilitários | camelCase | `calculatorEngine.ts` |
| Tipos | camelCase | `blocks.ts` |
| Páginas | PascalCase | `Dashboard.tsx` |

### Variáveis e Funções
```typescript
// ✅ Correto
const quizTitle = 'Meu Quiz';
const handleSubmit = () => {};
const isLoading = true;
const MAX_QUESTIONS = 50;

// ❌ Errado
const quiz_title = 'Meu Quiz';
const HandleSubmit = () => {};
const IsLoading = true;
```

### Componentes
```typescript
// ✅ Correto
export const QuizEditor = () => { ... }
export const UserProfileCard = () => { ... }

// ❌ Errado
export const quizEditor = () => { ... }
export const User_Profile_Card = () => { ... }
```

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/              # Componentes base (shadcn)
│   ├── quiz/            # Componentes de quiz
│   ├── admin/           # Componentes do admin
│   ├── analytics/       # Componentes de analytics
│   ├── crm/             # Componentes do CRM
│   └── landing/         # Componentes da landing
├── hooks/               # Hooks customizados
├── lib/                 # Utilitários e helpers
├── pages/               # Páginas/rotas
├── types/               # Definições TypeScript
├── contexts/            # Context providers
└── i18n/                # Internacionalização
```

### Regras
1. **Componentes grandes**: Extrair para subcomponentes
2. **Lógica complexa**: Extrair para hooks
3. **Funções utilitárias**: Mover para `lib/`
4. **Evitar arquivos > 400 linhas**

---

## 🔷 TypeScript

### Tipagem
```typescript
// ✅ Interfaces para objetos
interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

// ✅ Types para unions/aliases
type QuizStatus = 'draft' | 'active' | 'archived';

// ✅ Props de componentes
interface QuizEditorProps {
  quiz: QuizData;
  onSave: (data: QuizData) => void;
}
```

### Evitar
```typescript
// ❌ any explícito (exceto casos justificados)
const data: any = response;

// ❌ Type assertions desnecessárias
const value = data as string;
```

---

## ⚛️ Componentes React

### Estrutura
```typescript
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent = ({ title, onAction }: MyComponentProps) => {
  const { t } = useTranslation();
  const [state, setState] = useState(false);

  useEffect(() => {
    // Side effects
  }, []);

  const handleClick = () => {
    logger.log('Clicked');
    onAction();
  };

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>{t('common.action')}</button>
    </div>
  );
};
```

### Boas Práticas
1. **Extrair handlers**: Funções separadas, não inline
2. **Memoização**: `useMemo` e `useCallback` quando necessário
3. **Keys**: Sempre usar keys únicas em listas
4. **Fragments**: Usar `<>` ao invés de divs desnecessárias

---

## 📦 Imports

### Ordem (automática via ESLint)
```typescript
// 1. Bibliotecas externas (react primeiro)
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Imports internos (@/)
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// 3. Componentes locais
import { Button } from '@/components/ui/button';

// 4. Types (no final)
import type { QuizData } from '@/types/quiz';
```

### Regras
- **Sem imports duplicados**
- **Path aliases**: Sempre usar `@/` ao invés de caminhos relativos longos
- **Ordem alfabética** dentro de cada grupo

---

## 🎨 CSS/Tailwind

### Design System
Usar tokens semânticos do `index.css`:

```typescript
// ✅ Correto - tokens semânticos
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground" />

// ❌ Errado - cores diretas
<div className="bg-white text-black" />
<button className="bg-green-500 text-white" />
```

### Responsividade
```typescript
// Mobile-first
<div className="p-4 md:p-6 lg:p-8" />
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
```

### Classes Longas
Usar `cn()` para classes condicionais:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)} />
```

---

## 🧪 Testes Automatizados

### Padrão AAA (Arrange-Act-Assert)

```typescript
it('increments counter when button is clicked', async () => {
  // Arrange - configurar estado inicial
  const user = userEvent.setup();
  render(<Counter initialValue={0} />);
  
  // Act - executar a ação
  await user.click(screen.getByRole('button', { name: '+' }));
  
  // Assert - verificar resultado
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### Mocking do Supabase

```typescript
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock de query
vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ 
        data: { id: '1', name: 'Test' }, 
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

### Usando test-utils.tsx

```typescript
import { render, screen, renderAuthenticated } from '@/__tests__/test-utils';

// Render básico com providers
render(<MyComponent />);

// Render com usuário autenticado
renderAuthenticated(<Dashboard />);

// Verificações
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.getByRole('button')).toBeEnabled();
```

### Referência
Veja [TESTING.md](./TESTING.md) para documentação completa de testes.

---

## 🌐 Internacionalização (i18n)

### Idiomas Suportados
- **PT** (Português) - Idioma principal
- **EN** (English) - Completo
- **ES** (Español) - Completo

### Regra de Ouro
**Nunca usar strings hardcoded em componentes UI.**

### Estrutura de Chaves

```typescript
// ✅ Correto
const { t } = useTranslation();
<Button>{t('common.save')}</Button>

// ❌ Errado
<Button>Salvar</Button>
```

### Namespaces Principais

| Namespace | Uso |
|-----------|-----|
| `common.*` | Ações e textos comuns |
| `landing.*` | Landing page |
| `landingDemo.*` | Demo do mockup |
| `quiz.*` | Editor e visualização |
| `auth.*` | Login/cadastro |
| `dashboard.*` | Dashboard |
| `crm.*` | CRM e leads |
| `analytics.*` | Analytics |
| `admin.*` | Painel admin |

### Adicionando Novas Chaves

```typescript
// 1. Adicione em src/i18n/config.ts
pt: {
  myNamespace: {
    myKey: 'Meu texto',
  }
},
en: {
  myNamespace: {
    myKey: 'My text',
  }
},
es: {
  myNamespace: {
    myKey: 'Mi texto',
  }
}

// 2. Use no componente
const { t } = useTranslation();
t('myNamespace.myKey');
```

### Interpolação

```typescript
// Com variáveis
t('quiz.stepOf', { current: 1, total: 5 })
// "1 de 5" / "1 of 5" / "1 de 5"
```

### Exclusões de i18n

O painel Master Admin (`/masteradm`) permanece em português, pois é para uso interno.

---

## ✅ Checklist de Code Review

- [ ] Sem `console.log` (usar `logger`)
- [ ] Imports ordenados
- [ ] Variáveis não usadas removidas ou prefixadas com `_`
- [ ] Componentes < 400 linhas
- [ ] Tipagem adequada (sem `any`)
- [ ] Tokens semânticos de CSS
- [ ] Textos via i18n (não hardcoded)
- [ ] Tratamento de erros adequado
- [ ] **Testes para novas funcionalidades críticas**
- [ ] **Padrão AAA nos testes**

---

## 🛠 Comandos Úteis

```bash
# Lint + Format
npm run lint
npx prettier --write .

# Verificar tipos
npx tsc --noEmit

# Rodar testes
npm test

# Testes com cobertura
npm test -- --coverage

# Build de produção
npm run build
```

---

## 🧮 Calculator Wizard Patterns

### Estrutura do Wizard
O Calculator Wizard segue um padrão de 3 passos para configurar resultados tipo calculadora:

```typescript
// Pattern de Steps
interface WizardStep {
  step: 1 | 2 | 3;
  title: string;
  component: React.FC<StepProps>;
}

// Step 1: VariableStep - Seleção de variáveis
// Step 2: FormulaStep - Editor de fórmula
// Step 3: RangesStep - Definição de faixas
```

### Melhores Práticas
1. **Estado centralizado**: Todo estado do wizard fica no componente pai (`CalculatorWizard`)
2. **Validação por step**: Cada step valida seus dados antes de permitir avançar
3. **Preview em tempo real**: Mostrar resultado da fórmula durante edição
4. **Persistência parcial**: Não perder dados ao navegar entre steps

---

## 🏗 Padrão: Thin Router para Páginas Pesadas

Para páginas com múltiplas variantes ou lógica pesada, use o padrão **thin router**:

```typescript
// src/pages/CreateQuiz.tsx — THIN ROUTER (nenhum hook pesado aqui)
const CreateQuizModern = lazy(() => import("@/pages/CreateQuizModern"));
const CreateQuizClassic = lazy(() => import("@/pages/CreateQuizClassic"));

const CreateQuiz = () => {
  const { isModern, isLoading } = useEditorLayout(); // único hook
  if (isLoading) return <Loader />;
  return isModern ? <CreateQuizModern /> : <CreateQuizClassic />;
};
```

**Por quê:** Evita hooks duplicados em re-renders e reduz o bundle carregado inicialmente.

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup, stack e arquitetura |
| [PRD.md](./PRD.md) | Requisitos do produto e backlog |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [PENDENCIAS.md](./PENDENCIAS.md) | Changelog e pendências |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [API_DOCS.md](./API_DOCS.md) | Documentação Edge Functions |
| [COMPONENTS.md](./COMPONENTS.md) | Documentação componentes |
| [BLOCKS.md](./BLOCKS.md) | Catálogo dos 34 tipos de blocos |
| [TESTING.md](./TESTING.md) | Guia de testes |

---

*Última atualização: 21/03/2026*
