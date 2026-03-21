# 🔍 Auditoria Completa de Projeto - Template Reutilizável

> Use este template para auditar projetos React/Lovable de forma sistemática e completa.

## Instruções de Uso

1. Cole este prompt no início de uma nova conversa com o agente
2. Adicione contexto específico do projeto se necessário
3. O agente irá analisar cada categoria e gerar um relatório estruturado
4. Use o plano de ação para priorizar correções

---

## 📋 Prompt de Auditoria

```
Faça uma análise geral e detalhada do projeto, identificando problemas e oportunidades de melhoria nas seguintes categorias:

---

## 1. Performance e Otimização

Analise e identifique:
- [ ] **Gargalos de renderização**: Componentes re-renderizando desnecessariamente
- [ ] **Bundle size**: Imports pesados que poderiam ser lazy-loaded (xlsx, recharts, html2pdf, etc.)
- [ ] **Queries ineficientes**: Chamadas ao banco sem paginação, limits, ou select específico
- [ ] **Memoização ausente**: useMemo/useCallback faltando em cálculos pesados
- [ ] **Imagens não otimizadas**: Sem lazy loading, sem formatos modernos (webp)
- [ ] **Dependências duplicadas**: Bibliotecas similares fazendo a mesma coisa
- [ ] **Re-fetches desnecessários**: Dados buscados múltiplas vezes sem cache
- [ ] **Waterfalls de requisições**: Chamadas sequenciais que poderiam ser paralelas
- [ ] **useEffect com dependências incorretas**: Loops infinitos ou execuções desnecessárias
- [ ] **Componentes sem React.memo**: Listas grandes sem otimização

**Listar pelo menos 10 itens de melhoria de performance.**

---

## 2. Arquitetura e Complexidade

Analise e identifique:
- [ ] **Componentes muito grandes** (>500 linhas): Precisam de refatoração
- [ ] **Funcionalidades misturadas**: Lógica de negócio misturada com UI
- [ ] **Código duplicado**: Blocos de renderização repetidos entre arquivos
- [ ] **Falta de componentes isolados**: Lógica repetida que deveria ser um componente
- [ ] **Props drilling excessivo**: Dados passando por muitos níveis
- [ ] **Estados desnecessários**: useState que poderia ser derivado ou memo
- [ ] **Hooks customizados faltando**: Lógica reutilizável presa em componentes
- [ ] **Arquivos gigantes**: Páginas com mais de 1000 linhas
- [ ] **Contextos mal utilizados**: Contexto global quando local bastaria
- [ ] **Falta de separação de concerns**: Componentes fazendo muitas coisas

**Para cada item, indicar arquivo, linha aproximada e solução proposta.**

---

## 3. Responsividade e UI

Analise e identifique:
- [ ] **Overflow de texto**: Conteúdo vazando de containers (sem truncate, line-clamp)
- [ ] **Conflitos de classes Tailwind**: Sobreposições em breakpoints diferentes
- [ ] **Breakpoints inconsistentes**: sm/md/lg usados de forma diferente em lugares similares
- [ ] **Touch targets pequenos**: Botões < 44px em mobile
- [ ] **Layouts quebrados**: Flex/Grid sem min-w-0 ou overflow-hidden
- [ ] **Z-index wars**: Camadas se sobrepondo incorretamente
- [ ] **Scroll horizontal indesejado**: Containers vazando da viewport
- [ ] **Cards/tabelas muito largos**: Não adaptados para telas menores
- [ ] **Modais/dialogs mal posicionados**: Cortados ou inacessíveis em mobile
- [ ] **Imagens não responsivas**: Tamanho fixo quebrando layout

**Testar em: Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px).**

---

## 4. Internacionalização (i18n)

Analise e identifique:
- [ ] **Strings hardcoded**: Textos em português/inglês diretamente no código
- [ ] **Toasts sem tradução**: Mensagens de erro/sucesso não traduzidas
- [ ] **Placeholders hardcoded**: Inputs com texto fixo
- [ ] **Datas sem formatação local**: Usando formato fixo ao invés de locale
- [ ] **Números sem formatação**: Sem considerar separadores de milhares/decimais
- [ ] **Alt texts hardcoded**: Descrições de imagens não traduzidas
- [ ] **Validações com mensagens fixas**: Erros de formulário não traduzidos
- [ ] **Labels de botões fixos**: Textos de ação não traduzidos
- [ ] **Títulos de página hardcoded**: document.title ou meta tags fixos
- [ ] **Emails/notificações não traduzidos**: Mensagens de sistema em um idioma só

**Listar todos os arquivos com violações de i18n.**

---

## 5. Segurança e RLS

Analise e identifique:
- [ ] **Tabelas sem RLS**: Dados expostos publicamente
- [ ] **Políticas permissivas demais**: `true` como condição ou `USING (true)`
- [ ] **Dados sensíveis em logs**: PII sendo logado no console
- [ ] **Secrets expostos**: Chaves API em código frontend
- [ ] **Inputs não validados**: Forms sem Zod/validação no servidor
- [ ] **SQL injection potencial**: Queries construídas com concatenação
- [ ] **XSS vulnerabilities**: HTML não sanitizado sendo renderizado
- [ ] **CORS mal configurado**: Permitindo origens demais
- [ ] **Rate limiting ausente**: Endpoints públicos sem proteção
- [ ] **Tokens expostos**: JWTs ou sessões em localStorage sem proteção

---

## 6. Consistência e Padrões

Analise e identifique:
- [ ] **Imports desorganizados**: Sem padrão de ordenação (externos, internos, relativos)
- [ ] **Tipos inconsistentes**: Mistura de types locais e centralizados
- [ ] **Hooks não padronizados**: Alguns usam TanStack Query, outros fetch manual
- [ ] **Estilos inline vs classes**: Inconsistência entre style e className
- [ ] **Nomenclatura variada**: camelCase, snake_case, PascalCase misturados
- [ ] **Tratamento de erros inconsistente**: Try/catch em alguns lugares, não em outros
- [ ] **Logs inconsistentes**: console.log misturado com logger estruturado
- [ ] **Exports inconsistentes**: Named vs default exports sem padrão
- [ ] **Comentários obsoletos**: Explicando código que mudou
- [ ] **TODOs esquecidos**: Comentários TODO/FIXME não resolvidos

---

## 7. Edge Functions e Backend

Analise e identifique:
- [ ] **Headers CORS inconsistentes**: Cada função com implementação diferente
- [ ] **Autenticação não padronizada**: Algumas usam getUser(), outras getClaims()
- [ ] **Rate limiting ausente**: Endpoints públicos sem proteção
- [ ] **Error handling variado**: Formatos de resposta de erro diferentes
- [ ] **Logs insuficientes**: Sem contexto para debugging
- [ ] **Validação de input ausente**: Dados não validados antes de processar
- [ ] **Secrets em código**: Chaves hardcoded nas funções
- [ ] **Timeouts não configurados**: Funções sem limite de execução
- [ ] **Retry logic ausente**: Falhas não tratadas com retry
- [ ] **Webhooks sem verificação**: Assinaturas não validadas

---

## 8. Documentação e Manutenibilidade

Analise e identifique:
- [ ] **README desatualizado**: Não reflete o estado atual do projeto
- [ ] **PENDENCIAS.md incompleto**: Changelog não mantido
- [ ] **Comentários obsoletos**: Explicando código que mudou
- [ ] **TODOs esquecidos**: Comentários TODO/FIXME não resolvidos
- [ ] **Types não exportados**: Tipos úteis presos em arquivos específicos
- [ ] **Funções não documentadas**: Lógica complexa sem explicação
- [ ] **Fluxos não documentados**: Processos críticos sem documentação
- [ ] **Cobertura de blocos**: Nem todos os 34 tipos com testes/docs
- [ ] **Variáveis de ambiente não documentadas**: .env sem template
- [ ] **Arquitetura não documentada**: Estrutura do projeto não explicada
- [ ] **Scripts não documentados**: package.json scripts sem descrição

---

## Formato de Resposta Esperado

Para cada categoria, forneça:

1. **Diagnóstico**: O que foi encontrado
2. **Arquivos afetados**: Lista com linha aproximada
3. **Impacto**: Baixo/Médio/Alto/Crítico
4. **Solução proposta**: Código ou descrição da correção
5. **Estimativa de esforço**: Pequeno/Médio/Grande

---

## Plano de Ação Final

Após a análise, organizar em fases:

### Fase 1: Correções Críticas (segurança, quebras)
- Itens de segurança com RLS
- Bugs que quebram funcionalidade
- Secrets expostos

### Fase 2: Performance e Otimização
- Lazy loading de bibliotecas pesadas
- Memoização de componentes críticos
- Otimização de queries

### Fase 3: Refatoração de Componentes Grandes
- Quebrar arquivos > 500 linhas
- Extrair hooks reutilizáveis
- Isolar componentes repetidos

### Fase 4: Limpeza de Código e Padronização
- Organizar imports
- Unificar tratamento de erros
- Remover código morto

### Fase 5: Responsividade e UI
- Corrigir overflow de texto
- Ajustar breakpoints inconsistentes
- Melhorar touch targets

### Fase 6: i18n e Acessibilidade
- Traduzir strings hardcoded
- Adicionar alt texts
- Melhorar navegação por teclado

### Fase 7: Documentação e Manutenção
- Atualizar README
- Documentar fluxos críticos
- Limpar TODOs

**Cada fase deve ser implementável de forma independente.**
```

---

## 📊 Checklist Rápido

Use esta lista para verificações rápidas antes de cada deploy:

### Performance
- [ ] Bundle analisado com `npm run build`
- [ ] Lazy loading em componentes pesados
- [ ] Queries com limit e select específico

### Segurança
- [ ] RLS habilitado em todas as tabelas
- [ ] Secrets em variáveis de ambiente
- [ ] Inputs validados com Zod

### Responsividade
- [ ] Testado em 3 breakpoints (mobile, tablet, desktop)
- [ ] Textos com truncate/line-clamp
- [ ] Touch targets >= 44px

### i18n
- [ ] Nenhuma string hardcoded
- [ ] Toasts traduzidos
- [ ] Datas formatadas com locale

---

## 🔧 Comandos Úteis

```bash
# Analisar bundle
npm run build && npx vite-bundle-visualizer

# Encontrar strings hardcoded (português)
grep -r "\"[A-Z].*\"" src --include="*.tsx" | grep -v "node_modules"

# Verificar tipos
npx tsc --noEmit

# Lint completo
npm run lint

# Testes
npm run test
```

---

## 📝 Notas de Uso

1. **Adapte para o contexto**: Nem todas as categorias se aplicam a todos os projetos
2. **Priorize por impacto**: Segurança > Performance > UX > Manutenibilidade
3. **Documente decisões**: Registre por que algo foi feito de certa forma
4. **Automatize o possível**: Use ESLint rules para prevenir problemas recorrentes
5. **Revise periodicamente**: Execute esta auditoria a cada major release
