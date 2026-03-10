

## Analise Completa dos Erros do Console

Analisei os 3 screenshots e o `index.html`. Todos os erros têm uma causa raiz comum: **a Content Security Policy (CSP) na linha 36 do `index.html` está incompleta**.

---

### Erro 1: Google Fonts bloqueadas (style-src)
**Mensagem**: `Loading the stylesheet 'https://fonts.googleapis.com/css2?family=Poppins...' violates CSP directive: "style-src 'self' 'unsafe-inline'"`

**Causa**: A diretiva `style-src` não inclui `https://fonts.googleapis.com`. As fontes são carregadas nas linhas 17-22 do `index.html` mas a CSP bloqueia.

**Impacto**: **ALTO** — Fontes do app (Poppins, Playfair, Montserrat, etc.) não carregam. O app usa fontes fallback do sistema, degradando a identidade visual.

**Correção**: Adicionar `https://fonts.googleapis.com` ao `style-src`.

---

### Erro 2: Google Fonts bloqueadas (font-src ausente)
**Mensagem**: Implícito — sem diretiva `font-src`, cai no `default-src 'self'`, bloqueando `https://fonts.gstatic.com`.

**Impacto**: **ALTO** — Mesmo problema acima. Os arquivos `.woff2` das fontes são bloqueados.

**Correção**: Adicionar `font-src 'self' https://fonts.gstatic.com`.

---

### Erro 3: Tracking pixels bloqueados (connect-src)
**Mensagem**: `Connecting to 'https://mpc-prod-25-s6uit34pua-wl.a.run.app/events?cee=no...' violates CSP directive: "connect-src 'self'..."`  
E: `Fetch API cannot load https://mpc-prod-25-s6uit34pua-wl.a.run.app/...`  
E: `Fetch API cannot load https://demo-1.conversionsapigateway.com/events?cee=no...`

**Causa**: Estes são requests do **Facebook Pixel** (Conversions API Gateway) e do **Google Ads** (mpc-prod). A CSP `connect-src` não inclui `https://*.a.run.app` nem `https://*.conversionsapigateway.com`.

**Impacto**: **MÉDIO** — Eventos de conversão do Facebook Pixel e Google Ads **não são enviados**. Isso afeta diretamente campanhas de tráfego pago (sem dados de conversão no Meta Ads e Google Ads).

**Correção**: Adicionar `https://*.a.run.app https://*.conversionsapigateway.com` ao `connect-src`.

---

### Erro 4: Google Ads script bloqueado (script-src)
**Mensagem**: `Loading the script 'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/...' violates CSP directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'..."`

**Causa**: O GTM tenta carregar o script de conversão do Google Ads, mas `googleads.g.doubleclick.net` não está no `script-src`. Também bloqueia `connect.facebook.net` sub-scripts.

**Impacto**: **MÉDIO** — Tracking de conversões do Google Ads não funciona. Tags configuradas no GTM que dependem desses scripts falham silenciosamente.

**Correção**: Adicionar `https://*.doubleclick.net https://connect.facebook.net` ao `script-src` (o `connect.facebook.net` já está, mas `doubleclick.net` não).

---

### Erro 5: X-Frame-Options via meta tag
**Mensagem**: `X-Frame-Options may only be set via an HTTP header sent along with a document. It may not be set inside <meta>.`

**Causa**: Linha 38: `<meta http-equiv="X-Frame-Options" content="DENY">`. Este header **não funciona** via meta tag — só funciona como HTTP header real.

**Impacto**: **NENHUM funcional** — É apenas um aviso. A proteção contra clickjacking já está coberta pela CSP `frame-ancestors 'none'`. O meta tag é redundante e inútil.

**Correção**: Remover a linha 38 do `index.html`.

---

### Erro 6: frame-ancestors via meta tag
**Mensagem**: `The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.`

**Causa**: A diretiva `frame-ancestors 'none'` na CSP via meta tag é **ignorada pelo browser**. Só funciona via HTTP header.

**Impacto**: **BAIXO** — A proteção anti-iframe não está ativa. Não afeta funcionalidade, mas é uma falha de segurança menor.

**Correção**: Remover `frame-ancestors 'none'` da meta CSP (já que não funciona aqui). Se necessário, configurar via HTTP headers no hosting.

---

### Erro 7: Unrecognized feature 'attribution-reporting'
**Mensagem**: `Unrecognized feature: 'attribution-reporting'`

**Causa**: O Facebook Pixel ou GTM tenta usar a Attribution Reporting API, que não é suportada por todos os browsers.

**Impacto**: **NENHUM** — Warning informativo. Não afeta funcionalidade.

**Correção**: **Ignorar** — não é controlável pelo app.

---

### Erro 8: WebSocket connection failed
**Mensagem**: `WebSocket connection to 'ws://localhost:8081/' failed`

**Causa**: Hot-reload do Vite em dev. Só aparece no ambiente de desenvolvimento/preview.

**Impacto**: **NENHUM** — Não aparece em produção.

**Correção**: **Ignorar**.

---

### Erro 9: GET 400 Bad Request (validation_requests)
**Mensagem**: `GET ...supabase.co/rest/v1/validation_requests?select=*&Quizzes&title...status=eq.pending&order= 400 (Bad Request)`

**Causa**: Query malformada para a tabela `validation_requests` — parâmetros de URL parecem quebrados (falta `=` ou encoding).

**Impacto**: **BAIXO** — Afeta apenas a lista de validações pendentes no admin. O resto do app funciona.

**Correção**: Investigar o componente que faz essa query e corrigir os parâmetros.

---

### Resumo e Priorização

| # | Erro | Impacto | Ação |
|---|------|---------|------|
| 1-2 | Fontes Google bloqueadas | **ALTO** | Corrigir CSP: `style-src` + `font-src` |
| 3 | Pixel/GA connect bloqueado | **MÉDIO** | Corrigir CSP: `connect-src` |
| 4 | Google Ads script bloqueado | **MÉDIO** | Corrigir CSP: `script-src` |
| 5 | X-Frame-Options meta | **NENHUM** | Remover meta tag |
| 6 | frame-ancestors ignorado | **BAIXO** | Remover da meta CSP |
| 7 | attribution-reporting | **NENHUM** | Ignorar |
| 8 | WebSocket localhost | **NENHUM** | Ignorar |
| 9 | validation_requests 400 | **BAIXO** | Investigar query |

### Plano de Correção

Editar **apenas `index.html` linha 36-38**:

1. **CSP `style-src`**: adicionar `https://fonts.googleapis.com`
2. **CSP nova diretiva `font-src`**: `'self' https://fonts.gstatic.com`
3. **CSP `script-src`**: adicionar `https://*.doubleclick.net https://googleads.g.doubleclick.net`
4. **CSP `connect-src`**: adicionar `https://*.a.run.app https://*.conversionsapigateway.com https://connect.facebook.net`
5. **Remover** `frame-ancestors 'none'` da meta CSP (não funciona via meta)
6. **Remover** a meta tag `X-Frame-Options` (linha 38, não funciona via meta)
7. **Investigar** query de `validation_requests` no componente admin

Isso elimina **8 dos 9 erros** e restaura fontes + tracking de conversões.

