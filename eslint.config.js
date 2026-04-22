import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "src/integrations/supabase/types.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "import": importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      
      // Variáveis não usadas como warning (não erro)
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      
      // Complexidade máxima de funções
      "complexity": ["warn", { max: 20 }],
      
      // Ordenação de imports
      "import/order": ["warn", {
        "groups": [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "index",
          "type"
        ],
        "pathGroups": [
          {
            "pattern": "react",
            "group": "builtin",
            "position": "before"
          },
          {
            "pattern": "@/**",
            "group": "internal",
            "position": "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["react"],
        "newlines-between": "never",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }],
      
      // Sem imports duplicados
      "import/no-duplicates": "warn",

      // 🚫 P5: console.log/warn/error → use logger de @/lib/logger
      // Permitido apenas em logger.ts, gtmLogger.ts, errorCapture.ts e useWebVitals.ts (helpers/DEV-only).
      // Nível: ERROR (v2.44.0 — 0 arquivos legados após Onda 2 da limpeza P5).
      // Bloqueia novos console.* permanentemente. Para reintroduzir um console legítimo,
      // adicionar à allowlist abaixo OU usar logger.* de @/lib/logger.
      "no-console": ["error", { allow: ["info"] }],

      // 🚫 Proteção: nunca push direto no dataLayer fora de gtmLogger.ts
      // Use pushGTMEvent() de @/lib/gtmLogger para garantir persistência em gtm_event_logs
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.object.property.name='dataLayer'][callee.property.name='push']",
          "message": "🚫 Não use window.dataLayer.push() direto. Use pushGTMEvent() de @/lib/gtmLogger para garantir persistência em gtm_event_logs e padronização do pipeline."
        },
        {
          "selector": "CallExpression[callee.object.name='dataLayer'][callee.property.name='push']",
          "message": "🚫 Não use dataLayer.push() direto. Use pushGTMEvent() de @/lib/gtmLogger."
        },
        {
          // 🚫 P3: navigator.sendBeacon não envia headers (apikey/Authorization)
          // exigidos por Edge Functions Supabase. Use fetch + keepalive:true.
          "selector": "CallExpression[callee.object.name='navigator'][callee.property.name='sendBeacon']",
          "message": "🚫 Não use navigator.sendBeacon: Supabase Edge Functions exigem header `apikey` que sendBeacon não envia. Use fetch(url, { method:'POST', keepalive:true, headers:{ apikey, Authorization } })."
        }
      ],
      // ⚠️ P4 (auth.getUser direto) é validado via teste de baseline em
      // src/__tests__/contracts/no-direct-auth-getuser.test.ts (não como regra lint
      // para evitar quebrar build de 172 arquivos legados).
    },
  },
  // ⚠️ P5: exceção no-console — helpers de logging precisam usar console nativo
  {
    files: [
      "src/lib/logger.ts",
      "src/lib/gtmLogger.ts",
      "src/lib/errorCapture.ts",
      "src/hooks/useWebVitals.ts",
    ],
    rules: {
      "no-console": "off",
    },
  },
  // Exceção: gtmLogger faz dataLayer.push real + auth.getUser para enriquecer evento
  {
    files: ["src/lib/gtmLogger.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // ⚠️ P4: exceção auth.getUser — AuthContext e o próprio hook precisam buscar o user real.
  // Edge functions / supabase client wrapper também são fontes legítimas.
  {
    files: [
      "src/contexts/AuthContext.tsx",
      "src/hooks/useCurrentUser.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // 🚫 Páginas públicas: proibir <header> local — devem usar <LandingHeader />
  // Evita regressão de navegação cross-page e botão "Voltar para Home".
  {
    files: [
      "src/pages/Pricing.tsx",
      "src/pages/FAQ.tsx",
      "src/pages/Compare*.tsx",
      "src/pages/Blog*.tsx",
      "src/pages/Index.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "JSXOpeningElement[name.name='header']",
          "message": "🚫 Páginas públicas devem usar <LandingHeader /> de @/components/landing/LandingHeader. Não crie <header> local — quebra navegação cross-page e botão 'Voltar para Home'."
        }
      ],
    },
  },
  // 🚫 Componentes admin: proibir <Table> direto — usar <DataTable /> universal.
  // Padroniza busca, sort, filtros, paginação e CSV em todas as telas administrativas.
  // Veja src/components/admin/system/DataTable.md para uso.
  {
    files: ["src/components/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["warn", {
        "paths": [
          {
            "name": "@/components/ui/table",
            "message": "🚫 Em src/components/admin/** use <DataTable /> de @/components/admin/system/DataTable. <Table> direto só para casos especiais (colspan complexo, edição inline) — adicione exceção explícita aqui no eslint.config.js."
          }
        ]
      }],
    },
  },
  // Exceções: o próprio DataTable + arquivos legados (a migrar progressivamente).
  // Ao refatorar um destes para DataTable, REMOVA o caminho desta lista.
  {
    files: [
      "src/components/admin/system/DataTable.tsx",
      "src/components/admin/system/SortableTableHeader.tsx",
      "src/components/admin/system/ActivityPanel.tsx",
      "src/components/admin/system/DatabaseMonitorTab.tsx",
      "src/components/admin/system/InstitutionalDomainsPanel.tsx",
      "src/components/admin/system/QueueMonitorPanel.tsx",
      "src/components/admin/AISettings.tsx",
      "src/components/admin/GTMEventsDashboard.tsx",
      "src/components/admin/GrowthDashboard.tsx",
      "src/components/admin/PaymentWebhookLogs.tsx",
      "src/components/admin/PostExpressConversionCard.tsx",
      "src/components/admin/TemplateManagement.tsx",
      "src/components/admin/blog/BlogPostsManager.tsx",
      "src/components/admin/recovery/EmailAutomations.tsx",
      "src/components/admin/recovery/EmailRecoveryCosts.tsx",
      "src/components/admin/recovery/EmailRecoveryQueue.tsx",
      "src/components/admin/recovery/EmailRecoveryReports.tsx",
      "src/components/admin/recovery/EmailRecoveryTemplates.tsx",
      "src/components/admin/recovery/RecoveryHistory.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // 🚫 P2: Proteção de contadores ICP em profiles.
  // UPDATE direto em colunas de contador sobrescreve valores acumulados (race condition + perda de dados).
  // Use sempre os helpers atômicos de @/lib/icpTracking que chamam RPCs SECURITY DEFINER.
  // Colunas protegidas: quiz_shared_count, paywall_hit_count, upgrade_clicked_count,
  // editor_sessions_count, crm_interactions_count, ai_used_on_real_quiz,
  // plan_limit_hit_type, landing_variant_seen, first_lead_received_at, form_collection_configured_at.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/icpTracking.ts",
      "src/lib/gtmLogger.ts",
      "src/__tests__/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        // mantém regras globais (duplicadas aqui porque ESLint substitui o array por config)
        {
          "selector": "CallExpression[callee.object.property.name='dataLayer'][callee.property.name='push']",
          "message": "🚫 Não use window.dataLayer.push() direto. Use pushGTMEvent() de @/lib/gtmLogger."
        },
        {
          "selector": "CallExpression[callee.object.name='dataLayer'][callee.property.name='push']",
          "message": "🚫 Não use dataLayer.push() direto. Use pushGTMEvent() de @/lib/gtmLogger."
        },
        {
          "selector": "CallExpression[callee.object.name='navigator'][callee.property.name='sendBeacon']",
          "message": "🚫 Não use navigator.sendBeacon. Use fetch(url,{method:'POST',keepalive:true,headers:{apikey,Authorization}}) — Edge Functions exigem apikey."
        },
        {
          // 🚫 P2: Detecta literais de objeto contendo chaves de colunas ICP protegidas
          // (cobre .update({...}) e .insert({...}) em qualquer .from('profiles')).
          "selector": "Property[key.name=/^(quiz_shared_count|paywall_hit_count|upgrade_clicked_count|editor_sessions_count|crm_interactions_count|ai_used_on_real_quiz|plan_limit_hit_type|landing_variant_seen|first_lead_received_at|form_collection_configured_at)$/]",
          "message": "🚫 Não escreva diretamente em colunas ICP de profiles. Use incrementProfileCounter() / setProfileFirstText() / setProfileFlagTrue() / setProfileFirstTimestamp() de @/lib/icpTracking — RPCs SECURITY DEFINER atômicos. Veja mem://features/icp-tracking."
        }
      ],
    },
  },
  // ⚠️ P21 (Onda 7 / Etapa 4): `new Date()` sem argumentos em código de produção.
  // Prefira `now()` / `nowISO()` de @/lib/dateUtils — facilita mock em testes
  // determinísticos e padroniza o ponto de leitura do clock. Apenas WARN
  // (não bloqueia) para não quebrar build legado; deve diminuir a cada PR.
  // Exceções: dateUtils, hooks que precisam medir tempo real (useWebVitals).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/dateUtils.ts",
      "src/hooks/useWebVitals.ts",
      "src/lib/performanceCapture.ts",
      "src/__tests__/**",
      "src/**/*.test.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          "selector": "NewExpression[callee.name='Date'][arguments.length=0]",
          "message": "⚠️ Prefira now()/nowISO() de @/lib/dateUtils em vez de `new Date()` — facilita mock em testes e padroniza o clock."
        }
      ],
    },
  },
  // ⚠️ P22 (Onda 7 / Etapa 4): `.single()` em mutations Supabase (.insert/.update/.delete/.upsert)
  // lança PGRST116 quando 0 linhas retornam, quebrando o fluxo. Use `.maybeSingle()`
  // que devolve `null` em vez de erro. Apenas WARN — migrar incrementalmente.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/__tests__/**", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          // .insert(...).select(...).single() — chain comum em mutations
          "selector": "CallExpression[callee.property.name='single'] > MemberExpression.callee > CallExpression[callee.property.name='select'] > MemberExpression.callee > CallExpression[callee.property.name=/^(insert|update|delete|upsert)$/]",
          "message": "⚠️ Use .maybeSingle() em vez de .single() após insert/update/delete/upsert — single() lança PGRST116 quando 0 linhas, maybeSingle() devolve null."
        },
        {
          // .insert(...).single() direto (sem .select)
          "selector": "CallExpression[callee.property.name='single'] > MemberExpression.callee > CallExpression[callee.property.name=/^(insert|update|delete|upsert)$/]",
          "message": "⚠️ Use .maybeSingle() em vez de .single() após insert/update/delete/upsert — single() lança PGRST116 quando 0 linhas, maybeSingle() devolve null."
        }
      ],
    },
  },
  // 🚫 P26 (Onda 3): RichTextEditor (Quill) não pode reintroduzir os controles
  // duplicados de tamanho (`size`) e alinhamento (`align`) no toolbar.
  // Esses controles foram removidos na Onda 2 — tamanho fica em Header (H1/H2/H3)
  // ou no campo "Tamanho da fonte" do painel de Propriedades; alinhamento fica
  // exclusivamente no painel. Reintroduzi-los recria o conflito de "qual config vale".
  {
    files: ["src/components/quiz/blocks/RichTextEditor.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // Detecta `{ size: [...] }` e `{ align: [...] }` em qualquer Property literal do toolbar.
          "selector": "Property[key.name='size'][value.type='ArrayExpression']",
          "message": "🚫 P26: Não reintroduza `{ size: [...] }` no toolbar do Quill. Tamanho deve vir do dropdown Header OU do painel de Propriedades (campo Tamanho da fonte). Veja Onda 2 do refactor do editor."
        },
        {
          "selector": "Property[key.name='align'][value.type='ArrayExpression']",
          "message": "🚫 P26: Não reintroduza `{ align: [...] }` no toolbar do Quill. Alinhamento é exclusivo do painel de Propriedades. Veja Onda 2 do refactor do editor."
        }
      ],
    },
  },
  // 🚫 P23 (Onda 7): `<button>` HTML nativo sem `type` defaulta para "submit"
  // dentro de <form>, causando submissões acidentais e refresh da página.
  // Sempre defina type="button" | "submit" | "reset" explicitamente.
  // Componente <Button /> do shadcn já força `type="button"` por padrão e está liberado.
  {
    files: ["src/**/*.{tsx,jsx}"],
    ignores: [
      "src/components/ui/**", // shadcn primitives (já tipadas)
      "src/__tests__/**",
      "src/**/*.test.{tsx,jsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          // <button> JSX sem nenhum atributo `type`
          "selector": "JSXOpeningElement[name.name='button']:not(:has(JSXAttribute[name.name='type']))",
          "message": "🚫 P23: <button> sem `type` defaulta para 'submit' dentro de <form> e causa refresh acidental. Use type=\"button\" (ou 'submit'/'reset' explicitamente)."
        }
      ],
    },
  },
);
