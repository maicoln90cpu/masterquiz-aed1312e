# 📋 ADR — Architecture Decision Records

> Registro de decisões arquiteturais do MasterQuiz
> Versão 2.40 | 14 de Abril de 2026

---

## ADR-001: Thin Router Pattern para Editor de Quiz

**Data:** Janeiro 2026  
**Status:** Aceito  
**Contexto:** O editor de quiz tem duas variantes (Classic e Modern) com hooks pesados. Colocar ambos no mesmo componente causava freeze por hooks duplicados.  
**Decisão:** `CreateQuiz.tsx` é um thin router — zero hooks pesados, apenas `React.lazy` + `Suspense` para carregar a variante escolhida.  
**Alternativas rejeitadas:** (1) Conditional rendering no mesmo arquivo — causava re-renders; (2) Feature flag com import estático — bundle gigante.  
**Consequências:** Bundle splitting eficiente, zero freezes, mas exige que toda lógica fique dentro de cada variante.

---

## ADR-002: Kiwify como Gateway de Pagamento (sem Stripe)

**Data:** Janeiro 2025  
**Status:** Aceito  
**Contexto:** Mercado brasileiro, público de infoprodutores. Stripe exige conta internacional e tem fees maiores para BRL.  
**Decisão:** Usar Kiwify exclusivamente, processando pagamentos via webhook (`kiwify-webhook`).  
**Alternativas rejeitadas:** Stripe (fees altos, complexidade de setup para público BR), Hotmart (API limitada).  
**Consequências:** Simplicidade para o público-alvo, mas lock-in no ecossistema Kiwify.

---

## ADR-003: E-goi Bulk API para Email Marketing

**Data:** Março 2026  
**Status:** Aceito  
**Contexto:** Precisávamos enviar emails em massa (recovery, automações) sem ultrapassar limites de API.  
**Decisão:** E-goi Slingshot API (transacional) com Bulk API em lotes de 100 emails.  
**Alternativas rejeitadas:** SendGrid (caro para volume BR), Amazon SES (setup complexo), Mailgun (sem suporte BR nativo).  
**Consequências:** Custo baixo (R$190/40.533 emails = R$0,00469/email), mas dependência de um provedor menos conhecido.

---

## ADR-004: Evolution API para WhatsApp Recovery

**Data:** Maio 2025  
**Status:** Aceito  
**Contexto:** Recuperação de usuários inativos via WhatsApp é mais efetiva que email no Brasil.  
**Decisão:** Evolution API (self-hosted) para envio de mensagens WhatsApp automatizadas.  
**Alternativas rejeitadas:** WhatsApp Business API oficial (caro, burocrático), Twilio (custo alto por mensagem).  
**Consequências:** Custo zero por mensagem, mas risco de bloqueio por spam e necessidade de manutenção do servidor.

---

## ADR-005: jsPDF Client-Side para Relatórios PDF

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Relatórios de sessão de suporte precisam de PDF com branding.  
**Decisão:** Gerar PDF no client com `jspdf` + `jspdf-autotable` ao invés de Edge Function.  
**Alternativas rejeitadas:** (1) Edge Function com puppeteer — timeout de 60s; (2) html2pdf — qualidade inconsistente.  
**Consequências:** Geração instantânea, sem custo de servidor, mas limitações de layout (sem CSS flexbox).

---

## ADR-006: has_role() SECURITY DEFINER para RLS

**Data:** 2024  
**Status:** Aceito  
**Contexto:** Verificar roles via subquery em RLS policies causa recursão infinita (tabela user_roles também tem RLS).  
**Decisão:** Função `has_role()` com `SECURITY DEFINER` executa com privilégios do owner, bypassando RLS.  
**Alternativas rejeitadas:** (1) Roles em profiles — privilege escalation; (2) Custom claims no JWT — complexo de manter.  
**Consequências:** Zero recursão, performance excelente, mas exige cuidado para não expor a função.

---

## ADR-007: Modo Suporte com Impersonação Frontend

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Admins precisam diagnosticar problemas no contexto do usuário sem acessar sua conta.  
**Decisão:** `SupportModeContext` altera o `user_id` usado nas queries frontend. Dados reais acessados via `admin-view-user-data` (Edge Function com service_role).  
**Alternativas rejeitadas:** (1) Login como usuário — inseguro, viola audit trail; (2) Panel separado — UX ruim, sem contexto real.  
**Consequências:** Audit trail completo, sem troca de credenciais, mas requer cuidado para não salvar dados errados.

---

## ADR-008: 34 Tipos de Blocos no Editor

**Data:** Março 2026  
**Status:** Aceito  
**Contexto:** Quizzes precisam de mais do que perguntas — elementos visuais, dinâmicos e interativos.  
**Decisão:** Sistema extensível de blocos com tipos declarados em `src/types/blocks.ts`, cada um com createBlock, normalizeBlock, e componentes de editor/preview.  
**Alternativas rejeitadas:** (1) Rich text editor genérico (TipTap) — muito genérico para quiz; (2) Plugins externos — difícil de manter.  
**Consequências:** Flexibilidade máxima, mas cada novo bloco exige 5-7 arquivos (tipo, editor, preview, palette, properties).

---

## ADR-009: Notificações via Polling (não Realtime)

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Admin_notifications precisam chegar ao usuário, mas a frequência é baixa (1-2 por sessão de suporte).  
**Decisão:** Polling a cada 60s via `NotificationBell` ao invés de Supabase Realtime.  
**Alternativas rejeitadas:** Supabase Realtime — overhead de conexão WebSocket para notificações raras.  
**Consequências:** Simplicidade, mas delay de até 60s na entrega. Aceitável dado o caso de uso.

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Contexto técnico das decisões |
| [SECURITY.md](./SECURITY.md) | ADR-006 detalhado |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões derivados das ADRs |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema referenciado |
