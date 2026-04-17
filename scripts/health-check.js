#!/usr/bin/env node
/**
 * Health Check Script - Verifica se a aplicação está respondendo
 * 
 * Uso:
 *   node scripts/health-check.js
 *   node scripts/health-check.js --url https://seu-site.com
 *   APP_URL=https://seu-site.com node scripts/health-check.js
 */

const https = require('https');
const http = require('http');

// Configuração
const DEFAULT_URL = 'https://masterquizz.lovable.app';
const TIMEOUT_MS = 10000;

// Endpoints a verificar
const ENDPOINTS = [
  { path: '/', name: 'Página Inicial', critical: true },
  { path: '/login', name: 'Página de Login', critical: true },
  { path: '/pricing', name: 'Página de Preços', critical: false },
];

// Cores para terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let url = process.env.APP_URL || DEFAULT_URL;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[i + 1];
    }
  }
  
  return { baseUrl: url.replace(/\/$/, '') };
}

function checkEndpoint(baseUrl, endpoint) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${endpoint.path}`;
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { timeout: TIMEOUT_MS }, (res) => {
      const duration = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 400;
      
      resolve({
        ...endpoint,
        url,
        status: res.statusCode,
        duration,
        success,
        message: success ? 'OK' : `HTTP ${res.statusCode}`,
      });
    });
    
    req.on('error', (err) => {
      resolve({
        ...endpoint,
        url,
        status: 0,
        duration: Date.now() - startTime,
        success: false,
        message: err.code || err.message,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        ...endpoint,
        url,
        status: 0,
        duration: TIMEOUT_MS,
        success: false,
        message: 'TIMEOUT',
      });
    });
  });
}

async function runHealthCheck() {
  const { baseUrl } = parseArgs();
  
  console.log('');
  log('╔════════════════════════════════════════════╗', 'blue');
  log('║         🏥 HEALTH CHECK - MasterQuiz       ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  console.log('');
  log(`🌐 URL Base: ${baseUrl}`, 'blue');
  console.log('');
  
  const results = await Promise.all(
    ENDPOINTS.map((ep) => checkEndpoint(baseUrl, ep))
  );
  
  let criticalFailed = false;
  let anyFailed = false;
  
  console.log('┌────────────────────────────────────────────┐');
  console.log('│ Resultados                                 │');
  console.log('├────────────────────────────────────────────┤');
  
  results.forEach((r) => {
    const icon = r.success ? '✅' : '❌';
    const statusColor = r.success ? 'green' : 'red';
    const criticalTag = r.critical ? ' [CRÍTICO]' : '';
    
    log(`│ ${icon} ${r.name.padEnd(20)} ${String(r.status).padEnd(4)} ${r.duration}ms${criticalTag}`, statusColor);
    
    if (!r.success) {
      anyFailed = true;
      if (r.critical) criticalFailed = true;
    }
  });
  
  console.log('└────────────────────────────────────────────┘');
  console.log('');
  
  // Resumo
  const passedCount = results.filter((r) => r.success).length;
  const totalCount = results.length;
  
  if (criticalFailed) {
    log('❌ FALHA CRÍTICA: Endpoints essenciais não estão respondendo!', 'red');
    log(`   ${passedCount}/${totalCount} endpoints OK`, 'red');
    process.exit(1);
  } else if (anyFailed) {
    log('⚠️  ATENÇÃO: Alguns endpoints não críticos falharam', 'yellow');
    log(`   ${passedCount}/${totalCount} endpoints OK`, 'yellow');
    process.exit(0); // Não falha o CI por endpoints não críticos
  } else {
    log('🎉 SUCESSO: Todos os endpoints estão respondendo!', 'green');
    log(`   ${passedCount}/${totalCount} endpoints OK`, 'green');
    process.exit(0);
  }
}

// Executar
runHealthCheck().catch((err) => {
  log(`❌ Erro inesperado: ${err.message}`, 'red');
  process.exit(1);
});
