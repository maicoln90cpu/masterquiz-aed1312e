#!/usr/bin/env node

/**
 * Script de Validação de Documentação - MasterQuizz
 * 
 * Verifica se todos os arquivos de documentação estão:
 * - Presentes
 * - Com estrutura correta
 * - Atualizados (últimos 30 dias)
 * 
 * Uso: node scripts/validate-docs.js
 */

const fs = require('fs');
const path = require('path');

// Configuração dos arquivos de documentação
const DOCS_CONFIG = {
  'README.md': {
    requiredSections: [
      '# 🎯 MasterQuizz',
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
    minSize: 5000, // bytes
    description: 'Documentação técnica completa do sistema'
  },
  'PENDENCIAS.md': {
    requiredSections: [
      '# 📋 PENDÊNCIAS',
      '## 📊 Status Geral',
      '## ✅ Features Implementadas',
      '## 🔄 Em Progresso',
      '## 📝 Pendências Prioritárias',
      '## 💡 Sugestões Futuras',
      '## 📜 Changelog'
    ],
    minSize: 3000,
    description: 'Features, pendências e changelog'
  },
  'ROADMAP.md': {
    requiredSections: [
      '# 🗺 ROADMAP',
      '## 📅 Visão Geral',
      '## 🎯 Q1 2025',
      '## 🚀 Q2 2025',
      '## 🤖 Q3 2025',
      '## 🏢 Q4 2025',
      '## 🌎 2026',
      '## 📊 Métricas de Sucesso'
    ],
    minSize: 3000,
    description: 'Planejamento estratégico 2025-2026'
  },
  'PRD.md': {
    requiredSections: [
      '# 📄 PRD',
      '## 🎯 Visão do Produto',
      '## 🔍 Problema e Solução',
      '## 👥 Personas',
      '## ✅ Requisitos Funcionais',
      '## 🔒 Requisitos Não-Funcionais',
      '## 📝 Backlog',
      '## 📊 Métricas de Sucesso'
    ],
    minSize: 5000,
    description: 'Product Requirements Document'
  }
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '─'.repeat(60));
  log(`📄 ${title}`, 'bold');
  console.log('─'.repeat(60));
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function getFileStats(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function checkSections(content, requiredSections) {
  const missing = [];
  const found = [];
  
  for (const section of requiredSections) {
    if (content.includes(section)) {
      found.push(section);
    } else {
      missing.push(section);
    }
  }
  
  return { found, missing };
}

function getDaysSinceModified(stats) {
  const now = new Date();
  const modified = new Date(stats.mtime);
  const diffTime = Math.abs(now - modified);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function validateDoc(fileName, config) {
  const results = {
    file: fileName,
    exists: false,
    size: 0,
    sizeOk: false,
    sectionsFound: 0,
    sectionsMissing: [],
    lastModified: null,
    daysSinceUpdate: 0,
    isRecent: false,
    errors: [],
    warnings: []
  };
  
  const filePath = path.join(process.cwd(), fileName);
  
  // Check existence
  if (!checkFileExists(filePath)) {
    results.errors.push(`Arquivo não encontrado: ${fileName}`);
    return results;
  }
  results.exists = true;
  
  // Get stats
  const stats = getFileStats(filePath);
  if (!stats) {
    results.errors.push(`Não foi possível ler stats do arquivo`);
    return results;
  }
  
  results.size = stats.size;
  results.sizeOk = stats.size >= config.minSize;
  results.lastModified = stats.mtime;
  results.daysSinceUpdate = getDaysSinceModified(stats);
  results.isRecent = results.daysSinceUpdate <= 30;
  
  if (!results.sizeOk) {
    results.warnings.push(`Arquivo muito pequeno (${results.size} bytes, mínimo: ${config.minSize})`);
  }
  
  if (!results.isRecent) {
    results.warnings.push(`Arquivo não atualizado há ${results.daysSinceUpdate} dias`);
  }
  
  // Read content and check sections
  const content = readFileContent(filePath);
  if (!content) {
    results.errors.push(`Não foi possível ler conteúdo do arquivo`);
    return results;
  }
  
  const { found, missing } = checkSections(content, config.requiredSections);
  results.sectionsFound = found.length;
  results.sectionsMissing = missing;
  
  if (missing.length > 0) {
    results.errors.push(`Seções faltando: ${missing.length}`);
  }
  
  return results;
}

function printResults(results, config) {
  logSection(`${results.file} - ${config.description}`);
  
  // Existence
  if (results.exists) {
    log(`  ✅ Arquivo existe`, 'green');
  } else {
    log(`  ❌ Arquivo não encontrado`, 'red');
    return;
  }
  
  // Size
  const sizeKb = (results.size / 1024).toFixed(1);
  if (results.sizeOk) {
    log(`  ✅ Tamanho: ${sizeKb} KB`, 'green');
  } else {
    log(`  ⚠️  Tamanho: ${sizeKb} KB (mínimo: ${(config.minSize / 1024).toFixed(1)} KB)`, 'yellow');
  }
  
  // Last modified
  const modifiedStr = formatDate(results.lastModified);
  if (results.isRecent) {
    log(`  ✅ Última atualização: ${modifiedStr} (${results.daysSinceUpdate} dias atrás)`, 'green');
  } else {
    log(`  ⚠️  Última atualização: ${modifiedStr} (${results.daysSinceUpdate} dias atrás)`, 'yellow');
  }
  
  // Sections
  const totalSections = config.requiredSections.length;
  if (results.sectionsMissing.length === 0) {
    log(`  ✅ Seções: ${results.sectionsFound}/${totalSections} encontradas`, 'green');
  } else {
    log(`  ❌ Seções: ${results.sectionsFound}/${totalSections} encontradas`, 'red');
    results.sectionsMissing.forEach(section => {
      log(`     └─ Faltando: ${section}`, 'red');
    });
  }
}

function generateReport(allResults) {
  console.log('\n' + '═'.repeat(60));
  log('📊 RELATÓRIO FINAL', 'bold');
  console.log('═'.repeat(60));
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let filesOk = 0;
  
  allResults.forEach(r => {
    totalErrors += r.errors.length;
    totalWarnings += r.warnings.length;
    if (r.errors.length === 0) filesOk++;
  });
  
  console.log();
  log(`  📁 Arquivos verificados: ${allResults.length}`, 'cyan');
  log(`  ✅ Arquivos OK: ${filesOk}/${allResults.length}`, filesOk === allResults.length ? 'green' : 'yellow');
  log(`  ❌ Erros: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
  log(`  ⚠️  Avisos: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green');
  
  console.log('\n' + '─'.repeat(60));
  
  if (totalErrors === 0 && totalWarnings === 0) {
    log('🎉 Toda documentação está atualizada e completa!', 'green');
    return 0;
  } else if (totalErrors === 0) {
    log('⚠️  Documentação OK, mas existem avisos para revisar.', 'yellow');
    return 0;
  } else {
    log('❌ Existem problemas na documentação que precisam ser corrigidos.', 'red');
    return 1;
  }
}

// Main execution
function main() {
  console.log();
  log('🔍 VALIDAÇÃO DE DOCUMENTAÇÃO - MasterQuizz', 'bold');
  log(`   Executado em: ${new Date().toLocaleString('pt-BR')}`, 'cyan');
  
  const allResults = [];
  
  for (const [fileName, config] of Object.entries(DOCS_CONFIG)) {
    const results = validateDoc(fileName, config);
    allResults.push(results);
    printResults(results, config);
  }
  
  const exitCode = generateReport(allResults);
  console.log();
  
  process.exit(exitCode);
}

main();
