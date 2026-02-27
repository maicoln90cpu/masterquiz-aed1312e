

## Correção do CSV para Google Ads Offline Import

### Problema
O CSV gerado não segue o template oficial do Google Ads. Faltam:
- Bloco de instruções obrigatório no topo
- Linha `Parameters:TimeZone=America/Sao_Paulo` (timezone declarado aqui, NÃO no valor da coluna)
- Colunas `Ad User Data` e `Ad Personalization` (obrigatórias no template)
- Coluna `Email` não existe no template — não é usada nesse formato

### Correção (arquivo único: `src/pages/AdminDashboard.tsx`)

Reescrever a função `exportMissingAccountCreatedCSV` para gerar o CSV exatamente conforme o template Google:

```csv
### INSTRUCTIONS ###,,,,,,
# IMPORTANT: Remember to set the TimeZone value in the "parameters" row and/or in your Conversion Time column,,,,,,
# For instructions on how to set your timezones visit http://goo.gl/T1C5Ov,,,,,,
,,,,,,
### TEMPLATE ###,,,,,,
Parameters:TimeZone=America/Sao_Paulo,,,,,,
Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency,Ad User Data,Ad Personalization
,account_created,2026-02-25 16:13:22,0,BRL,,
```

Mudanças:
- Adicionar header de instruções + `Parameters:TimeZone=America/Sao_Paulo`
- Remover `-03:00` do timestamp (timezone já está no Parameters)
- Substituir coluna `Email` por `Ad User Data` e `Ad Personalization` (vazios)
- Formato do tempo: `YYYY-MM-DD HH:MM:SS` sem offset

---

### Fases restantes do Blog (referência para próxima implementação)

| Fase | Descrição |
|------|-----------|
| 3 | Admin Blog Manager — CRUD de posts, editor Rich Text, configurações |
| 4 | Edge Function `generate-blog-post` — geração IA (Gemini) com SEO |
| 5 | Geração de imagem destaque (IA ou placeholder) |
| 6 | Cron automático `blog-cron` para publicação agendada |
| 7 | Sitemap XML dinâmico + RSS |

