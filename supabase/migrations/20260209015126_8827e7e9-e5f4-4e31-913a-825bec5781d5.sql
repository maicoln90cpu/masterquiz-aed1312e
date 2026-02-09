
-- 1) Atualizar imagens do template emagrecimento
UPDATE quiz_templates 
SET full_config = jsonb_set(
  jsonb_set(
    full_config,
    '{questions,3,blocks,0,url}',
    '"/templates/emagrecimento/questao1.jpg"'
  ),
  '{questions,11,blocks,0,url}',
  '"/templates/emagrecimento/questao9.jpg"'
)
WHERE id = '000d6969-ee9f-4175-b627-860d23b380f7';

-- 2) Inserir novo template Enxoval de Bebe Inteligente
INSERT INTO quiz_templates (
  name, description, category, icon, is_active, is_premium, display_order,
  preview_config, full_config
) VALUES (
  'Enxoval de Bebê Inteligente',
  'Quiz de 15 perguntas para mães que querem economizar no enxoval do bebê. Funil completo com espelhamento, amplificação de dor, comparações e CTA de produto.',
  'lead_qualification',
  '👶',
  true,
  false,
  20,
  '{"title":"Enxoval de Bebê Inteligente","description":"Descubra como montar o enxoval perfeito gastando até 60% menos!","questionCount":15,"template":"moderno"}'::jsonb,
  '{
    "title": "Enxoval de Bebê Inteligente",
    "description": "Descubra como montar o enxoval perfeito gastando até 60% menos!",
    "template": "moderno",
    "showTitle": true,
    "showDescription": true,
    "showQuestionNumber": true,
    "formConfig": {
      "collectName": true,
      "collectEmail": true,
      "collectWhatsapp": true,
      "collectionTiming": "after"
    },
    "questions": [
      {
        "questionText": "Qual é a sua faixa etária?",
        "answerFormat": "single_choice",
        "orderNumber": 0,
        "blocks": [],
        "options": [
          {"text": "Menos de 20 anos", "score": 1},
          {"text": "20 a 25 anos", "score": 2},
          {"text": "26 a 30 anos", "score": 3},
          {"text": "31 a 35 anos", "score": 4},
          {"text": "Acima de 35 anos", "score": 5}
        ]
      },
      {
        "questionText": "Você está grávida ou já é mãe?",
        "answerFormat": "single_choice",
        "orderNumber": 1,
        "blocks": [],
        "options": [
          {"text": "Estou grávida do primeiro filho", "score": 1},
          {"text": "Estou grávida (já tenho filhos)", "score": 2},
          {"text": "Já sou mãe e estou planejando outro bebê", "score": 3},
          {"text": "Estou planejando engravidar em breve", "score": 4}
        ]
      },
      {
        "questionText": "Como está sua situação financeira atual?",
        "answerFormat": "single_choice",
        "orderNumber": 2,
        "blocks": [],
        "options": [
          {"text": "Muito apertada - cada real conta", "score": 1},
          {"text": "Consigo pagar as contas mas sem folga", "score": 2},
          {"text": "Razoável - posso investir com planejamento", "score": 3},
          {"text": "Tranquila - mas quero gastar com inteligência", "score": 4}
        ]
      },
      {
        "questionText": "Quanto você imagina gastar no enxoval completo?",
        "answerFormat": "single_choice",
        "orderNumber": 3,
        "blocks": [
          {
            "id": "enx-img-quarto",
            "type": "image",
            "url": "/templates/enxoval-bebe/quarto-bebe.jpg",
            "alt": "Quarto de bebê decorado",
            "width": "100%"
          },
          {
            "id": "enx-slider-orcamento",
            "type": "slider",
            "label": "Qual seu orçamento estimado para o enxoval?",
            "min": 500,
            "max": 10000,
            "step": 100,
            "defaultValue": 3000,
            "unit": "R$",
            "showValue": true,
            "required": true
          }
        ],
        "options": [
          {"text": "Menos de R$ 1.000", "score": 1},
          {"text": "R$ 1.000 a R$ 3.000", "score": 2},
          {"text": "R$ 3.000 a R$ 5.000", "score": 3},
          {"text": "Mais de R$ 5.000", "score": 4}
        ]
      },
      {
        "questionText": "O que mais te preocupa sobre montar o enxoval?",
        "answerFormat": "single_choice",
        "orderNumber": 4,
        "blocks": [
          {
            "id": "enx-sep-preocupacao",
            "type": "separator",
            "style": "gradient",
            "label": "💡 Vamos entender suas preocupações"
          },
          {
            "id": "enx-social-preocupacao",
            "type": "socialProof",
            "text": "87% das mães relatam gastar mais do que planejaram no enxoval",
            "author": "Pesquisa MaeBaby 2025",
            "rating": 5,
            "style": "toast"
          }
        ],
        "options": [
          {"text": "Gastar demais com coisas desnecessárias", "score": 4},
          {"text": "Não saber o que realmente é essencial", "score": 3},
          {"text": "Pressão de familiares e amigas para comprar tudo", "score": 2},
          {"text": "Medo de faltar algo importante para o bebê", "score": 1}
        ]
      },
      {
        "questionText": "Você já se sentiu pressionada a comprar itens caros para o bebê?",
        "answerFormat": "single_choice",
        "orderNumber": 5,
        "blocks": [
          {
            "id": "enx-img-pressao",
            "type": "image",
            "url": "/templates/enxoval-bebe/mae-preocupada-contas.jpg",
            "alt": "Mãe preocupada com contas",
            "width": "100%"
          }
        ],
        "options": [
          {"text": "Sim, sempre! Parece que tudo de bebê é absurdamente caro", "score": 4},
          {"text": "Às vezes, principalmente por influência de redes sociais", "score": 3},
          {"text": "Um pouco, mas tento manter o foco no essencial", "score": 2},
          {"text": "Não, sou bem decidida nas minhas escolhas", "score": 1}
        ]
      },
      {
        "questionText": "Quantos itens do enxoval você realmente acha que vai precisar?",
        "answerFormat": "single_choice",
        "orderNumber": 6,
        "blocks": [
          {
            "id": "enx-comp-lista",
            "type": "comparison",
            "leftTitle": "📋 Lista do Marketing",
            "leftItems": ["Carrinho importado R$ 3.000+", "Berço multifuncional R$ 2.500", "50 bodies de todas as marcas", "Babá eletrônica 4K", "Kit enxoval de grife completo"],
            "rightTitle": "✅ Lista Real (o que funciona)",
            "rightItems": ["Carrinho simples e seguro R$ 500", "Berço padrão certificado R$ 800", "15 bodies de algodão", "Monitor simples R$ 150", "Kit essencial bem escolhido"],
            "style": "versus"
          }
        ],
        "options": [
          {"text": "Mais de 100 itens - preciso de tudo!", "score": 1},
          {"text": "Entre 50 e 100 itens", "score": 2},
          {"text": "Entre 20 e 50 itens essenciais", "score": 3},
          {"text": "Menos de 20 - só o necessário", "score": 4}
        ]
      },
      {
        "questionText": "Você sabia que 40% dos itens de enxoval nunca são usados?",
        "answerFormat": "single_choice",
        "orderNumber": 7,
        "blocks": [
          {
            "id": "enx-gallery-1",
            "type": "gallery",
            "layout": "grid",
            "images": [
              {"url": "/templates/enxoval-bebe/itens-desperdicados.jpg", "alt": "Itens de bebê desperdiçados", "caption": "40% dos itens nunca são usados"},
              {"url": "/templates/enxoval-bebe/bebe-feliz-essencial.jpg", "alt": "Bebê feliz com poucos brinquedos", "caption": "Menos é mais para o bebê"},
              {"url": "/templates/enxoval-bebe/organizacao-inteligente.jpg", "alt": "Organização inteligente", "caption": "Enxoval inteligente e organizado"}
            ]
          }
        ],
        "options": [
          {"text": "Não sabia! Isso me surpreende muito", "score": 4},
          {"text": "Já desconfiava, mas não sabia o número exato", "score": 3},
          {"text": "Sim, por isso quero ser mais inteligente nas compras", "score": 2},
          {"text": "Já aconteceu comigo em outras situações", "score": 1}
        ]
      },
      {
        "questionText": "Qual é o seu maior medo como mãe?",
        "answerFormat": "single_choice",
        "orderNumber": 8,
        "blocks": [
          {
            "id": "enx-img-medo",
            "type": "image",
            "url": "/templates/enxoval-bebe/mae-abraco-bebe.jpg",
            "alt": "Mãe cuidando do bebê com amor",
            "width": "100%"
          }
        ],
        "options": [
          {"text": "Não conseguir dar o melhor para meu filho", "score": 4},
          {"text": "Me endividar por causa do bebê", "score": 3},
          {"text": "Ser julgada por não comprar itens de marca", "score": 2},
          {"text": "Não estar preparada quando o bebê chegar", "score": 1}
        ]
      },
      {
        "questionText": "Analisando seu perfil de mãe econômica...",
        "answerFormat": "single_choice",
        "orderNumber": 9,
        "blocks": [
          {
            "id": "enx-loading",
            "type": "loading",
            "text": "Analisando seu perfil de economia...",
            "duration": 4,
            "style": "pulse"
          },
          {
            "id": "enx-progress",
            "type": "progress",
            "label": "Processando suas respostas",
            "value": 85,
            "max": 100,
            "showPercentage": true
          }
        ],
        "options": [
          {"text": "Quero ver meu resultado!", "score": 1},
          {"text": "Estou curiosa para saber quanto posso economizar", "score": 2}
        ]
      },
      {
        "questionText": "Você conhece o Guia do Enxoval Inteligente?",
        "answerFormat": "single_choice",
        "orderNumber": 10,
        "blocks": [
          {
            "id": "enx-img-guia",
            "type": "image",
            "url": "/templates/enxoval-bebe/guia-enxoval.jpg",
            "alt": "Guia do Enxoval Inteligente",
            "width": "100%"
          },
          {
            "id": "enx-text-guia",
            "type": "text",
            "content": "<h3>📖 O Guia que Já Ajudou +5.000 Mães a Economizar</h3><p>Um método passo a passo para montar o enxoval <strong>completo e inteligente</strong>, gastando até <strong>60% menos</strong> do que a média.</p><ul><li>✅ Lista completa do que comprar (e o que NÃO comprar)</li><li>✅ Comparativos de preço entre marcas</li><li>✅ Cronograma mês a mês de compras</li><li>✅ Planilha de controle de gastos inclusa</li></ul>",
            "alignment": "left"
          }
        ],
        "options": [
          {"text": "Não conhecia, mas me interessou!", "score": 4},
          {"text": "Já ouvi falar, quero saber mais", "score": 3},
          {"text": "Interessante, mas preciso de mais informações", "score": 2},
          {"text": "Não estou interessada agora", "score": 1}
        ]
      },
      {
        "questionText": "O que você mais valoriza em um guia de enxoval?",
        "answerFormat": "single_choice",
        "orderNumber": 11,
        "blocks": [
          {
            "id": "enx-comp-valor",
            "type": "comparison",
            "leftTitle": "❌ Comprar Tudo",
            "leftItems": ["Gasta R$ 8.000+ no enxoval", "Compra por impulso e ansiedade", "40% dos itens não são usados", "Estresse financeiro pós-parto", "Arrependimento das compras"],
            "rightTitle": "✅ Comprar Certo",
            "rightItems": ["Investe R$ 3.000 no essencial", "Compra com lista inteligente", "100% dos itens são utilizados", "Tranquilidade financeira", "Orgulho da economia feita"],
            "style": "versus"
          }
        ],
        "options": [
          {"text": "Lista prática do que realmente preciso", "score": 4},
          {"text": "Comparações de preço entre marcas", "score": 3},
          {"text": "Dicas de onde comprar mais barato", "score": 2},
          {"text": "Cronograma de quando comprar cada item", "score": 1}
        ]
      },
      {
        "questionText": "Quanto você já gastou (ou acha que vai gastar) com compras desnecessárias para o bebê?",
        "answerFormat": "single_choice",
        "orderNumber": 12,
        "blocks": [
          {
            "id": "enx-slider-gasto",
            "type": "slider",
            "label": "Estime quanto já desperdiçou ou vai desperdiçar",
            "min": 0,
            "max": 3000,
            "step": 50,
            "defaultValue": 500,
            "unit": "R$",
            "showValue": true,
            "required": true
          },
          {
            "id": "enx-text-impacto",
            "type": "text",
            "content": "<p style=\"text-align:center\">💰 <strong>Com esse valor você poderia pagar a poupança do seu filho por 1 ano inteiro!</strong></p><p style=\"text-align:center\">Não deixe dinheiro ir para o lixo. Invista com inteligência.</p>",
            "alignment": "center"
          }
        ],
        "options": [
          {"text": "Provavelmente muito mais do que imagino", "score": 4},
          {"text": "Já estou tentando evitar, mas é difícil", "score": 3},
          {"text": "Pouco, sou bem controlada", "score": 2},
          {"text": "Nada, planejo tudo com antecedência", "score": 1}
        ]
      },
      {
        "questionText": "Você está pronta para economizar de verdade no enxoval?",
        "answerFormat": "single_choice",
        "orderNumber": 13,
        "blocks": [
          {
            "id": "enx-btn-motivacao",
            "type": "button",
            "text": "💪 SIM! Quero Economizar Agora!",
            "style": "primary",
            "size": "large"
          },
          {
            "id": "enx-social-pronta",
            "type": "socialProof",
            "text": "Mais de 5.000 mães já economizaram em média R$ 4.200 no enxoval com este método",
            "author": "Dados internos 2025",
            "rating": 5,
            "style": "card"
          }
        ],
        "options": [
          {"text": "Sim! Estou 100% decidida a economizar", "score": 4},
          {"text": "Sim, mas quero ver os detalhes primeiro", "score": 3},
          {"text": "Talvez, preciso pensar mais", "score": 2},
          {"text": "Ainda não tenho certeza", "score": 1}
        ]
      },
      {
        "questionText": "Oferta especial: últimas vagas com desconto!",
        "answerFormat": "single_choice",
        "orderNumber": 14,
        "blocks": [
          {
            "id": "enx-countdown",
            "type": "countdown",
            "minutes": 10,
            "label": "⏰ Esta oferta expira em:",
            "style": "urgent"
          },
          {
            "id": "enx-img-final",
            "type": "image",
            "url": "/templates/enxoval-bebe/mae-feliz-bebe.jpg",
            "alt": "Mãe feliz com bebê no quarto organizado",
            "width": "100%"
          },
          {
            "id": "enx-text-urgencia",
            "type": "text",
            "content": "<h3 style=\"text-align:center\">🎉 Parabéns por chegar até aqui!</h3><p style=\"text-align:center\">Você demonstrou que é uma mãe <strong>inteligente e decidida</strong>. O Guia do Enxoval Inteligente está com <strong>50% de desconto</strong> exclusivo para quem completou este quiz.</p><p style=\"text-align:center\"><strong>De R$ 197 por apenas R$ 97</strong></p>",
            "alignment": "center"
          }
        ],
        "options": [
          {"text": "Quero aproveitar o desconto agora!", "score": 4},
          {"text": "Me interessou, vou considerar", "score": 3},
          {"text": "Preciso falar com meu parceiro primeiro", "score": 2},
          {"text": "Vou pensar mais tarde", "score": 1}
        ]
      }
    ],
    "results": [
      {
        "resultText": "<h2>🎉 Parabéns! Você está pronta para montar o enxoval perfeito gastando até 60% menos!</h2><p>Baseado nas suas respostas, identificamos que você tem um grande potencial de economia. Com o <strong>Guia do Enxoval Inteligente</strong>, você pode economizar entre R$ 3.000 e R$ 5.000 no enxoval do seu bebê.</p><h3>O que você vai receber:</h3><ul><li>📋 Lista completa do enxoval essencial (sem desperdício)</li><li>💰 Comparativos de preço entre as melhores marcas</li><li>📅 Cronograma mês a mês de compras</li><li>📊 Planilha de controle de gastos</li><li>🎁 Bônus: Guia de chá de bebê econômico</li></ul>",
        "buttonText": "Quero Economizar Agora →",
        "redirectUrl": "",
        "conditionType": "always",
        "orderNumber": 0
      }
    ]
  }'::jsonb
);
