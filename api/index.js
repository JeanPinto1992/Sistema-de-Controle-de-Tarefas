// api/index.js - Arquivo de entrada para Vercel (Serverless Function)
const path = require('path');

// ==========================================
// CONFIGURAÇÃO PARA PRODUÇÃO (VERCEL)
// ==========================================
console.log('🚀 Inicializando função serverless para Vercel');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 Timestamp:', new Date().toISOString());

// Definir ambiente como produção para Vercel
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Verificar variáveis críticas para Vercel
const requiredVars = ['REACT_APP_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERRO VERCEL: Variáveis de ambiente faltando:', missingVars);
  console.error('🔧 Configure essas variáveis no painel do Vercel');
}

// ==========================================
// IMPORTAR E EXPORTAR SERVIDOR PRINCIPAL
// ==========================================
try {
  // Importar o servidor principal
  const app = require('../server/server.js');
  
  console.log('✅ Servidor principal importado com sucesso para Vercel');
  
  // Exportar como função serverless para Vercel
  module.exports = app;
  
} catch (error) {
  console.error('❌ ERRO ao importar servidor para Vercel:', error.message);
  console.error('🔧 Stack trace:', error.stack);
  
  // Exportar uma função de erro como fallback
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Erro de inicialização do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  };
} 