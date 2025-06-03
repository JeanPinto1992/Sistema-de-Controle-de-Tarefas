const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase usando as variáveis do arquivo CONFIGURACAO_SUPABASE.md
const supabaseUrl = 'https://xdwypvfgaatcfxpjygub.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTMwNTUxMCwiZXhwIjoyMDU0ODgxNTEwfQ.dOV4K6aDISDUGZ0ktbS4fYcGGc8qjxPBqE9vDofJ7D8';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function limparBanco() {
  console.log('🧹 Limpando banco de dados...');
  
  try {
    // Limpar em ordem reversa das dependências
    console.log('   🗑️ Limpando tabela concluidas...');
    const { error: errorConcluidas } = await supabase
      .from('concluidas')
      .delete()
      .gte('id_tarefa', 1); // Deleta tudo onde id_tarefa >= 1
    
    if (errorConcluidas) {
      console.log('   ⚠️ Aviso ao limpar concluidas:', errorConcluidas.message);
    } else {
      console.log('   ✅ Concluidas limpas');
    }
    
    console.log('   🗑️ Limpando tabela em_andamento...');
    const { error: errorAndamento } = await supabase
      .from('em_andamento')
      .delete()
      .gte('id_tarefa', 1);
    
    if (errorAndamento) {
      console.log('   ⚠️ Aviso ao limpar em_andamento:', errorAndamento.message);
    } else {
      console.log('   ✅ Em andamento limpas');
    }
    
    console.log('   🗑️ Limpando tabela tarefas...');
    const { error: errorTarefas } = await supabase
      .from('tarefas')
      .delete()
      .gte('id_tarefa', 1);
    
    if (errorTarefas) {
      console.log('   ⚠️ Aviso ao limpar tarefas:', errorTarefas.message);
    } else {
      console.log('   ✅ Tarefas limpas');
    }
    
    console.log('✅ Banco limpo com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error.message);
    throw error;
  }
}

async function inserirTarefas(tarefas) {
  console.log(`\n📥 Inserindo ${tarefas.length} tarefas no banco...`);
  
  try {
    // Inserir tarefas em lotes de 50 para evitar timeouts
    const loteSize = 50;
    let totalInseridas = 0;
    
    for (let i = 0; i < tarefas.length; i += loteSize) {
      const lote = tarefas.slice(i, i + loteSize);
      
      console.log(`   📦 Inserindo lote ${Math.floor(i/loteSize) + 1}/${Math.ceil(tarefas.length/loteSize)} (${lote.length} tarefas)...`);
      
      // Preparar dados para inserção
      const dadosParaInserir = lote.map(tarefa => ({
        tarefa: tarefa.tarefa || 'Tarefa sem título',
        descricao: tarefa.descricao || '',
        responsavel: tarefa.responsavel || 'JEAN',
        status: tarefa.status || 'A REALIZAR',
        prioridade: tarefa.prioridade || 'NORMAL',
        setor: tarefa.setor || 'CONTROLADORIA',
        mes: tarefa.mes || 'JUNHO',
        repetir: tarefa.repetir || 'NÃO',
        data_criacao: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('tarefas')
        .insert(dadosParaInserir)
        .select('id_tarefa, status');
      
      if (error) {
        console.error('❌ Erro ao inserir lote:', error.message);
        console.error('Detalhes:', error);
        continue; // Pular este lote e continuar
      }
      
      totalInseridas += data.length;
      console.log(`   ✅ Lote inserido! (${data.length} tarefas)`);
      
      // Processar tarefas conforme status
      await processarStatusTarefas(data, lote);
    }
    
    console.log(`✅ Total inserido: ${totalInseridas} tarefas!`);
    
  } catch (error) {
    console.error('❌ Erro ao inserir tarefas:', error.message);
    console.error('Detalhes:', error);
  }
}

async function processarStatusTarefas(tarefasInseridas, dadosOriginais) {
  // Processar tarefas EM ANDAMENTO e CONCLUIDAS
  const tarefasEmAndamento = [];
  const tarefasConcluidas = [];
  
  tarefasInseridas.forEach((tarefa, index) => {
    const dadoOriginal = dadosOriginais[index];
    
    if (tarefa.status === 'EM ANDAMENTO') {
      tarefasEmAndamento.push({
        id_tarefa: tarefa.id_tarefa,
        observacoes: dadoOriginal.observacoes || ''
      });
    } else if (tarefa.status === 'CONCLUIDA') {
      tarefasConcluidas.push({
        id_tarefa: tarefa.id_tarefa,
        observacoes: dadoOriginal.observacoes || '',
        data_conclusao: new Date().toISOString(),
        dias_para_conclusao: 1 // Valor padrão
      });
    }
  });
  
  // Inserir em em_andamento
  if (tarefasEmAndamento.length > 0) {
    console.log(`     🔄 Inserindo ${tarefasEmAndamento.length} tarefas em andamento...`);
    const { error } = await supabase
      .from('em_andamento')
      .insert(tarefasEmAndamento);
    
    if (error) {
      console.error('     ❌ Erro ao inserir em_andamento:', error.message);
    } else {
      console.log('     ✅ Tarefas em andamento inseridas!');
    }
  }
  
  // Inserir em concluidas
  if (tarefasConcluidas.length > 0) {
    console.log(`     ✅ Inserindo ${tarefasConcluidas.length} tarefas concluídas...`);
    const { error } = await supabase
      .from('concluidas')
      .insert(tarefasConcluidas);
    
    if (error) {
      console.error('     ❌ Erro ao inserir concluidas:', error.message);
    } else {
      console.log('     ✅ Tarefas concluídas inseridas!');
    }
  }
}

async function verificarResultados() {
  console.log('\n📊 Verificando resultados da migração...');
  
  try {
    // Contar tarefas por status
    const { data: tarefas, error: errorTarefas } = await supabase
      .from('tarefas')
      .select('status, responsavel, prioridade')
      .order('id_tarefa');
    
    if (errorTarefas) {
      console.error('❌ Erro ao verificar tarefas:', errorTarefas.message);
      return;
    }
    
    // Estatísticas
    const totalTarefas = tarefas.length;
    
    const porStatus = tarefas.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    
    const porResponsavel = tarefas.reduce((acc, t) => {
      acc[t.responsavel] = (acc[t.responsavel] || 0) + 1;
      return acc;
    }, {});
    
    const porPrioridade = tarefas.reduce((acc, t) => {
      acc[t.prioridade] = (acc[t.prioridade] || 0) + 1;
      return acc;
    }, {});
    
    console.log('─'.repeat(50));
    console.log(`📈 RESULTADOS DA MIGRAÇÃO:`);
    console.log(`   📊 Total de tarefas: ${totalTarefas}`);
    console.log(`   📋 Por Status:`, porStatus);
    console.log(`   👥 Por Responsável:`, porResponsavel);
    console.log(`   🎯 Por Prioridade:`, porPrioridade);
    console.log('─'.repeat(50));
    
    // Verificar tabelas relacionadas
    const { data: emAndamento, count: countAndamento } = await supabase
      .from('em_andamento')
      .select('*', { count: 'exact', head: true });
    
    const { data: concluidas, count: countConcluidas } = await supabase
      .from('concluidas')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   🔄 Tarefas em andamento: ${countAndamento || 0}`);
    console.log(`   ✅ Tarefas concluídas: ${countConcluidas || 0}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar resultados:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando migração para Supabase...\n');
  
  try {
    // 1. Verificar conectividade
    console.log('🔗 Testando conexão com Supabase...');
    const { data, error } = await supabase
      .from('tarefas')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro de conexão:', error.message);
      console.error('Detalhes:', error);
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // 2. Ler dados preparados
    console.log('\n📖 Lendo dados preparados...');
    
    if (!fs.existsSync('dados_excel_preparados.json')) {
      console.error('❌ Arquivo dados_excel_preparados.json não encontrado!');
      console.log('💡 Execute primeiro: node migrar_excel_mcp.js');
      return;
    }
    
    const dadosPreparados = JSON.parse(fs.readFileSync('dados_excel_preparados.json', 'utf8'));
    const tarefas = dadosPreparados.tarefas;
    
    console.log(`📋 ${tarefas.length} tarefas carregadas do arquivo JSON`);
    
    // 3. Limpar banco
    await limparBanco();
    
    // 4. Inserir dados
    await inserirTarefas(tarefas);
    
    // 5. Verificar resultados
    await verificarResultados();
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('🌐 Acesse o sistema em: http://localhost:3001');
    
  } catch (error) {
    console.error('\n💥 Erro na migração:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, limparBanco, inserirTarefas }; 