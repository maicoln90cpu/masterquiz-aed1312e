import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ✅ FASE 2 - ITEM 5: SOURCE MAPS - Hidden em produção para segurança
  // ✅ FASE 3: Code Splitting Avançado
  // ✅ FASE 8: Chunks otimizados
  build: {
    sourcemap: mode === 'development' ? true : 'hidden',
    // Target browsers modernos para menor bundle
    target: 'es2020',
    // Minificação agressiva
    minify: 'esbuild',
    // Inlining de assets pequenos
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - carrega sempre (mínimo necessário)
          'react-vendor': ['react', 'react-dom'],
          // Router - separado para cache independente
          'router-vendor': ['react-router-dom'],
          // UI Components - carrega com interação
          'ui-vendor': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch'
          ],
          // Charts - lazy loaded apenas em Analytics
          'chart-vendor': ['recharts'],
          // Animations - carrega após render inicial
          'animation-vendor': ['framer-motion'],
          // i18n - carrega em paralelo
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Onboarding - carrega apenas quando necessário
          'onboarding-vendor': ['driver.js'],
          // DnD - carrega apenas no editor
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // PDF Export - lazy loaded apenas quando exportar
          'pdf-vendor': ['html2pdf.js'],
          // Form validation - usado em vários lugares
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // TanStack Query - state management
          'query-vendor': ['@tanstack/react-query'],
          // Supabase - API client
          'supabase-vendor': ['@supabase/supabase-js'],
          // Date utilities
          'date-vendor': ['date-fns'],
        },
      },
    },
    // Reportar tamanho de chunks grandes
    chunkSizeWarningLimit: 500,
  },
}));
