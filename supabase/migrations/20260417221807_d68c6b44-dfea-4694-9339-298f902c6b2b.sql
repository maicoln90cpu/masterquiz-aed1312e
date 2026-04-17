-- Etapa B: atualizar copy estática do hero (Modo A) conforme guia de correções

UPDATE landing_content SET value_pt = 'Crie um quiz que qualifica seus leads antes do checkout', updated_at = now()
WHERE site_mode='A' AND key='hero_headline_main';

UPDATE landing_content SET value_pt = 'Em menos de 10 minutos, sem código', updated_at = now()
WHERE site_mode='A' AND key='hero_headline_sub';

UPDATE landing_content SET value_pt = 'Seu lead responde, se identifica com o problema e chega ao checkout já convencido — sem você precisar empurrar oferta.', updated_at = now()
WHERE site_mode='A' AND key='hero_subheadline';

UPDATE landing_content SET value_pt = 'Faça o lead se autoqualificar enquanto responde', updated_at = now()
WHERE site_mode='A' AND key='hero_bullet_1';

UPDATE landing_content SET value_pt = 'Direcione cada perfil diretamente para a oferta certa', updated_at = now()
WHERE site_mode='A' AND key='hero_bullet_2';

UPDATE landing_content SET value_pt = 'Veja quem está pronto para comprar — e quem precisa de mais aquecimento', updated_at = now()
WHERE site_mode='A' AND key='hero_bullet_3';

UPDATE landing_content SET value_pt = 'IA cria seu quiz completo em segundos', updated_at = now()
WHERE site_mode='A' AND key='hero_bullet_4';

UPDATE landing_content SET value_pt = 'O único quiz marketing com plano gratuito real no Brasil', updated_at = now()
WHERE site_mode='A' AND key='hero_bullet_5';