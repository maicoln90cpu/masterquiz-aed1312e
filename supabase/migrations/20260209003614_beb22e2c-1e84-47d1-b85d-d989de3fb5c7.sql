
INSERT INTO public.quiz_templates (
  name, description, category, icon, is_premium, is_active, display_order,
  preview_config, full_config
) VALUES (
  'Emagrecimento - Auto-Convencimento',
  'Quiz de 14 perguntas com metodologia de auto-convencimento para público sedentário. Funil psicológico completo: identificação → dor → tentativas → solução → urgência. Inclui blocos visuais, sliders, comparações, prova social e countdown.',
  'lead_qualification',
  '🏋️',
  false,
  true,
  7,
  '{"title":"Descubra por que você não consegue emagrecer","description":"Responda 14 perguntas rápidas e descubra o método que já ajudou milhares de pessoas sedentárias a perder peso de forma definitiva.","questionCount":14,"template":"moderno"}'::jsonb,
  '{
    "title": "Descubra por que você não consegue emagrecer",
    "description": "Responda 14 perguntas rápidas e descubra o método que já ajudou milhares de pessoas sedentárias a perder peso de forma definitiva.",
    "template": "moderno",
    "questionCount": 14,
    "formConfig": {
      "collect_name": true,
      "collect_email": true,
      "collect_whatsapp": true,
      "collection_timing": "after"
    },
    "questions": [
      {
        "id": "emag-q1",
        "question_text": "Há quanto tempo você tenta perder peso?",
        "answer_format": "single_choice",
        "options": ["Menos de 6 meses", "De 6 meses a 1 ano", "De 1 a 3 anos", "Mais de 3 anos", "A vida inteira"],
        "order_number": 0,
        "blocks": [
          {"id":"emag-b1-img","type":"image","order":0,"url":"https://images.unsplash.com/photo-1611077544695-41be4c0c1384?w=800","alt":"Pessoa na balança frustrada","caption":"Você se identifica com essa sensação?","size":"large"},
          {"id":"emag-b1-txt","type":"text","order":1,"content":"<p><strong>Seja honesto(a) consigo mesmo(a).</strong> A primeira etapa para mudar é reconhecer onde você está.</p>","alignment":"center","fontSize":"medium"},
          {"id":"emag-b1-prog","type":"progress","order":2,"style":"bar","showPercentage":true,"showCounter":true,"color":"#10b981","height":"medium","animated":true},
          {"id":"emag-b1-q","type":"question","order":3,"questionText":"Há quanto tempo você tenta perder peso?","answerFormat":"single_choice","options":["Menos de 6 meses","De 6 meses a 1 ano","De 1 a 3 anos","Mais de 3 anos","A vida inteira"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q2",
        "question_text": "Quantos quilos você gostaria de perder?",
        "answer_format": "single_choice",
        "options": ["5-10 kg", "10-20 kg", "20-30 kg", "Mais de 30 kg"],
        "order_number": 1,
        "blocks": [
          {"id":"emag-b2-slider","type":"slider","order":0,"label":"Arraste para indicar quantos quilos você quer perder:","min":5,"max":50,"step":5,"defaultValue":15,"unit":"kg","showValue":true,"required":true},
          {"id":"emag-b2-q","type":"question","order":1,"questionText":"Quantos quilos você gostaria de perder?","answerFormat":"single_choice","options":["5-10 kg","10-20 kg","20-30 kg","Mais de 30 kg"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q3",
        "question_text": "Qual é sua principal dificuldade para emagrecer?",
        "answer_format": "single_choice",
        "options": ["Comer à noite / compulsão alimentar", "Falta de tempo para exercícios", "Ansiedade e estresse", "Metabolismo lento", "Falta de disciplina"],
        "order_number": 2,
        "blocks": [
          {"id":"emag-b3-img","type":"image","order":0,"url":"https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800","alt":"Geladeira à noite","caption":"Quantas vezes você já se pegou nessa situação?","size":"large"},
          {"id":"emag-b3-sep","type":"separator","order":1,"style":"dots","thickness":"thin"},
          {"id":"emag-b3-q","type":"question","order":2,"questionText":"Qual é sua principal dificuldade para emagrecer?","answerFormat":"single_choice","options":["Comer à noite / compulsão alimentar","Falta de tempo para exercícios","Ansiedade e estresse","Metabolismo lento","Falta de disciplina"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q4",
        "question_text": "O que o sedentarismo já causou na sua vida?",
        "answer_format": "multiple_choice",
        "options": ["Dores nas costas e articulações", "Cansaço constante", "Problemas de autoestima", "Dificuldade para dormir", "Problemas de saúde (pressão, diabetes, etc.)"],
        "order_number": 3,
        "blocks": [
          {"id":"emag-b4-comp","type":"comparison","order":0,"leftTitle":"Vida Sedentária","rightTitle":"Vida Ativa","leftItems":["Cansaço crônico","Dores no corpo","Autoestima baixa","Roupas apertadas","Noites mal dormidas"],"rightItems":["Energia o dia todo","Corpo sem dores","Confiança elevada","Roupas que caem bem","Sono reparador"],"leftStyle":"negative","rightStyle":"positive","showIcons":true},
          {"id":"emag-b4-q","type":"question","order":1,"questionText":"O que o sedentarismo já causou na sua vida?","answerFormat":"multiple_choice","options":["Dores nas costas e articulações","Cansaço constante","Problemas de autoestima","Dificuldade para dormir","Problemas de saúde (pressão, diabetes, etc.)"],"required":true}
        ]
      },
      {
        "id": "emag-q5",
        "question_text": "Você se sente cansado(a) mesmo dormindo bastante?",
        "answer_format": "single_choice",
        "options": ["Sim, todos os dias", "Sim, na maioria dos dias", "Às vezes", "Raramente", "Nunca"],
        "order_number": 4,
        "blocks": [
          {"id":"emag-b5-gal","type":"gallery","order":0,"images":[{"url":"https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600","alt":"Pessoa exausta no sofá","caption":"Fadiga constante"},{"url":"https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600","alt":"Pessoa acordada de madrugada","caption":"Insônia frequente"},{"url":"https://images.unsplash.com/photo-1508963493744-76fce69379c0?w=600","alt":"Pessoa estressada","caption":"Estresse acumulado"}],"layout":"grid"},
          {"id":"emag-b5-q","type":"question","order":1,"questionText":"Você se sente cansado(a) mesmo dormindo bastante?","answerFormat":"single_choice","options":["Sim, todos os dias","Sim, na maioria dos dias","Às vezes","Raramente","Nunca"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q6",
        "question_text": "Algum médico já alertou você sobre seu peso?",
        "answer_format": "single_choice",
        "options": ["Sim, mais de uma vez", "Sim, uma vez", "Não, mas eu sei que preciso mudar", "Não, estou saudável"],
        "order_number": 5,
        "blocks": [
          {"id":"emag-b6-sp","type":"socialProof","order":0,"notifications":[{"name":"Maria S.","action":"perdeu 12kg em 8 semanas","time":"há 2 horas"},{"name":"Carlos R.","action":"eliminou 18kg seguindo o método","time":"há 5 horas"},{"name":"Ana P.","action":"saiu do sedentarismo e perdeu 9kg","time":"há 1 dia"},{"name":"João M.","action":"perdeu 15kg sem academia","time":"há 3 horas"},{"name":"Fernanda L.","action":"eliminou 22kg e mudou de vida","time":"há 6 horas"}],"interval":4,"style":"toast","position":"bottom-right","showAvatar":false},
          {"id":"emag-b6-q","type":"question","order":1,"questionText":"Algum médico já alertou você sobre seu peso?","answerFormat":"single_choice","options":["Sim, mais de uma vez","Sim, uma vez","Não, mas eu sei que preciso mudar","Não, estou saudável"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q7",
        "question_text": "Quantas dietas você já tentou na vida?",
        "answer_format": "single_choice",
        "options": ["Nenhuma", "1 a 2", "3 a 5", "6 a 10", "Perdi a conta"],
        "order_number": 6,
        "blocks": [
          {"id":"emag-b7-img","type":"image","order":0,"url":"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800","alt":"Transformação antes e depois","caption":"Resultado real de quem seguiu o método","size":"large"},
          {"id":"emag-b7-sep","type":"separator","order":1,"style":"line","thickness":"medium"},
          {"id":"emag-b7-q","type":"question","order":2,"questionText":"Quantas dietas você já tentou na vida?","answerFormat":"single_choice","options":["Nenhuma","1 a 2","3 a 5","6 a 10","Perdi a conta"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q8",
        "question_text": "Por que as dietas anteriores falharam?",
        "answer_format": "multiple_choice",
        "options": ["Muito restritivas", "Efeito sanfona", "Falta de acompanhamento", "Não se adaptaram à minha rotina", "Resultados muito lentos"],
        "order_number": 7,
        "blocks": [
          {"id":"emag-b8-load","type":"loading","order":0,"duration":4,"message":"⏳ Analisando seu perfil com base nas respostas anteriores...","completionMessage":"✅ Perfil analisado! Veja a próxima pergunta.","spinnerType":"dots","autoAdvance":false},
          {"id":"emag-b8-q","type":"question","order":1,"questionText":"Por que as dietas anteriores falharam?","answerFormat":"multiple_choice","options":["Muito restritivas","Efeito sanfona","Falta de acompanhamento","Não se adaptaram à minha rotina","Resultados muito lentos"],"required":true}
        ]
      },
      {
        "id": "emag-q9",
        "question_text": "Você já ouviu falar do Método [Nome do Produto]?",
        "answer_format": "single_choice",
        "options": ["Sim, já conheço", "Já ouvi falar mas não conheço bem", "Nunca ouvi falar", "Não, me conte mais"],
        "order_number": 8,
        "blocks": [
          {"id":"emag-b9-img","type":"image","order":0,"url":"https://images.unsplash.com/photo-1505576399279-0d00fcbd7b73?w=800","alt":"Método de emagrecimento","caption":"O método que está revolucionando o emagrecimento para sedentários","size":"large"},
          {"id":"emag-b9-txt","type":"text","order":1,"content":"<p>Este método foi desenvolvido especificamente para <strong>pessoas sedentárias</strong> que já tentaram de tudo e não conseguiram resultados duradouros.</p><p>✅ Sem exercícios intensos<br/>✅ Sem dietas restritivas<br/>✅ Sem efeito sanfona<br/>✅ Resultados em até 30 dias</p>","alignment":"center","fontSize":"medium"},
          {"id":"emag-b9-q","type":"question","order":2,"questionText":"Você já ouviu falar do Método [Nome do Produto]?","answerFormat":"single_choice","options":["Sim, já conheço","Já ouvi falar mas não conheço bem","Nunca ouvi falar","Não, me conte mais"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q10",
        "question_text": "O que você mais deseja conquistar?",
        "answer_format": "multiple_choice",
        "options": ["Corpo saudável e bonito", "Mais energia e disposição", "Autoestima e confiança", "Vestir as roupas que quero", "Saúde e longevidade"],
        "order_number": 9,
        "blocks": [
          {"id":"emag-b10-gal","type":"gallery","order":0,"images":[{"url":"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600","alt":"Pessoa correndo com energia","caption":"Energia e disposição"},{"url":"https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=600","alt":"Pessoa feliz na balança","caption":"Resultados que motivam"},{"url":"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600","alt":"Pessoa confiante","caption":"Autoconfiança renovada"}],"layout":"grid"},
          {"id":"emag-b10-q","type":"question","order":1,"questionText":"O que você mais deseja conquistar?","answerFormat":"multiple_choice","options":["Corpo saudável e bonito","Mais energia e disposição","Autoestima e confiança","Vestir as roupas que quero","Saúde e longevidade"],"required":true}
        ]
      },
      {
        "id": "emag-q11",
        "question_text": "Se houvesse um método comprovado e acessível, você investiria em você?",
        "answer_format": "single_choice",
        "options": ["Com certeza, estou decidido(a)!", "Sim, se o preço for justo", "Talvez, preciso pensar", "Não sei"],
        "order_number": 10,
        "blocks": [
          {"id":"emag-b11-comp","type":"comparison","order":0,"leftTitle":"Sem o Método","rightTitle":"Com o Método","leftItems":["Continuar tentando sozinho(a)","Gastar com dietas que não funcionam","Frustração e efeito sanfona","Saúde piorando com o tempo","Autoestima cada vez menor"],"rightItems":["Acompanhamento passo a passo","Investimento único com resultado","Emagrecimento definitivo","Saúde transformada","Confiança e bem-estar"],"leftStyle":"negative","rightStyle":"positive","showIcons":true},
          {"id":"emag-b11-q","type":"question","order":1,"questionText":"Se houvesse um método comprovado e acessível, você investiria em você?","answerFormat":"single_choice","options":["Com certeza, estou decidido(a)!","Sim, se o preço for justo","Talvez, preciso pensar","Não sei"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q12",
        "question_text": "Quanto você já gastou com dietas, remédios e tentativas que não funcionaram?",
        "answer_format": "single_choice",
        "options": ["Menos de R$500", "R$500 a R$1.000", "R$1.000 a R$3.000", "Mais de R$3.000"],
        "order_number": 11,
        "blocks": [
          {"id":"emag-b12-slider","type":"slider","order":0,"label":"Arraste para estimar quanto já gastou com dietas sem resultado:","min":0,"max":5000,"step":100,"defaultValue":1000,"unit":"R$","showValue":true,"required":true},
          {"id":"emag-b12-txt","type":"text","order":1,"content":"<p style=\"text-align:center\"><strong>💸 A maioria das pessoas gasta mais de R$2.000</strong> em soluções que não funcionam antes de encontrar o método certo.</p><p style=\"text-align:center\">E se você pudesse investir <strong>uma fração disso</strong> em algo que realmente funciona?</p>","alignment":"center","fontSize":"medium"},
          {"id":"emag-b12-q","type":"question","order":2,"questionText":"Quanto você já gastou com dietas, remédios e tentativas que não funcionaram?","answerFormat":"single_choice","options":["Menos de R$500","R$500 a R$1.000","R$1.000 a R$3.000","Mais de R$3.000"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q13",
        "question_text": "Você está pronto(a) para mudar de vida AGORA?",
        "answer_format": "single_choice",
        "options": ["SIM! Estou 100% decidido(a)!", "Sim, quero tentar", "Preciso de mais informações", "Ainda não tenho certeza"],
        "order_number": 12,
        "blocks": [
          {"id":"emag-b13-btn","type":"button","order":0,"text":"💪 EU QUERO MUDAR MINHA VIDA!","action":"next_question","variant":"default","size":"lg"},
          {"id":"emag-b13-sp","type":"socialProof","order":1,"notifications":[{"name":"Patrícia M.","action":"acabou de garantir sua vaga","time":"agora"},{"name":"Roberto S.","action":"perdeu 20kg e recomenda","time":"há 10 min"},{"name":"Lucia F.","action":"começou hoje e já sente diferença","time":"há 30 min"},{"name":"Diego A.","action":"garantiu com desconto especial","time":"há 1 hora"},{"name":"Sandra K.","action":"emagreceu 14kg em 6 semanas","time":"há 2 horas"}],"interval":3,"style":"floating","position":"bottom-left","showAvatar":false},
          {"id":"emag-b13-q","type":"question","order":2,"questionText":"Você está pronto(a) para mudar de vida AGORA?","answerFormat":"single_choice","options":["SIM! Estou 100% decidido(a)!","Sim, quero tentar","Preciso de mais informações","Ainda não tenho certeza"],"required":true,"autoAdvance":true}
        ]
      },
      {
        "id": "emag-q14",
        "question_text": "Última chance: garantia de resultado ou arrependimento?",
        "answer_format": "single_choice",
        "options": ["Quero garantir minha vaga AGORA!", "Vou pensar mais um pouco"],
        "order_number": 13,
        "blocks": [
          {"id":"emag-b14-cd","type":"countdown","order":0,"mode":"duration","duration":600,"showDays":false,"showHours":false,"showMinutes":true,"showSeconds":true,"style":"bold","expiryMessage":"⏰ Promoção encerrada! O desconto não está mais disponível.","expiryAction":"none","primaryColor":"#ef4444","secondaryColor":"#fef2f2"},
          {"id":"emag-b14-img","type":"image","order":1,"url":"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800","alt":"Transformação e liberdade","caption":"Imagine você assim em poucas semanas...","size":"large"},
          {"id":"emag-b14-txt","type":"text","order":2,"content":"<p style=\"text-align:center\"><strong>⚠️ ATENÇÃO:</strong> Esta promoção com <strong>desconto especial</strong> expira quando o contador acima chegar a zero.</p><p style=\"text-align:center\">Depois disso, o preço volta ao normal e <strong>não haverá segunda chance</strong>.</p><p style=\"text-align:center\">🔒 <strong>Garantia incondicional de 7 dias.</strong> Se não gostar, devolvemos 100% do seu dinheiro.</p>","alignment":"center","fontSize":"large"},
          {"id":"emag-b14-q","type":"question","order":3,"questionText":"Última chance: garantia de resultado ou arrependimento?","answerFormat":"single_choice","options":["Quero garantir minha vaga AGORA!","Vou pensar mais um pouco"],"required":true,"autoAdvance":true}
        ]
      }
    ],
    "results": [
      {
        "result_text": "<h2>🎉 Parabéns! Seu perfil foi analisado!</h2><p>Com base nas suas respostas, você é um(a) <strong>candidato(a) ideal</strong> para o Método [Nome do Produto].</p><p>Pessoas com o seu perfil têm <strong>94% de chance de sucesso</strong> quando seguem o método corretamente.</p><p>⚡ <strong>Vagas limitadas</strong> — garanta a sua agora com desconto exclusivo!</p><p>🔒 Garantia incondicional de 7 dias. Risco zero para você.</p>",
        "button_text": "🚀 Garantir Minha Vaga com Desconto",
        "redirect_url": "https://exemplo.com/checkout",
        "condition_type": "always",
        "order_number": 0
      }
    ]
  }'::jsonb
);
