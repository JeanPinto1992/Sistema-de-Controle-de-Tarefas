const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://xdwypvfgaatcfxpjygub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODA2ODUsImV4cCI6MjA2NDU1NjY4NX0.FN8h5tT77tOPyPtjs1hVysj3HXT9Q6P5qqnmM1aAPxM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnosticoObservacoes() {
  try {
    console.log('🔍 DIAGNÓSTICO DAS OBSERVAÇÕES\n');
    
    // 1. Verificar tarefas concluídas
    console.log('1️⃣ VERIFICANDO TAREFAS CONCLUÍDAS:');
    const { data: concluidas, error: errorConcluidas } = await supabase
      .from('concluidas')
      .select('id_tarefa, observacoes')
      .order('id_tarefa');
    
    if (errorConcluidas) {
      console.error('❌ Erro ao buscar concluídas:', errorConcluidas);
      return;
    }
    
    console.log(`📊 Total de tarefas concluídas: ${concluidas.length}`);
    concluidas.forEach(tarefa => {
      const temObs = tarefa.observacoes && tarefa.observacoes.trim() !== '';
      console.log(`   Tarefa ${tarefa.id_tarefa}: ${temObs ? '✅ TEM observação' : '❌ SEM observação'}`);
      if (temObs) {
        console.log(`      "${tarefa.observacoes.substring(0, 50)}${tarefa.observacoes.length > 50 ? '...' : ''}"`);
      }
    });
    
    // 2. Verificar tarefas em andamento
    console.log('\n2️⃣ VERIFICANDO TAREFAS EM ANDAMENTO:');
    const { data: emAndamento, error: errorAndamento } = await supabase
      .from('em_andamento')
      .select('id_tarefa, observacoes')
      .order('id_tarefa');
    
    if (errorAndamento) {
      console.error('❌ Erro ao buscar em andamento:', errorAndamento);
      return;
    }
    
    console.log(`📊 Total de tarefas em andamento: ${emAndamento.length}`);
    emAndamento.forEach(tarefa => {
      const temObs = tarefa.observacoes && tarefa.observacoes.trim() !== '';
      console.log(`   Tarefa ${tarefa.id_tarefa}: ${temObs ? '✅ TEM observação' : '❌ SEM observação'}`);
      if (temObs) {
        console.log(`      "${tarefa.observacoes.substring(0, 50)}${tarefa.observacoes.length > 50 ? '...' : ''}"`);
      }
    });
    
    // 3. Verificar status das tarefas na tabela principal
    console.log('\n3️⃣ VERIFICANDO STATUS DAS TAREFAS:');
    const { data: todasTarefas, error: errorTarefas } = await supabase
      .from('tarefas')
      .select('id_tarefa, status, tarefa')
      .order('id_tarefa');
    
    if (errorTarefas) {
      console.error('❌ Erro ao buscar tarefas:', errorTarefas);
      return;
    }
    
    const statusCount = {};
    todasTarefas.forEach(tarefa => {
      statusCount[tarefa.status] = (statusCount[tarefa.status] || 0) + 1;
      if (tarefa.status === 'CONCLUIDA') {
        console.log(`   Tarefa ${tarefa.id_tarefa}: ${tarefa.status} - "${tarefa.tarefa.substring(0, 30)}..."`);
      }
    });
    
    console.log('\n📊 RESUMO POR STATUS:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} tarefas`);
    });
    
    // 4. Buscar possíveis observações órfãs
    console.log('\n4️⃣ BUSCANDO OBSERVAÇÕES ÓRFÃS:');
    const idsConcluidasSet = new Set(concluidas.map(t => t.id_tarefa));
    const observacoesOrfas = emAndamento.filter(t => 
      idsConcluidasSet.has(t.id_tarefa) && 
      t.observacoes && 
      t.observacoes.trim() !== ''
    );
    
    console.log(`📊 Observações órfãs encontradas: ${observacoesOrfas.length}`);
    observacoesOrfas.forEach(tarefa => {
      console.log(`   Tarefa ${tarefa.id_tarefa}: "${tarefa.observacoes.substring(0, 50)}..."`);
    });
    
    if (observacoesOrfas.length > 0) {
      console.log('\n🔧 CORRIGINDO OBSERVAÇÕES ÓRFÃS...');
      for (const tarefa of observacoesOrfas) {
        const { error: updateError } = await supabase
          .from('concluidas')
          .update({ observacoes: tarefa.observacoes })
          .eq('id_tarefa', tarefa.id_tarefa);
        
        if (updateError) {
          console.error(`❌ Erro ao corrigir tarefa ${tarefa.id_tarefa}:`, updateError);
        } else {
          console.log(`✅ Observação corrigida para tarefa ${tarefa.id_tarefa}`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar o diagnóstico
diagnosticoObservacoes();