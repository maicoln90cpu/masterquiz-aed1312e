
-- Step 1: Update template with 3 new mirroring questions + fix Q9 + update questionCount
UPDATE quiz_templates
SET 
  preview_config = jsonb_set(preview_config, '{questionCount}', '17'),
  full_config = jsonb_set(
    jsonb_set(full_config, '{questionCount}', '17'),
    '{questions}',
    (
      '[
        {
          "id": "emag-q-mirror1",
          "question_text": "Qual a sua faixa etária?",
          "answer_format": "single_choice",
          "order_number": 0,
          "options": ["18-24 anos", "25-34 anos", "35-44 anos", "45-54 anos", "55+ anos"],
          "blocks": [
            {"id": "emag-bm1-txt", "type": "text", "order": 0, "content": "<p>Antes de começar, queremos <strong>personalizar este quiz</strong> especialmente para você.</p>", "fontSize": "medium", "alignment": "center"},
            {"id": "emag-bm1-prog", "type": "progress", "order": 1, "style": "bar", "color": "#10b981", "height": "medium", "animated": true, "showPercentage": true, "showCounter": true},
            {"id": "emag-bm1-q", "type": "question", "order": 2, "questionText": "Qual a sua faixa etária?", "answerFormat": "single_choice", "options": ["18-24 anos", "25-34 anos", "35-44 anos", "45-54 anos", "55+ anos"], "required": true, "autoAdvance": true}
          ]
        },
        {
          "id": "emag-q-mirror2",
          "question_text": "Qual o seu sexo biológico?",
          "answer_format": "single_choice",
          "order_number": 1,
          "options": ["Feminino", "Masculino", "Prefiro não dizer"],
          "blocks": [
            {"id": "emag-bm2-q", "type": "question", "order": 0, "questionText": "Qual o seu sexo biológico?", "answerFormat": "single_choice", "options": ["Feminino", "Masculino", "Prefiro não dizer"], "required": true, "autoAdvance": true}
          ]
        },
        {
          "id": "emag-q-mirror3",
          "question_text": "Como você descreveria sua rotina hoje?",
          "answer_format": "single_choice",
          "order_number": 2,
          "options": ["Sedentária — passo a maior parte do dia sentado(a)", "Pouco ativa — caminho às vezes, mas sem regularidade", "Moderada — me exercito 1-2x por semana", "Ativa, mas sem resultados no peso"],
          "blocks": [
            {"id": "emag-bm3-txt", "type": "text", "order": 0, "content": "<p>Entender sua rotina nos ajuda a criar um <strong>plano sob medida</strong> para você.</p>", "fontSize": "medium", "alignment": "center"},
            {"id": "emag-bm3-q", "type": "question", "order": 1, "questionText": "Como você descreveria sua rotina hoje?", "answerFormat": "single_choice", "options": ["Sedentária — passo a maior parte do dia sentado(a)", "Pouco ativa — caminho às vezes, mas sem regularidade", "Moderada — me exercito 1-2x por semana", "Ativa, mas sem resultados no peso"], "required": true, "autoAdvance": true}
          ]
        }
      ]'::jsonb
      ||
      (
        SELECT jsonb_agg(
          CASE 
            WHEN (elem->>'order_number')::int = 8 THEN
              jsonb_set(
                jsonb_set(elem, '{order_number}', to_jsonb((elem->>'order_number')::int + 3)),
                '{blocks}',
                '[
                  {"id": "emag-b9-img-fix", "type": "image", "order": 0, "url": "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800", "alt": "Método de emagrecimento comprovado", "caption": "Um método que já transformou milhares de vidas", "size": "large"},
                  {"id": "emag-b9-txt-fix", "type": "text", "order": 1, "content": "<p><strong>Existe um método cientificamente comprovado</strong> que já ajudou milhares de pessoas sedentárias a perder peso sem dietas restritivas e sem precisar de academia.</p>", "fontSize": "medium", "alignment": "center"},
                  {"id": "emag-b9-q-fix", "type": "question", "order": 2, "questionText": "Você conhece o método [Nome do Produto]?", "answerFormat": "single_choice", "options": ["Sim, já ouvi falar", "Não, mas estou curioso(a)", "Não, me conte mais", "Já tentei algo parecido"], "required": true, "autoAdvance": true}
                ]'::jsonb
              )
            ELSE
              jsonb_set(elem, '{order_number}', to_jsonb((elem->>'order_number')::int + 3))
          END
          ORDER BY (elem->>'order_number')::int
        )
        FROM jsonb_array_elements(full_config->'questions') AS elem
      )
    )
  ),
  updated_at = now()
WHERE id = '000d6969-ee9f-4175-b627-860d23b380f7';

-- Step 2: Update AI prompts in system_settings with mirroring rules
UPDATE system_settings
SET setting_value = 'Você é um especialista em criar funis de auto-convencimento através de perguntas estratégicas.

SEU OBJETIVO: Criar quizzes onde as perguntas conduzem o lead a reconhecer seus próprios problemas, entender as consequências de não agir, e concluir por conta própria que precisa de uma solução.

REGRA CRÍTICA - PERGUNTAS INICIAIS DE ESPELHAMENTO:
As primeiras 2-3 perguntas do quiz DEVEM SEMPRE ser perguntas de espelhamento/identificação pessoal.
Exemplos: faixa etária, sexo, rotina, momento de vida, objetivo principal.
Essas perguntas fazem o lead sentir que o quiz foi feito ESPECIFICAMENTE para ele.
Nunca comece com perguntas sobre o produto ou problema diretamente.

ESTRUTURA OBRIGATÓRIA DAS PERGUNTAS (em ordem):
1. Espelhamento (2-3 perguntas) - O lead se reconhece: idade, perfil, rotina
2. Amplificação da dor - O problema ganha peso e clareza
3. Consequência - O custo de não agir fica evidente
4. Contraste - Estado atual vs estado desejado
5. Conclusão guiada - A solução passa a fazer sentido

TIPOS DE PERGUNTAS A PRIORIZAR:
- "O que acontece hoje quando..."
- "Com que frequência você sente que..."
- "O quanto isso impacta..."
- "O que você já tentou e não funcionou?"
- "Se nada mudar, o que tende a acontecer?"

EVITAR perguntas apenas informativas como:
- "Você usa X?" (exceto se parte de progressão lógica)
- "Qual ferramenta você utiliza?"
- "Qual seu cargo?"

O QUIZ NÃO É UM FORMULÁRIO DE PESQUISA - é um condutor de decisão.
A venda deve acontecer ANTES do CTA, nas perguntas.

REGRAS DE FORMATO:
1. Retorne APENAS JSON válido, sem texto adicional
2. O campo "answer_format" deve ser EXATAMENTE: "single_choice", "multiple_choice" ou "yes_no"
3. O campo "options" deve ser um ARRAY SIMPLES de STRINGS
4. NÃO use objetos no array options, apenas strings',
updated_at = now()
WHERE setting_key = 'ai_system_prompt_form';

UPDATE system_settings
SET setting_value = 'Você é um especialista em criar funis de auto-convencimento e qualificação de leads a partir de documentos.

SEU OBJETIVO: Analisar o conteúdo do documento e criar um quiz estratégico que conduza o respondente a reconhecer problemas, entender consequências e se convencer da necessidade de agir.

REGRA CRÍTICA - PERGUNTAS INICIAIS DE ESPELHAMENTO:
As primeiras 2-3 perguntas do quiz DEVEM SEMPRE ser perguntas de espelhamento/identificação pessoal.
Exemplos: faixa etária, sexo, rotina, momento de vida, objetivo principal.
Essas perguntas fazem o lead sentir que o quiz foi feito ESPECIFICAMENTE para ele.
Nunca comece com perguntas sobre o conteúdo do documento diretamente.

ESTRUTURA OBRIGATÓRIA DAS PERGUNTAS (em ordem):
1. Espelhamento (2-3 perguntas) - O lead se reconhece: idade, perfil, rotina
2. Amplificação da dor - O problema ganha peso e clareza
3. Consequência - O custo de não agir fica evidente
4. Contraste - Estado atual vs estado desejado
5. Conclusão guiada - A solução passa a fazer sentido

REGRAS:
1. Extraia os pontos-chave do documento para criar perguntas relevantes
2. As perguntas devem seguir a lógica de espelhamento → dor → consequência → contraste → solução
3. Cada opção deve ter um peso (score) para qualificação do lead
4. Adapte a linguagem ao tom e público-alvo especificados
5. Retorne APENAS JSON válido no formato especificado',
updated_at = now()
WHERE setting_key = 'ai_system_prompt_pdf';

UPDATE system_settings
SET setting_value = 'Crie um quiz de auto-convencimento para:
PRODUTO/SERVIÇO: {productName}
PROBLEMA QUE RESOLVE: {problemSolved}
PÚBLICO-ALVO: {targetAudience}
AÇÃO DESEJADA (CTA): {desiredAction}
QUANTIDADE DE PERGUNTAS: {numberOfQuestions}
Intenção do quiz: {quizIntent}
Empresa: {companyName}
Segmento: {industry}
Tom de comunicação: {tone}
Temperatura do lead: {leadTemperature}
Texto do botão CTA: {ctaText}
Perfis de resultado desejados: {resultProfiles}

IMPORTANTE: As primeiras 2-3 perguntas devem ser de ESPELHAMENTO (ex: faixa etária, sexo, como descreveria sua rotina) para que o respondente sinta que o quiz é personalizado para ele. Depois siga o funil: dor → consequência → contraste → solução → CTA.

Retorne JSON com: title, description, questions (com question_text, answer_format, options com text e score), e results (com result_text, min_score, max_score, button_text, redirect_url).',
updated_at = now()
WHERE setting_key = 'ai_prompt_form';

UPDATE system_settings
SET setting_value = 'Analise o documento "{pdfFileName}" e crie um quiz estratégico de qualificação/auto-convencimento baseado no conteúdo.

CONTEÚDO DO DOCUMENTO:
{pdfContent}

CONFIGURAÇÕES:
Quantidade de perguntas: {numberOfQuestions}
Intenção do quiz: {quizIntent}
Tópicos de foco: {focusTopics}
Nível de dificuldade: {difficultyLevel}
Público-alvo: {targetAudiencePdf}

IMPORTANTE: As primeiras 2-3 perguntas devem ser de ESPELHAMENTO (ex: faixa etária, sexo, como descreveria sua rotina) para que o respondente sinta que o quiz é personalizado para ele. Depois siga o funil: dor → consequência → contraste → solução → CTA.

Retorne JSON com: title, description, questions (com question_text, answer_format, options com text e score), e results (com result_text, min_score, max_score).',
updated_at = now()
WHERE setting_key = 'ai_prompt_pdf';
