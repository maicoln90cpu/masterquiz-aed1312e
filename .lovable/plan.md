

## Mudança de abordagem: Export CSV para Google Analytics 4 (Event Import)

### Contexto
O Google Ads Offline Import estava rejeitando o CSV. A nova abordagem é importar eventos diretamente no GA4, que já alimenta o Google Ads.

### Formato do CSV (GA4 Event Import)

Colunas necessárias (mínimas):
```text
measurement_id | client_id | user_id | event_name | timestamp_micros
```

- **measurement_id**: `G-H8NWKZ5NZJ` (fixo)
- **client_id**: obrigatório pelo GA4 — como não armazenamos o cookie `_ga`, vamos gerar um client_id sintético por usuário (hash numérico do user.id no formato `XXXXXXXXXX.YYYYYYYYYY`)
- **user_id**: ID do Supabase (permite associação futura se o GA4 receber o mesmo user_id via GTM)
- **event_name**: `AccountCreated` (conforme configurado no GTM)
- **timestamp_micros**: `created_at` convertido para microssegundos Unix

### Ponto de atenção: client_id sintético
Não temos o `_ga` cookie desses usuários no banco. O GA4 exige `client_id`. Ao usar um ID sintético, o GA4 tratará cada evento como uma sessão/dispositivo novo — **não** vai associar ao histórico de navegação real do usuário. Porém, a conversão `AccountCreated` será registrada e ficará disponível no Google Ads como evento importado.

**Sugestão futura**: capturar o `_ga` cookie no momento do signup e salvar em `profiles` para imports retroativos mais precisos.

### Alteração (arquivo único: `src/pages/AdminDashboard.tsx`)

Reescrever `exportMissingAccountCreatedCSV`:

```csv
measurement_id,client_id,user_id,event_name,timestamp_micros
G-H8NWKZ5NZJ,1000000001.1000000001,uuid-do-usuario,AccountCreated,1609488000000000
G-H8NWKZ5NZJ,1000000002.1000000002,uuid-do-usuario-2,AccountCreated,1609574400000000
```

- Sem BOM, sem instruções — o GA4 espera CSV limpo
- `timestamp_micros` = `new Date(created_at).getTime() * 1000` (millis → micros)
- Client ID gerado: hash simples do UUID → dois blocos de 10 dígitos separados por ponto
- Nome do download: `ga4_account_created_import_YYYY-MM-DD.csv`

