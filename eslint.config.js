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
);
