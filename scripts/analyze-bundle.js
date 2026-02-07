#!/usr/bin/env node
/**
 * 📊 Analisador de Bundle Size
 * 
 * Este script analisa o tamanho do bundle após o build e:
 * 1. Compara com o histórico anterior
 * 2. Alerta se houver aumento significativo (>5%)
 * 3. Mostra breakdown por chunk
 * 4. Salva histórico para comparações futuras
 * 
 * Uso:
 *   node scripts/analyze-bundle.js
 *   node scripts/analyze-bundle.js --threshold=10 (alerta se > 10%)
 *   node scripts/analyze-bundle.js --json (saída em JSON)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const historyFile = path.join(rootDir, '.bundle-history.json');

// Configuração
const DEFAULT_THRESHOLD = 5; // 5% de aumento dispara alerta
const CHUNK_ALERT_THRESHOLD = 10; // 10% de aumento em chunk individual

// Parse argumentos
const args = process.argv.slice(2);
const threshold = parseFloat(args.find(a => a.startsWith('--threshold='))?.split('=')[1] || DEFAULT_THRESHOLD);
const jsonOutput = args.includes('--json');
const saveHistory = !args.includes('--no-save');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  return gzipSync(content).length;
}

function analyzeDirectory(dir, basePath = '') {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results.push(...analyzeDirectory(filePath, relativePath));
    } else if (file.endsWith('.js') || file.endsWith('.css')) {
      const size = stat.size;
      const gzipSize = getGzipSize(filePath);
      
      results.push({
        name: relativePath,
        size,
        gzipSize,
        type: file.endsWith('.js') ? 'js' : 'css',
        isChunk: file.includes('-') && !file.startsWith('index'),
      });
    }
  }
  
  return results;
}

function loadHistory() {
  try {
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }
  } catch (e) {
    console.warn('Não foi possível carregar histórico:', e.message);
  }
  return { builds: [] };
}

function saveHistoryData(history) {
  try {
    // Mantém apenas os últimos 50 builds
    history.builds = history.builds.slice(-50);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (e) {
    console.warn('Não foi possível salvar histórico:', e.message);
  }
}

function compareWithPrevious(current, previous) {
  const comparison = {
    totalDiff: 0,
    totalDiffPercent: 0,
    gzipDiff: 0,
    gzipDiffPercent: 0,
    newChunks: [],
    removedChunks: [],
    changedChunks: [],
  };
  
  if (!previous) return comparison;
  
  comparison.totalDiff = current.totalSize - previous.totalSize;
  comparison.totalDiffPercent = previous.totalSize > 0 
    ? ((current.totalSize - previous.totalSize) / previous.totalSize) * 100 
    : 0;
  
  comparison.gzipDiff = current.totalGzipSize - previous.totalGzipSize;
  comparison.gzipDiffPercent = previous.totalGzipSize > 0 
    ? ((current.totalGzipSize - previous.totalGzipSize) / previous.totalGzipSize) * 100 
    : 0;
  
  // Comparar chunks individuais
  const prevChunks = new Map(previous.files.map(f => [f.name, f]));
  const currChunks = new Map(current.files.map(f => [f.name, f]));
  
  for (const [name, chunk] of currChunks) {
    if (!prevChunks.has(name)) {
      comparison.newChunks.push(chunk);
    } else {
      const prevChunk = prevChunks.get(name);
      const diff = chunk.size - prevChunk.size;
      const diffPercent = prevChunk.size > 0 ? (diff / prevChunk.size) * 100 : 0;
      
      if (Math.abs(diffPercent) > 1) { // Mais de 1% de mudança
        comparison.changedChunks.push({
          name,
          oldSize: prevChunk.size,
          newSize: chunk.size,
          diff,
          diffPercent,
        });
      }
    }
  }
  
  for (const [name, chunk] of prevChunks) {
    if (!currChunks.has(name)) {
      comparison.removedChunks.push(chunk);
    }
  }
  
  return comparison;
}

function printReport(analysis, comparison, hasAlert) {
  if (jsonOutput) {
    console.log(JSON.stringify({ analysis, comparison, hasAlert }, null, 2));
    return;
  }
  
  console.log('\n' + colors.bold + colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bold + colors.cyan + '                    📊 ANÁLISE DE BUNDLE SIZE                    ' + colors.reset);
  console.log(colors.bold + colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');
  
  // Resumo geral
  console.log(colors.bold + '📦 Resumo Geral:' + colors.reset);
  console.log(`   Total (raw):  ${colors.bold}${formatBytes(analysis.totalSize)}${colors.reset}`);
  console.log(`   Total (gzip): ${colors.bold}${formatBytes(analysis.totalGzipSize)}${colors.reset} ${colors.gray}(economia de ${((1 - analysis.totalGzipSize/analysis.totalSize) * 100).toFixed(0)}%)${colors.reset}`);
  console.log(`   JS:           ${formatBytes(analysis.jsSize)} (gzip: ${formatBytes(analysis.jsGzipSize)})`);
  console.log(`   CSS:          ${formatBytes(analysis.cssSize)} (gzip: ${formatBytes(analysis.cssGzipSize)})`);
  console.log(`   Arquivos:     ${analysis.fileCount}`);
  
  // Comparação com anterior
  if (comparison && comparison.totalDiffPercent !== 0) {
    console.log('\n' + colors.bold + '📈 Comparação com Build Anterior:' + colors.reset);
    
    const diffColor = comparison.totalDiffPercent > 0 ? colors.red : colors.green;
    const diffSign = comparison.totalDiffPercent > 0 ? '+' : '';
    
    console.log(`   Diferença:    ${diffColor}${diffSign}${formatBytes(comparison.totalDiff)} (${diffSign}${comparison.totalDiffPercent.toFixed(2)}%)${colors.reset}`);
    console.log(`   Gzip:         ${diffColor}${diffSign}${formatBytes(comparison.gzipDiff)} (${diffSign}${comparison.gzipDiffPercent.toFixed(2)}%)${colors.reset}`);
    
    if (comparison.newChunks.length > 0) {
      console.log(`\n   ${colors.yellow}⚡ Novos chunks:${colors.reset}`);
      comparison.newChunks.forEach(c => {
        console.log(`      + ${c.name}: ${formatBytes(c.size)}`);
      });
    }
    
    if (comparison.removedChunks.length > 0) {
      console.log(`\n   ${colors.green}🗑️  Chunks removidos:${colors.reset}`);
      comparison.removedChunks.forEach(c => {
        console.log(`      - ${c.name}: ${formatBytes(c.size)}`);
      });
    }
    
    if (comparison.changedChunks.length > 0) {
      console.log(`\n   ${colors.blue}📝 Chunks modificados:${colors.reset}`);
      comparison.changedChunks
        .sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent))
        .slice(0, 10)
        .forEach(c => {
          const chunkColor = c.diffPercent > CHUNK_ALERT_THRESHOLD ? colors.red : 
                            c.diffPercent > 0 ? colors.yellow : colors.green;
          const sign = c.diffPercent > 0 ? '+' : '';
          console.log(`      ${c.name}: ${formatBytes(c.oldSize)} → ${formatBytes(c.newSize)} (${chunkColor}${sign}${c.diffPercent.toFixed(1)}%${colors.reset})`);
        });
    }
  }
  
  // Breakdown por chunk
  console.log('\n' + colors.bold + '📁 Top 10 Maiores Arquivos:' + colors.reset);
  analysis.files
    .sort((a, b) => b.gzipSize - a.gzipSize)
    .slice(0, 10)
    .forEach((file, i) => {
      const percent = ((file.gzipSize / analysis.totalGzipSize) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(parseFloat(percent) / 5)) + '░'.repeat(20 - Math.round(parseFloat(percent) / 5));
      console.log(`   ${(i + 1).toString().padStart(2)}. ${file.name.padEnd(40)} ${formatBytes(file.gzipSize).padStart(10)} ${colors.gray}${bar}${colors.reset} ${percent}%`);
    });
  
  // Alertas
  if (hasAlert) {
    console.log('\n' + colors.bold + colors.red + '⚠️  ALERTA: O bundle aumentou mais de ' + threshold + '%!' + colors.reset);
    console.log(colors.red + '   Considere revisar as mudanças recentes para otimizar o tamanho.' + colors.reset);
  }
  
  // Dicas de otimização
  const largeCssChunks = analysis.files.filter(f => f.type === 'css' && f.gzipSize > 50000);
  const largeJsChunks = analysis.files.filter(f => f.type === 'js' && f.gzipSize > 100000);
  
  if (largeCssChunks.length > 0 || largeJsChunks.length > 0) {
    console.log('\n' + colors.bold + colors.yellow + '💡 Sugestões de Otimização:' + colors.reset);
    
    if (largeJsChunks.length > 0) {
      console.log(colors.yellow + '   • Chunks JS grandes detectados. Considere code-splitting adicional.' + colors.reset);
    }
    if (largeCssChunks.length > 0) {
      console.log(colors.yellow + '   • CSS grande detectado. Considere purging ou critical CSS.' + colors.reset);
    }
  }
  
  console.log('\n' + colors.gray + `Threshold de alerta: ${threshold}% | Build em: ${new Date().toISOString()}` + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');
}

function main() {
  // Verificar se dist existe
  if (!fs.existsSync(distDir)) {
    console.error(colors.red + '❌ Diretório dist/ não encontrado. Execute "npm run build" primeiro.' + colors.reset);
    process.exit(1);
  }
  
  // Analisar arquivos
  const files = analyzeDirectory(path.join(distDir, 'assets'));
  
  // Calcular totais
  const analysis = {
    timestamp: new Date().toISOString(),
    files,
    fileCount: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    totalGzipSize: files.reduce((sum, f) => sum + f.gzipSize, 0),
    jsSize: files.filter(f => f.type === 'js').reduce((sum, f) => sum + f.size, 0),
    jsGzipSize: files.filter(f => f.type === 'js').reduce((sum, f) => sum + f.gzipSize, 0),
    cssSize: files.filter(f => f.type === 'css').reduce((sum, f) => sum + f.size, 0),
    cssGzipSize: files.filter(f => f.type === 'css').reduce((sum, f) => sum + f.gzipSize, 0),
  };
  
  // Carregar histórico e comparar
  const history = loadHistory();
  const previousBuild = history.builds[history.builds.length - 1];
  const comparison = compareWithPrevious(analysis, previousBuild);
  
  // Verificar se deve alertar
  const hasAlert = comparison.gzipDiffPercent > threshold;
  
  // Salvar no histórico
  if (saveHistory) {
    history.builds.push(analysis);
    saveHistoryData(history);
  }
  
  // Imprimir relatório
  printReport(analysis, comparison, hasAlert);
  
  // Exit code baseado em alerta
  if (hasAlert && args.includes('--ci')) {
    process.exit(1);
  }
}

main();
