const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://xdwypvfgaatcfxpjygub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODA2ODUsImV4cCI6MjA2NDU1NjY4NX0.FN8h5tT77tOPyPtjs1hVysj3HXT9Q6P5qqnmM1aAPxM';

console.log('🔗 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarConexao() {
  try {
    console.log('\n📊 Executando query de teste...');
    
    // Teste simples
    const { data, error, count } = await supabase
      .from('tarefas')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Erro na query:', error);
      return;
    }
    
    console.log('✅ Conexão bem-sucedida!');
    console.log(`📈 Total de tarefas no banco: ${count}`);
    console.log('📋 Primeiras 5 tarefas:');
    data.forEach((tarefa, index) => {
      console.log(`   ${index + 1}. ID: ${tarefa.id_tarefa} - ${tarefa.tarefa} (${tarefa.responsavel})`);
    });
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

testarConexao(); 