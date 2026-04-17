#!/usr/bin/env node

/**
 * Script de Validação de Documentação - MasterQuiz
 * v2.41.0 — Inclui validação de contagens (tabelas, EFs) contra o código real
 * 
 * Uso: node scripts/validate-docs.js
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 1) Configuração dos docs obrigatórios
// ─────────────────────────────────────────────

const DOCS_CONFIG = {
  'README.md': {
    requiredSections: [
      '# 🎯 MasterQuiz',
      '## 🛠 Stack Tecnológica',
      '## 🏗 Arquitetura',
      '## 🚀 Setup do Projeto',
      '## 🎨 Design System',
      '## 🔐 Autenticação',
      '## ⚡ Edge Functions',
      '## 🗄 API e Database',
      '## ✨ Funcionalidades',
      '## 🔧 Troubleshooting',
      '## 🤝 Contribuição'
    ],
    minSize: 5000,
    description: 'Documentação técnica completa do sistema'
  },
  'docs/PENDENCIAS.md': {
    requiredSections: ['# 📋 PENDÊNCIAS'],
    minSize: 3000,
    description: 'Features, pendências e changelog'
  },
  'docs/ROADMAP.md': {
    requiredSections: ['# 🗺 ROADMAP'],
    minSize: 3000,
    description: 'Planejamento estratégico 2025-2026'
  },
  'docs/PRD.md': {
    requiredSections: ['# 📄 PRD'],
    minSize: 5000,
    description: 'Product Requirements Document'
  },
  'docs/DATABASE_SCHEMA.md': {
    requiredSections: ['# 🗄️ DATABASE SCHEMA'],
    minSize: 3000,
    description: 'Schema completo do banco'
  },
  'docs/EDGE_FUNCTIONS.md': {
    requiredSections: ['# ⚡ EDGE FUNCTIONS'],
    minSize: 2000,
    description: 'Catálogo de Edge Functions'
  },
  'docs/SECURITY.md': {
    requiredSections: ['# 🔒 SECURITY'],
    minSize: 2000,
    description: 'Práticas de segurança e RLS'
  },
  'docs/CODE_STANDARDS.md': {
    requiredSections: ['# 📐 CODE STANDARDS'],
    minSize: 2000,
    description: 'Padrões obrigatórios de código'
  },
  'docs/SYSTEM_DESIGN.md': {
    requiredSections: ['# 🏗️ System Design Document'],
    minSize: 3000,
    description: 'Arquitetura e fluxos técnicos'
  },
  'docs/ADR.md': {
    requiredSections: ['# 📋 ADR'],
    minSize: 1000,
    description: 'Architecture Decision Records'
  },
  'docs/ONBOARDING.md': {
    requiredSections: ['# 🚀 ONBOARDING'],
    minSize: 1000,
    description: 'Guia para novos desenvolvedores'
  },
  'docs/COMPONENTS.md': {
    requiredSections: ['# 🧩 Componentes'],
    minSize: 2000,
    description: 'Documentação de componentes'
  }
};

// ─────────────────────────────────────────────
// 2) Cores e helpers
// ─────────────────────────────────────────────

const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m'
};

const log = (msg, c = 'reset') => console.log(`${C[c]}${msg}${C.reset}`);

function readFile(p) {
  try { return fs.readFileSync(path.join(process.cwd(), p), 'utf-8'); } catch { return null; }
}

// ─────────────────────────────────────────────
// 3) Contagem real de EFs e tabelas
// ─────────────────────────────────────────────

function countEdgeFunctions() {
  const dir = path.join(process.cwd(), 'supabase', 'functions');
  if (!fs.existsSync(dir)) return { count: 0, names: [] };
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const funcs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name);
  return { count: funcs.length, names: funcs };
}

function extractDocNumber(content, pattern) {
  const match = content.match(pattern);
  if (!match) return null;
  return parseInt(match[1], 10);
}

// ─────────────────────────────────────────────
// 4) Validação de doc individual
// ─────────────────────────────────────────────

function validateDoc(fileName, config) {
  const result = { file: fileName, errors: [], warnings: [], exists: false };
  const content = readFile(fileName);
  
  if (!content) {
    result.errors.push(`Arquivo não encontrado: ${fileName}`);
    return result;
  }
  result.exists = true;
  
  const size = Buffer.byteLength(content, 'utf-8');
  if (size < config.minSize) {
    result.warnings.push(`Tamanho: ${(size/1024).toFixed(1)}KB (mín: ${(config.minSize/1024).toFixed(1)}KB)`);
  }
  
  for (const section of config.requiredSections) {
    if (!content.includes(section)) {
      result.errors.push(`Seção faltando: ${section}`);
    }
  }
  
  return result;
}

// ─────────────────────────────────────────────
// 5) Validação de consistência de contagens
// ─────────────────────────────────────────────

function validateCounts() {
  const results = [];
  const realEFs = countEdgeFunctions();
  
  // Verificar contagem de EFs nos docs
  const docsToCheckEF = [
    'README.md',
    'docs/EDGE_FUNCTIONS.md',
    'docs/ONBOARDING.md',
    'docs/SYSTEM_DESIGN.md',
    'docs/API_DOCS.md'
  ];
  
  for (const doc of docsToCheckEF) {
    const content = readFile(doc);
    if (!content) continue;
    
    // Procura padrões como "(64 funções)", "(61 funções)", "61 Edge Functions"
    const patterns = [
      /\((\d+)\s*funç[oõ]es?\)/gi,
      /(\d+)\s*Edge\s*Functions/gi,
      /(\d+)\s*funç[oõ]es/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const docCount = parseInt(match[1], 10);
        if (docCount > 50 && docCount !== realEFs.count) {
          results.push({
            type: 'error',
            message: `${doc}: diz ${docCount} EFs, mas existem ${realEFs.count} reais`
          });
          break; // só 1 erro por doc
        }
      }
    }
  }
  
  // Verificar contagem de tabelas no DATABASE_SCHEMA
  const schemaContent = readFile('docs/DATABASE_SCHEMA.md');
  if (schemaContent) {
    const tableCountMatch = schemaContent.match(/Total de tabelas:\*?\*?\s*(\d+)/i);
    if (tableCountMatch) {
      const docTables = parseInt(tableCountMatch[1], 10);
      // Nota: contagem real requer query ao DB (não disponível offline)
      // Validamos apenas consistência interna entre docs
      const readmeContent = readFile('README.md');
      if (readmeContent) {
        const readmeTableMatch = readmeContent.match(/(\d+)\s*tabelas/i);
        if (readmeTableMatch) {
          const readmeTables = parseInt(readmeTableMatch[1], 10);
          if (readmeTables > 50 && readmeTables !== docTables) {
            results.push({
              type: 'error',
              message: `README diz ${readmeTables} tabelas, DATABASE_SCHEMA diz ${docTables}`
            });
          }
        }
      }
    }
  }
  
  return { realEFs: realEFs.count, issues: results };
}

// ─────────────────────────────────────────────
// 6) Cross-reference validation
// ─────────────────────────────────────────────

function validateCrossRefs() {
  const issues = [];
  const docsDir = path.join(process.cwd(), 'docs');
  
  if (!fs.existsSync(docsDir)) return issues;
  
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const content = readFile(`docs/${file}`);
    if (!content) continue;
    
    // Find markdown links to other docs
    const linkPattern = /\[.*?\]\(\.\/([\w_-]+\.md)\)/g;
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const linked = match[1];
      if (!files.includes(linked)) {
        issues.push(`docs/${file}: link quebrado para ./${linked}`);
      }
    }
  }
  
  return issues;
}

// ─────────────────────────────────────────────
// 7) Main
// ─────────────────────────────────────────────

function main() {
  console.log();
  log('🔍 VALIDAÇÃO DE DOCUMENTAÇÃO - MasterQuiz v2.41.0', 'bold');
  log(`   Executado em: ${new Date().toLocaleString('pt-BR')}`, 'cyan');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // A) Validar docs individuais
  console.log('\n' + '─'.repeat(60));
  log('📄 VERIFICAÇÃO DE ARQUIVOS', 'bold');
  console.log('─'.repeat(60));
  
  for (const [file, config] of Object.entries(DOCS_CONFIG)) {
    const r = validateDoc(file, config);
    const icon = r.errors.length === 0 ? '✅' : '❌';
    const warnIcon = r.warnings.length > 0 ? ' ⚠️' : '';
    log(`  ${icon} ${file} — ${config.description}${warnIcon}`, r.errors.length ? 'red' : 'green');
    r.errors.forEach(e => log(`     └─ ❌ ${e}`, 'red'));
    r.warnings.forEach(w => log(`     └─ ⚠️  ${w}`, 'yellow'));
    totalErrors += r.errors.length;
    totalWarnings += r.warnings.length;
  }
  
  // B) Validar contagens (EFs, tabelas)
  console.log('\n' + '─'.repeat(60));
  log('🔢 VALIDAÇÃO DE CONTAGENS', 'bold');
  console.log('─'.repeat(60));
  
  const counts = validateCounts();
  log(`  📦 Edge Functions no filesystem: ${counts.realEFs}`, 'cyan');
  
  if (counts.issues.length === 0) {
    log('  ✅ Contagens consistentes entre docs', 'green');
  } else {
    counts.issues.forEach(i => {
      log(`  ❌ ${i.message}`, 'red');
      totalErrors++;
    });
  }
  
  // C) Cross-references
  console.log('\n' + '─'.repeat(60));
  log('🔗 CROSS-REFERENCES', 'bold');
  console.log('─'.repeat(60));
  
  const crossRefIssues = validateCrossRefs();
  if (crossRefIssues.length === 0) {
    log('  ✅ Todos os links internos válidos', 'green');
  } else {
    crossRefIssues.forEach(i => {
      log(`  ❌ ${i}`, 'red');
      totalErrors++;
    });
  }
  
  // D) Relatório final
  console.log('\n' + '═'.repeat(60));
  log('📊 RELATÓRIO FINAL', 'bold');
  console.log('═'.repeat(60));
  
  const totalDocs = Object.keys(DOCS_CONFIG).length;
  log(`  📁 Docs verificados: ${totalDocs}`, 'cyan');
  log(`  📦 Edge Functions: ${counts.realEFs}`, 'cyan');
  log(`  ❌ Erros: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
  log(`  ⚠️  Avisos: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green');
  
  console.log('─'.repeat(60));
  
  if (totalErrors === 0 && totalWarnings === 0) {
    log('🎉 Toda documentação está atualizada e consistente!', 'green');
  } else if (totalErrors === 0) {
    log('⚠️  Documentação OK, mas existem avisos para revisar.', 'yellow');
  } else {
    log('❌ Existem problemas na documentação que precisam ser corrigidos.', 'red');
  }
  
  console.log();
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
