
# Plano: Template de Quiz de Emagrecimento (Auto-Convencimento)

## Visao Geral

Criar um template premium de quiz com 14 perguntas focado em emagrecimento para sedentarios, usando a metodologia de auto-convencimento. O quiz guia o respondente a reconhecer seus problemas e se convencer de que precisa da solucao antes de ser encaminhado ao checkout via CTA.

## Estrategia de Auto-Convencimento (Funil Psicologico)

```text
Perguntas 1-3:  IDENTIFICACAO     -> "Eu me identifico com isso"
Perguntas 4-6:  DOR/CONSEQUENCIA  -> "Isso esta me prejudicando"  
Perguntas 7-9:  TENTATIVAS        -> "Ja tentei e nao consegui sozinho"
Perguntas 10-12: DESEJO/SOLUCAO   -> "Existe algo que pode me ajudar"
Perguntas 13-14: URGENCIA/ACAO    -> "Preciso agir agora"
```

## Estrutura das 14 Perguntas com Blocos

| # | Pergunta | Blocos Incluidos | Objetivo |
|---|---|---|---|
| 1 | Ha quanto tempo voce tenta perder peso? | Imagem IA (pessoa frustrada na balanca) + Texto + Progresso + Question | Identificacao |
| 2 | Quantos kg voce gostaria de perder? | Slider (5-50kg) + Question | Engajamento quantitativo |
| 3 | Qual sua principal dificuldade? | Imagem IA (geladeira noturna) + Separador + Question | Identificacao da dor |
| 4 | O que o sedentarismo ja te causou? | Comparacao (Sedentario vs Ativo) + Question | Consciencia das consequencias |
| 5 | Voce se sente cansado mesmo dormindo? | Galeria IA (3 fotos: fadiga, insonia, estresse) + Question | Amplificar a dor |
| 6 | Algum medico ja alertou sobre seu peso? | Prova Social (notificacoes de pessoas que emagreceram) + Question | Validacao social |
| 7 | Quantas dietas voce ja tentou? | Imagem IA (antes/depois) + Separador + Question | Frustracoes passadas |
| 8 | Por que as dietas anteriores falharam? | Loading ("Analisando seu perfil...") + Question | Criar expectativa |
| 9 | Voce conhece o metodo [Nome do Produto]? | Imagem IA (produto/metodo) + Texto persuasivo + Question | Introduzir solucao |
| 10 | O que voce mais deseja conquistar? | Galeria IA (corpo saudavel, energia, autoestima) + Question | Projetar resultado desejado |
| 11 | Se houvesse um metodo comprovado, voce investiria? | Comparacao (Sem metodo vs Com metodo) + Question | Auto-convencimento |
| 12 | Quanto voce ja gastou com dietas que nao funcionaram? | Slider (R$0 - R$5.000) + Texto impactante + Question | Justificar investimento |
| 13 | Voce esta pronto para mudar de vida agora? | Botao motivacional + Prova Social + Question | Compromisso |
| 14 | Ultima chance: garantia ou arrependimento? | Countdown (10 min) + Imagem IA (transformacao) + Texto urgencia + Question | Urgencia final |

## Blocos Especiais Distribuidos

- **Imagem IA**: Perguntas 1, 3, 7, 9, 14 (5 imagens ultrarrealistas)
- **Galeria IA**: Perguntas 5, 10 (2 galerias com 3 imagens cada)
- **Separador**: Perguntas 3, 7
- **Slider**: Perguntas 2, 12
- **Comparacao**: Perguntas 4, 11
- **Loading**: Pergunta 8
- **Progresso**: Pergunta 1
- **Prova Social**: Perguntas 6, 13
- **Botao**: Pergunta 13
- **Countdown**: Pergunta 14

## Resultado Final (Pagina de Resultado)

Texto persuasivo com CTA "Garantir Minha Vaga com Desconto" direcionando ao checkout. Inclui:
- Resumo personalizado baseado nas respostas
- Urgencia (vagas limitadas)
- Garantia de satisfacao
- Botao CTA com redirect_url configuravel

## Implementacao Tecnica

### Passo 1: Gerar imagens via IA

Usar o modelo `google/gemini-2.5-flash-image` para gerar 11 imagens ultrarrealistas:

1. Pessoa frustrada olhando para a balanca (sedentaria, realista)
2. Pessoa abrindo geladeira a noite (cena domestica)
3. Galeria fadiga: pessoa exausta no sofa
4. Galeria insonia: pessoa acordada de madrugada
5. Galeria estresse: pessoa estressada no trabalho
6. Transformacao antes/depois (split screen)
7. Produto/metodo (embalagem profissional)
8. Galeria resultado: pessoa com energia correndo
9. Galeria resultado: pessoa feliz na balanca
10. Galeria resultado: pessoa confiante no espelho
11. Transformacao final (pessoa saudavel e feliz)

As imagens serao geradas, salvas em storage (quiz-media) e referenciadas por URL no template.

### Passo 2: Inserir template no banco via SQL Migration

Inserir na tabela `quiz_templates` com:
- `name`: "Emagrecimento - Auto-Convencimento"
- `category`: "lead_qualification"
- `icon`: "🏋️"
- `is_premium`: false (disponivel para todos)
- `is_active`: true
- `preview_config`: JSON com titulo, descricao, questionCount: 14, template: "moderno"
- `full_config`: JSON completo com as 14 perguntas, blocos, formConfig e results

### Passo 3: Criar Edge Function para gerar imagens

Como as imagens precisam ser geradas via IA e salvas no storage, criaremos uma edge function `generate-template-images` que:
1. Recebe os prompts de imagem
2. Chama a API Gemini para gerar cada imagem
3. Salva no storage bucket `quiz-media`
4. Retorna as URLs publicas

Alternativa mais simples: usar imagens de stock (Unsplash/Pexels) como placeholder inicial e o usuario pode trocar por imagens IA depois no editor. Isso evita complexidade de geracao automatica.

### Abordagem Recomendada

Dado que a geracao de imagens por IA dentro de uma migration e complexa (precisa de storage bucket, API calls, etc.), a abordagem sera:

1. **Inserir o template com imagens placeholder** (URLs Unsplash de alta qualidade relacionadas a fitness/emagrecimento)
2. **O template ficara completo e funcional** com todas as 14 perguntas e blocos
3. **As imagens podem ser trocadas manualmente** pelo admin no editor de templates ou pelo usuario ao usar o template

Isso garante que o template funcione imediatamente sem depender de infraestrutura adicional.

## Arquivos a Alterar

| Arquivo | Alteracao |
|---|---|
| SQL Migration | INSERT na tabela `quiz_templates` com full_config completo |

Nenhum arquivo de codigo precisa ser alterado -- o template sera inserido diretamente no banco e o sistema ja o carrega automaticamente via `useQuizTemplates`.
