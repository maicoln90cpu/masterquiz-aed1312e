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
    },
  },
  // Exceção: o próprio helper precisa fazer o push real
  {
    files: ["src/lib/gtmLogger.ts"],
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
          // Detecta literais de objeto contendo chaves de colunas ICP protegidas
          // (cobre .update({...}) e .insert({...}) em qualquer .from('profiles')).
          "selector": "Property[key.name=/^(quiz_shared_count|paywall_hit_count|upgrade_clicked_count|editor_sessions_count|crm_interactions_count|ai_used_on_real_quiz|plan_limit_hit_type|landing_variant_seen|first_lead_received_at|form_collection_configured_at)$/]",
          "message": "🚫 Não escreva diretamente em colunas ICP de profiles. Use incrementProfileCounter() / setProfileFirstText() / setProfileFlagTrue() / setProfileFirstTimestamp() de @/lib/icpTracking — RPCs SECURITY DEFINER atômicos. Veja mem://features/icp-tracking."
        }
      ],
    },
  },
);
