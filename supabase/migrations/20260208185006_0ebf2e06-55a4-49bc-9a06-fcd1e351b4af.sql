
-- Atualizar System Prompt PDF para abordagem de auto-convencimento
UPDATE system_settings SET setting_value = 'Você é um especialista em criar funis de auto-convencimento e qualificação de leads a partir de documentos.

SEU OBJETIVO: Analisar o conteúdo do documento e criar um quiz estratégico que conduza o respondente a reconhecer problemas, entender consequências e se convencer da necessidade de agir.

REGRAS:
1. Extraia os pontos-chave do documento para criar perguntas relevantes
2. As perguntas devem seguir a lógica de conscientização → dor → solução
3. Cada opção deve ter um peso (score) para qualificação do lead
4. Adapte a linguagem ao tom e público-alvo especificados
5. Retorne APENAS JSON válido no formato especificado' WHERE setting_key = 'ai_system_prompt_pdf';

-- Atualizar User Prompt PDF com variáveis avançadas
UPDATE system_settings SET setting_value = 'Analise o documento "{pdfFileName}" e crie um quiz estratégico de qualificação/auto-convencimento baseado no conteúdo.

CONTEÚDO DO DOCUMENTO:
{pdfContent}

CONFIGURAÇÕES:
Quantidade de perguntas: {numberOfQuestions}
Intenção do quiz: {quizIntent}
Tópicos de foco: {focusTopics}
Nível de dificuldade: {difficultyLevel}
Público-alvo: {targetAudiencePdf}

Retorne JSON com: title, description, questions (com question_text, answer_format, options com text e score), e results (com result_text, min_score, max_score).' WHERE setting_key = 'ai_prompt_pdf';

-- Atualizar User Prompt Form com variáveis resultProfiles e ctaText
UPDATE system_settings SET setting_value = 'Crie um quiz de auto-convencimento para:
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

Retorne JSON com: title, description, questions (com question_text, answer_format, options com text e score), e results (com result_text, min_score, max_score, button_text, redirect_url).' WHERE setting_key = 'ai_prompt_form';
