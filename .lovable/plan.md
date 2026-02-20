
# Simplificar Cadastro + Corrigir Clarity/CSP

## Parte 1: Simplificar formulario de cadastro

### O que muda
- Remover campo "Confirmar Senha" do formulario de registro
- Remover barra de forca de senha (Progress) e indicadores visuais (Fraca/Media/Forte)
- Manter apenas validacao minima: 6 caracteres, qualquer combinacao
- Remover estado `showConfirmPassword` e `confirmPassword` do formData

### O que NAO muda
- Campo Nome, WhatsApp e Email continuam iguais
- Login nao muda
- Modal de migracao de conta importada continua com confirmacao de senha (seguranca extra para operacao critica)

### Detalhes tecnicos

**Arquivo: `src/pages/Login.tsx`**
- Remover `showConfirmPassword` state
- Remover `confirmPassword` do `formData` initial state
- Remover `passwordStrength` useMemo inteiro
- Na funcao `handleRegister`: remover check `password !== confirmPassword`
- No JSX do form register: remover todo o bloco do campo "Confirmar Senha" (linhas ~455-486)
- Remover bloco do indicador de forca (Progress + icones, linhas ~441-453)
- Remover imports nao utilizados: `Progress`, `CheckCircle2`, `XCircle`, `AlertCircle`

**Arquivo: `src/lib/validations.ts`**
- Simplificar `signupSchema`: remover `confirmPassword` e o `.refine()` de comparacao
- Simplificar `passwordSchema`: manter apenas `.min(6)`

## Parte 2: Corrigir CSP para Microsoft Clarity

**Arquivo: `index.html`**
- Adicionar dominios do Clarity na meta tag CSP:
  - `script-src`: adicionar `https://www.clarity.ms`
  - `connect-src`: adicionar `https://www.clarity.ms https://*.clarity.ms`
  - `img-src`: ja tem `https:` (ok)

## Arquivos modificados

| Arquivo | Alteracao |
|---------|----------|
| `src/pages/Login.tsx` | Remover confirmacao senha, barra de forca, simplificar |
| `src/lib/validations.ts` | Simplificar schemas de senha |
| `index.html` | Adicionar dominios Clarity na CSP |

## Arquivos NAO tocados

- `src/contexts/AuthContext.tsx`
- Modal de migracao (mantido como esta)
- Edge functions de auth
- Nenhuma migration de banco
