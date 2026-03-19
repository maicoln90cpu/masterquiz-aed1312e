

# Plano: Mover Navegação para Step Bar + Fix Inicialização de Perguntas

## Problema 1: Botões Anterior/Próximo no footer
Os botões estão no rodapé, longe da barra de etapas. O usuário quer tudo na mesma linha horizontal para clareza.

## Problema 2: Perguntas não inicializam na Etapa 3
O `handleStepClick` (barra horizontal) tem lógica de inicialização, mas ao clicar nos steps, as perguntas podem não carregar corretamente. Preciso verificar se a lógica está sendo executada no momento certo.

## Mudanças

### Arquivo: `src/pages/CreateQuizModern.tsx`

**1. Integrar Anterior/Próximo na barra de steps (linhas 368-416)**
- Adicionar botão "Anterior" ANTES dos 5 steps
- Adicionar botão "Próximo"/"Publicar" DEPOIS do botão Preview
- Remover completamente o footer (linhas 742-778)
- Layout: `← Anterior | [1] [2] [3] [4] [5] [👁] | Próximo →`
- Botões compactos (`size="sm"`, `variant="outline"` para Anterior, `variant="default"` para Próximo)
- Manter a mesma lógica de inicialização de perguntas no botão Próximo
- No step 5, trocar "Próximo" por "Publicar" com ícone Rocket

**2. Fix inicialização de perguntas**
- Adicionar `useEffect` que monitora `step` e `questions.length`: quando `step >= 3 && questions.length === 0`, inicializar automaticamente
- Isso cobre TODOS os caminhos de navegação (step bar, footer, direto)
- Remover a lógica duplicada de inicialização do `handleStepClick` e do botão Próximo, centralizando no useEffect

### O que NÃO muda
- Classic mode intacto
- Express mode (já não tem footer de steps)
- Layout 4 colunas do Step 3
- Todos os componentes filhos

