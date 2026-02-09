

# Plano: Imagens do Template + Fix Upload + Novo Template Enxoval

## 1) Trocar imagens das perguntas do template Emagrecimento

### Pergunta 9 (indice 11 no array - Q12 atual)
- Substituir a URL Unsplash `photo-1556740758-90de374c12ad` pela imagem enviada `questao9.jpg` (mulher com calca folgada mostrando emagrecimento)
- Copiar `user-uploads://questao9.jpg` para `src/assets/templates/emagrecimento/questao9.jpg`
- Atualizar via SQL o `full_config->'questions'->11->'blocks'->0->>'url'`

### Pergunta 1 do template original (indice 3 no array - Q4 atual, "Ha quanto tempo voce tenta perder peso?")
- Substituir a URL Unsplash `photo-1611077544695-41be4c0c1384` pela imagem enviada `questao1.jpg` (mulher frustrada sentada ao lado da balanca)
- Copiar `user-uploads://questao1.jpg` para `src/assets/templates/emagrecimento/questao1.jpg`
- Atualizar via SQL o `full_config->'questions'->3->'blocks'->0->>'url'`

**Nota**: As imagens do template sao referenciadas por URL no JSON do banco. Como sao assets locais, precisam ser importaveis. A abordagem sera usar os caminhos relativos que o Vite resolve em build, mas como o template e armazenado no banco (JSON), usaremos as URLs dos assets ja existentes no projeto (padrao `/src/assets/templates/emagrecimento/`). Porem, como o JSON do banco nao resolve imports ES6, a melhor abordagem e manter URLs externas ou referenciar via caminho publico. Vou usar o caminho que ja funciona no projeto.

---

## 2) Fix erro de upload de imagens (bucket `quiz-media` nao existe)

O erro "Erro ao enviar imagem" ocorre porque **nao existe nenhum storage bucket** no Supabase. O `ImageUploader` tenta fazer upload para o bucket `quiz-media` que nao foi criado.

### Correcao via SQL Migration:
```sql
-- Criar bucket quiz-media (publico para exibicao)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-media', 'quiz-media', true);

-- Politica: usuarios autenticados podem fazer upload
CREATE POLICY "Users upload quiz media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-media');

-- Politica: qualquer pessoa pode ver (publico)
CREATE POLICY "Public read quiz media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz-media');

-- Politica: usuarios podem deletar seus proprios uploads
CREATE POLICY "Users delete own quiz media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quiz-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
```

---

## 3) Novo Template: Enxoval de Bebe Economico

Template com 15 perguntas seguindo o funil de auto-convencimento, para maes que querem economizar no enxoval.

### Estrutura do Funil (15 perguntas):

| # | Pergunta | Blocos | Fase |
|---|---|---|---|
| 1 | Qual a sua faixa etaria? | Question | Espelhamento |
| 2 | Voce esta gravida ou ja e mae? | Question | Espelhamento |
| 3 | Como esta sua situacao financeira atual? | Question | Espelhamento |
| 4 | Quanto voce imagina gastar no enxoval completo? | Imagem IA (quarto de bebe) + Slider (R$500 - R$10.000) + Question | Dor |
| 5 | O que mais te preocupa sobre o enxoval? | Separador + Prova Social + Question | Dor |
| 6 | Voce ja se sentiu pressionada a comprar itens caros? | Imagem IA (mae preocupada com contas) + Question | Amplificacao |
| 7 | Quantos itens do enxoval voce realmente precisa? | Comparacao (Lista Marketing vs Lista Real) + Question | Consequencia |
| 8 | Voce sabia que 40% dos itens de enxoval nunca sao usados? | Galeria IA (itens desperdicados, bebe feliz com pouco, organizacao inteligente) + Question | Consequencia |
| 9 | Qual seu maior medo como mae? | Imagem IA (mae abraçando bebe) + Question | Contraste |
| 10 | Analisando seu perfil de mae economica... | Loading + Progresso + Question | Transicao |
| 11 | Voce conhece o Guia do Enxoval Inteligente? | Imagem IA (guia/produto) + Texto persuasivo + Question | Solucao |
| 12 | O que voce mais valoriza em um guia de enxoval? | Comparacao (Comprar tudo vs Comprar certo) + Question | Contraste |
| 13 | Quanto voce ja gastou com compras desnecessarias? | Slider (R$0 - R$3.000) + Texto impactante + Question | Justificar investimento |
| 14 | Voce esta pronta para economizar de verdade? | Botao motivacional + Prova Social + Question | Compromisso |
| 15 | Oferta especial: ultimas vagas com desconto! | Countdown (10 min) + Imagem IA (mae feliz com bebe) + Texto urgencia + Question | Urgencia/CTA |

### Blocos distribuidos:
- **Imagem IA**: Perguntas 4, 6, 9, 11, 15 (5 imagens)
- **Galeria IA**: Pergunta 8 (3 imagens)
- **Separador**: Pergunta 5
- **Slider**: Perguntas 4, 13
- **Comparacao**: Perguntas 7, 12
- **Loading**: Pergunta 10
- **Progresso**: Pergunta 10
- **Prova Social**: Perguntas 5, 14
- **Botao**: Pergunta 14
- **Countdown**: Pergunta 15

### Imagens IA a gerar (8 imagens ultrarrealistas):
1. Quarto de bebe decorado e organizado
2. Mae preocupada olhando contas/orcamento
3. Itens de bebe desperdicados/sem uso
4. Bebe feliz com poucos brinquedos essenciais
5. Organizacao inteligente de enxoval
6. Mae abraçando bebe recem-nascido
7. Guia/livro de enxoval inteligente
8. Mae feliz com bebe em quarto organizado

### Resultado com CTA:
- Texto personalizado: "Parabens! Voce esta pronta para montar o enxoval perfeito gastando ate 60% menos!"
- Botao: "Quero Economizar Agora" -> checkout URL configuravel
- Coleta de leads: nome, email, WhatsApp

### Implementacao:
- Gerar 8 imagens via IA (modelo `google/gemini-2.5-flash-image`)
- Salvar em `src/assets/templates/enxoval-bebe/`
- INSERT no banco `quiz_templates` com full_config completo

---

## Resumo de Alteracoes

| Recurso | Acao |
|---|---|
| Storage | Criar bucket `quiz-media` com RLS (fix upload) |
| SQL | UPDATE template emagrecimento - trocar 2 imagens |
| Assets | Copiar questao1.jpg e questao9.jpg para assets |
| Imagens IA | Gerar 8 imagens para template enxoval |
| Assets | Salvar imagens em `src/assets/templates/enxoval-bebe/` |
| SQL | INSERT novo template "Enxoval de Bebe Inteligente" |

## Ordem de Execucao
1. Criar bucket `quiz-media` (fix upload)
2. Copiar imagens do usuario e atualizar template emagrecimento
3. Gerar imagens IA para template enxoval
4. Inserir novo template no banco

