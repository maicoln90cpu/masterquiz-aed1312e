# Testes de Regressão

Cada bug fix **deve** incluir um teste de regressão nesta pasta.

## Convenção de Nomes

```
bug-<issue-number>-<descrição-curta>.test.ts
```

## Template

```typescript
import { describe, it, expect } from 'vitest';

describe('Regression: Bug #XXX — descrição curta', () => {
  it('cenário que causava o bug', () => {
    // Arrange: setup que reproduz o bug
    // Act: executar a ação que falhava
    // Assert: verificar que agora funciona
  });
});
```
