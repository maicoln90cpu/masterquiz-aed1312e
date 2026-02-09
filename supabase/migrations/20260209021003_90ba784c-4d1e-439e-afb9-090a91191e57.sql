
UPDATE quiz_templates 
SET full_config = '{
  "title": "Enxoval de Bebê Inteligente",
  "description": "Descubra como montar o enxoval perfeito gastando até 60% menos!",
  "template": "moderno",
  "questionCount": 15,
  "formConfig": {
    "collect_name": true,
    "collect_email": true,
    "collect_whatsapp": true,
    "collection_timing": "after"
  },
  "questions": [
    {
      "id": "enx-q1",
      "question_text": "Qual é a sua faixa etária?",
      "answer_format": "single_choice",
      "options": ["Menos de 20 anos", "20 a 25 anos", "26 a 30 anos", "31 a 35 anos", "Acima de 35 anos"],
      "order_number": 0,
      "blocks": [
        {"id": "enx-b1-txt", "type": "text", "content": "<p>Antes de começar, queremos <strong>personalizar este quiz</strong> especialmente para você.</p>", "alignment": "center", "fontSize": "medium", "order": 0},
        {"id": "enx-b1-prog", "type": "progress", "style": "bar", "color": "#10b981", "height": "medium", "animated": true, "showPercentage": true, "showCounter": true, "order": 1},
        {"id": "enx-b1-q", "type": "question", "questionText": "Qual é a sua faixa etária?", "answerFormat": "single_choice", "options": ["Menos de 20 anos", "20 a 25 anos", "26 a 30 anos", "31 a 35 anos", "Acima de 35 anos"], "required": true, "autoAdvance": true, "order": 2}
      ]
    },
    {
      "id": "enx-q2",
      "question_text": "Você está grávida ou já é mãe?",
      "answer_format": "single_choice",
      "options": ["Estou grávida do primeiro filho", "Estou grávida (já tenho filhos)", "Já sou mãe e estou planejando outro bebê", "Estou planejando engravidar em breve"],
      "order_number": 1,
      "blocks": [
        {"id": "enx-b2-q", "type": "question", "questionText": "Você está grávida ou já é mãe?", "answerFormat": "single_choice", "options": ["Estou grávida do primeiro filho", "Estou grávida (já tenho filhos)", "Já sou mãe e estou planejando outro bebê", "Estou planejando engravidar em breve"], "required": true, "autoAdvance": true, "order": 0}
      ]
    },
    {
      "id": "enx-q3",
      "question_text": "Como está sua situação financeira atual?",
      "answer_format": "single_choice",
      "options": ["Muito apertada - cada real conta", "Consigo pagar as contas mas sem folga", "Razoável - posso investir com planejamento", "Tranquila - mas quero gastar com inteligência"],
      "order_number": 2,
      "blocks": [
        {"id": "enx-b3-txt", "type": "text", "content": "<p>Entender sua situação nos ajuda a criar um <strong>plano sob medida</strong> para você.</p>", "alignment": "center", "fontSize": "medium", "order": 0},
        {"id": "enx-b3-q", "type": "question", "questionText": "Como está sua situação financeira atual?", "answerFormat": "single_choice", "options": ["Muito apertada - cada real conta", "Consigo pagar as contas mas sem folga", "Razoável - posso investir com planejamento", "Tranquila - mas quero gastar com inteligência"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q4",
      "question_text": "Quanto você imagina gastar no enxoval completo?",
      "answer_format": "single_choice",
      "options": ["Menos de R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 5.000", "Mais de R$ 5.000"],
      "order_number": 3,
      "blocks": [
        {"id": "enx-b4-img", "type": "image", "url": "/templates/enxoval-bebe/quarto-bebe.jpg", "alt": "Quarto de bebê decorado", "width": "100%", "order": 0},
        {"id": "enx-b4-slider", "type": "slider", "min": 500, "max": 10000, "step": 100, "defaultValue": 3000, "unit": "R$", "label": "Qual seu orçamento estimado para o enxoval?", "showValue": true, "required": true, "order": 1},
        {"id": "enx-b4-q", "type": "question", "questionText": "Quanto você imagina gastar no enxoval completo?", "answerFormat": "single_choice", "options": ["Menos de R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 5.000", "Mais de R$ 5.000"], "required": true, "autoAdvance": true, "order": 2}
      ]
    },
    {
      "id": "enx-q5",
      "question_text": "O que mais te preocupa sobre montar o enxoval?",
      "answer_format": "single_choice",
      "options": ["Gastar demais com coisas desnecessárias", "Não saber o que realmente é essencial", "Pressão de familiares e amigas para comprar tudo", "Medo de faltar algo importante para o bebê"],
      "order_number": 4,
      "blocks": [
        {"id": "enx-b5-sep", "type": "separator", "style": "gradient", "label": "Vamos entender suas preocupações", "order": 0},
        {"id": "enx-b5-social", "type": "socialProof", "notifications": [{"name": "Pesquisa MaeBaby", "action": "revelou que 87% das mães gastam mais do que planejaram", "time": "2025"}], "interval": 5, "style": "toast", "position": "bottom-left", "order": 1},
        {"id": "enx-b5-q", "type": "question", "questionText": "O que mais te preocupa sobre montar o enxoval?", "answerFormat": "single_choice", "options": ["Gastar demais com coisas desnecessárias", "Não saber o que realmente é essencial", "Pressão de familiares e amigas para comprar tudo", "Medo de faltar algo importante para o bebê"], "required": true, "autoAdvance": true, "order": 2}
      ]
    },
    {
      "id": "enx-q6",
      "question_text": "Você já se sentiu pressionada a comprar itens caros para o bebê?",
      "answer_format": "single_choice",
      "options": ["Sim, sempre! Parece que tudo de bebê é absurdamente caro", "Às vezes, principalmente por influência de redes sociais", "Um pouco, mas tento manter o foco no essencial", "Não, sou bem decidida nas minhas escolhas"],
      "order_number": 5,
      "blocks": [
        {"id": "enx-b6-img", "type": "image", "url": "/templates/enxoval-bebe/mae-preocupada-contas.jpg", "alt": "Mãe preocupada com contas", "width": "100%", "order": 0},
        {"id": "enx-b6-q", "type": "question", "questionText": "Você já se sentiu pressionada a comprar itens caros para o bebê?", "answerFormat": "single_choice", "options": ["Sim, sempre! Parece que tudo de bebê é absurdamente caro", "Às vezes, principalmente por influência de redes sociais", "Um pouco, mas tento manter o foco no essencial", "Não, sou bem decidida nas minhas escolhas"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q7",
      "question_text": "Quantos itens do enxoval você realmente acha que vai precisar?",
      "answer_format": "single_choice",
      "options": ["Mais de 100 itens - preciso de tudo!", "Entre 50 e 100 itens", "Entre 20 e 50 itens essenciais", "Menos de 20 - só o necessário"],
      "order_number": 6,
      "blocks": [
        {"id": "enx-b7-comp", "type": "comparison", "leftTitle": "Lista do Marketing", "leftItems": ["Carrinho importado R$ 3.000+", "Berço multifuncional R$ 2.500", "50 bodies de todas as marcas", "Babá eletrônica 4K", "Kit enxoval de grife completo"], "leftStyle": "negative", "rightTitle": "Lista Real (o que funciona)", "rightItems": ["Carrinho simples e seguro R$ 500", "Berço padrão certificado R$ 800", "15 bodies de algodão", "Monitor simples R$ 150", "Kit essencial bem escolhido"], "rightStyle": "positive", "style": "versus", "order": 0},
        {"id": "enx-b7-q", "type": "question", "questionText": "Quantos itens do enxoval você realmente acha que vai precisar?", "answerFormat": "single_choice", "options": ["Mais de 100 itens - preciso de tudo!", "Entre 50 e 100 itens", "Entre 20 e 50 itens essenciais", "Menos de 20 - só o necessário"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q8",
      "question_text": "Você sabia que 40% dos itens de enxoval nunca são usados?",
      "answer_format": "single_choice",
      "options": ["Não sabia! Isso me surpreende muito", "Já desconfiava, mas não sabia o número exato", "Sim, por isso quero ser mais inteligente nas compras", "Já aconteceu comigo em outras situações"],
      "order_number": 7,
      "blocks": [
        {"id": "enx-b8-gallery", "type": "gallery", "layout": "grid", "images": [{"url": "/templates/enxoval-bebe/itens-desperdicados.jpg", "alt": "Itens de bebê desperdiçados", "caption": "40% dos itens nunca são usados"}, {"url": "/templates/enxoval-bebe/bebe-feliz-essencial.jpg", "alt": "Bebê feliz com poucos brinquedos", "caption": "Menos é mais para o bebê"}, {"url": "/templates/enxoval-bebe/organizacao-inteligente.jpg", "alt": "Organização inteligente", "caption": "Enxoval inteligente e organizado"}], "order": 0},
        {"id": "enx-b8-q", "type": "question", "questionText": "Você sabia que 40% dos itens de enxoval nunca são usados?", "answerFormat": "single_choice", "options": ["Não sabia! Isso me surpreende muito", "Já desconfiava, mas não sabia o número exato", "Sim, por isso quero ser mais inteligente nas compras", "Já aconteceu comigo em outras situações"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q9",
      "question_text": "Qual é o seu maior medo como mãe (ou futura mãe)?",
      "answer_format": "single_choice",
      "options": ["Não conseguir dar o melhor para meu filho", "Me endividar por causa do bebê", "Ser julgada por não comprar itens de marca", "Não estar preparada quando o bebê chegar"],
      "order_number": 8,
      "blocks": [
        {"id": "enx-b9-img", "type": "image", "url": "/templates/enxoval-bebe/mae-abraco-bebe.jpg", "alt": "Mãe cuidando do bebê com amor", "width": "100%", "order": 0},
        {"id": "enx-b9-q", "type": "question", "questionText": "Qual é o seu maior medo como mãe (ou futura mãe)?", "answerFormat": "single_choice", "options": ["Não conseguir dar o melhor para meu filho", "Me endividar por causa do bebê", "Ser julgada por não comprar itens de marca", "Não estar preparada quando o bebê chegar"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q10",
      "question_text": "Se existisse um guia que mostrasse EXATAMENTE o que comprar, quanto pagar e onde encontrar, você seguiria?",
      "answer_format": "single_choice",
      "options": ["Com certeza! É exatamente o que eu preciso", "Provavelmente sim, se fosse confiável", "Talvez, dependeria do conteúdo", "Prefiro pesquisar por conta própria"],
      "order_number": 9,
      "blocks": [
        {"id": "enx-b10-img", "type": "image", "url": "/templates/enxoval-bebe/guia-enxoval.jpg", "alt": "Guia do enxoval inteligente", "width": "100%", "order": 0},
        {"id": "enx-b10-q", "type": "question", "questionText": "Se existisse um guia que mostrasse EXATAMENTE o que comprar, quanto pagar e onde encontrar, você seguiria?", "answerFormat": "single_choice", "options": ["Com certeza! É exatamente o que eu preciso", "Provavelmente sim, se fosse confiável", "Talvez, dependeria do conteúdo", "Prefiro pesquisar por conta própria"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q11",
      "question_text": "Você prefere comprar tudo novo ou aceita itens usados em bom estado?",
      "answer_format": "single_choice",
      "options": ["Tudo novo, sem exceção", "Aceito alguns itens usados de pessoas próximas", "Aceito usados em bom estado para economizar", "Prefiro usados - sustentabilidade em primeiro lugar"],
      "order_number": 10,
      "blocks": [
        {"id": "enx-b11-social", "type": "socialProof", "notifications": [{"name": "Ana Paula", "action": "economizou R$ 2.400 no enxoval", "time": "há 3 dias"}, {"name": "Camila S.", "action": "montou o enxoval completo por R$ 1.200", "time": "há 5 dias"}, {"name": "Juliana M.", "action": "seguiu o guia e economizou 55%", "time": "há 1 semana"}], "interval": 4, "style": "toast", "position": "bottom-left", "order": 0},
        {"id": "enx-b11-q", "type": "question", "questionText": "Você prefere comprar tudo novo ou aceita itens usados em bom estado?", "answerFormat": "single_choice", "options": ["Tudo novo, sem exceção", "Aceito alguns itens usados de pessoas próximas", "Aceito usados em bom estado para economizar", "Prefiro usados - sustentabilidade em primeiro lugar"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q12",
      "question_text": "Quanto tempo falta para o bebê chegar?",
      "answer_format": "single_choice",
      "options": ["Menos de 1 mês - urgente!", "1 a 3 meses", "3 a 6 meses", "Mais de 6 meses - ainda estou planejando"],
      "order_number": 11,
      "blocks": [
        {"id": "enx-b12-q", "type": "question", "questionText": "Quanto tempo falta para o bebê chegar?", "answerFormat": "single_choice", "options": ["Menos de 1 mês - urgente!", "1 a 3 meses", "3 a 6 meses", "Mais de 6 meses - ainda estou planejando"], "required": true, "autoAdvance": true, "order": 0}
      ]
    },
    {
      "id": "enx-q13",
      "question_text": "O que seria mais valioso para você agora?",
      "answer_format": "single_choice",
      "options": ["Lista completa do que realmente preciso comprar", "Comparativo de preços com melhores lojas", "Dicas de o que NÃO comprar (itens inúteis)", "Tudo isso junto em um guia prático"],
      "order_number": 12,
      "blocks": [
        {"id": "enx-b13-img", "type": "image", "url": "/templates/enxoval-bebe/mae-feliz-bebe.jpg", "alt": "Mãe feliz com seu bebê", "width": "100%", "order": 0},
        {"id": "enx-b13-q", "type": "question", "questionText": "O que seria mais valioso para você agora?", "answerFormat": "single_choice", "options": ["Lista completa do que realmente preciso comprar", "Comparativo de preços com melhores lojas", "Dicas de o que NÃO comprar (itens inúteis)", "Tudo isso junto em um guia prático"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q14",
      "question_text": "Se esse guia custasse menos que UM body de bebê de marca, você investiria?",
      "answer_format": "single_choice",
      "options": ["Sim, sem pensar duas vezes!", "Provavelmente sim", "Precisaria ver mais detalhes", "Não invisto em conteúdo digital"],
      "order_number": 13,
      "blocks": [
        {"id": "enx-b14-loading", "type": "loading", "text": "Analisando suas respostas...", "subtext": "Preparando seu resultado personalizado", "duration": 3, "style": "pulse", "order": 0},
        {"id": "enx-b14-q", "type": "question", "questionText": "Se esse guia custasse menos que UM body de bebê de marca, você investiria?", "answerFormat": "single_choice", "options": ["Sim, sem pensar duas vezes!", "Provavelmente sim", "Precisaria ver mais detalhes", "Não invisto em conteúdo digital"], "required": true, "autoAdvance": true, "order": 1}
      ]
    },
    {
      "id": "enx-q15",
      "question_text": "Última pergunta: você quer receber SEU resultado personalizado com as melhores dicas?",
      "answer_format": "single_choice",
      "options": ["Sim! Quero meu resultado agora!", "Sim, me mande por e-mail também", "Quero ver, mas sem compromisso"],
      "order_number": 14,
      "blocks": [
        {"id": "enx-b15-countdown", "type": "countdown", "minutes": 10, "style": "flip", "label": "Oferta especial expira em:", "urgencyText": "Vagas limitadas para o Guia do Enxoval Inteligente", "order": 0},
        {"id": "enx-b15-q", "type": "question", "questionText": "Última pergunta: você quer receber SEU resultado personalizado com as melhores dicas?", "answerFormat": "single_choice", "options": ["Sim! Quero meu resultado agora!", "Sim, me mande por e-mail também", "Quero ver, mas sem compromisso"], "required": true, "autoAdvance": true, "order": 1}
      ]
    }
  ],
  "results": [
    {
      "title": "Seu Perfil de Enxoval Inteligente",
      "description": "Parabéns! Descobrimos que você pode economizar até 60% no enxoval do seu bebê seguindo as estratégias certas.",
      "buttonText": "Quero o Guia Completo!",
      "redirectUrl": "",
      "imageUrl": "/templates/enxoval-bebe/mae-feliz-bebe.jpg"
    }
  ]
}'::jsonb,
updated_at = now()
WHERE id = '27784a0e-89c3-4fde-9347-a7f8d094876d';
