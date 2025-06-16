#!/usr/bin/env node

// start-dev.js - Script de inicialização robusto para desenvolvimento
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURAÇÕES
// ==========================================
const CONFIG = {
  ENV_FILE: '.env',
  BUILD_DIR: 'build',
  SERVER_FILE: 'server/server.js',
  PORT: process.env.PORT || 3002
};

// ==========================================
// UTILITÁRIOS
// ==========================================
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Executando: ${command} ${args.join(' ')}`, 'info');
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// ==========================================
// VERIFICAÇÕES PRÉ-INICIALIZAÇÃO
// ==========================================
async function checkPrerequisites() {
  log('🔍 Verificando pré-requisitos...', 'info');
  
  // Verificar Node.js
  const nodeVersion = process.version;
  log(`Node.js versão: ${nodeVersion}`, 'info');
  
  // Verificar arquivo .env
  if (!fileExists(CONFIG.ENV_FILE)) {
    log(`❌ Arquivo ${CONFIG.ENV_FILE} não encontrado!`, 'error');
    log('📋 Crie o arquivo .env com as variáveis necessárias', 'warning');
    process.exit(1);
  } else {
    log(`✅ Arquivo ${CONFIG.ENV_FILE} encontrado`, 'success');
  }
  
  // Verificar package.json
  if (!fileExists('package.json')) {
    log('❌ Arquivo package.json não encontrado!', 'error');
    process.exit(1);
  }
  
  // Verificar node_modules
  if (!fileExists('node_modules')) {
    log('📦 Instalando dependências...', 'warning');
    try {
      await runCommand('npm', ['install']);
      log('✅ Dependências instaladas', 'success');
    } catch (error) {
      log('❌ Erro ao instalar dependências', 'error');
      console.error(error);
      process.exit(1);
    }
  }
  
  // Verificar servidor
  if (!fileExists(CONFIG.SERVER_FILE)) {
    log(`❌ Arquivo do servidor ${CONFIG.SERVER_FILE} não encontrado!`, 'error');
    process.exit(1);
  }
  
  log('✅ Todos os pré-requisitos atendidos', 'success');
}

// ==========================================
// CONSTRUÇÃO DO PROJETO
// ==========================================
async function buildProject() {
  log('🏗️ Construindo projeto React...', 'info');
  
  try {
    await runCommand('npm', ['run', 'build']);
    log('✅ Build do React concluído', 'success');
  } catch (error) {
    log('❌ Erro no build do React', 'error');
    console.error(error);
    process.exit(1);
  }
}

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
function startServer() {
  log('🚀 Iniciando servidor de desenvolvimento...', 'info');
  log(`🌐 Servidor será iniciado na porta ${CONFIG.PORT}`, 'info');
  log(`📁 Servindo arquivos de: ${CONFIG.BUILD_DIR}`, 'info');
  
  // Usar concurrently para executar build:watch e server:dev simultaneamente
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    log(`Servidor finalizado com código ${code}`, code === 0 ? 'info' : 'error');
  });
  
  child.on('error', (error) => {
    log('❌ Erro ao iniciar servidor', 'error');
    console.error(error);
  });
  
  // Capturar sinais de interrupção
  process.on('SIGINT', () => {
    log('🛑 Interrompendo servidor...', 'warning');
    child.kill('SIGINT');
    process.exit(0);
  });
}

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================
async function main() {
  try {
    console.log('🎯 ===== SISTEMA DE CONTROLE DE TAREFAS =====');
    console.log('🔧 Modo: DESENVOLVIMENTO');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('================================================\n');
    
    await checkPrerequisites();
    
    // Verificar se já existe build, se não, criar
    if (!fileExists(CONFIG.BUILD_DIR)) {
      await buildProject();
    } else {
      log('📁 Build existente encontrado', 'info');
    }
    
    startServer();
    
  } catch (error) {
    log('❌ Erro fatal na inicialização', 'error');
    console.error(error);
    process.exit(1);
  }
}

// Executar apenas se este arquivo for chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, checkPrerequisites, buildProject }; 