const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://xdwypvfgaatcfxpjygub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODA2ODUsImV4cCI6MjA2NDU1NjY4NX0.FN8h5tT77tOPyPtjs1hVysj3HXT9Q6P5qqnmM1aAPxM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function recuperarObservacoes() {
  try {
    console.log('🔍 Buscando tarefas concluídas sem observações...');
    
    // 1. Buscar tarefas concluídas que não têm observações
    const { data: tarefasConcluidas, error: errorConcluidas } = await supabase
      .from('concluidas')
      .select('id_tarefa, observacoes')
      .or('observacoes.is.null,observacoes.eq.');
    
    if (errorConcluidas) {
      console.error('❌ Erro ao buscar tarefas concluídas:', errorConcluidas);
      return;
    }
    
    console.log(`📊 Encontradas ${tarefasConcluidas.length} tarefas concluídas sem observações`);
    
    if (tarefasConcluidas.length === 0) {
      console.log('✅ Todas as tarefas concluídas já possuem observações!');
      return;
    }
    
    // 2. Para cada tarefa, buscar observações na tabela em_andamento
    let atualizadas = 0;
    
    for (const tarefa of tarefasConcluidas) {
      console.log(`🔍 Verificando tarefa ${tarefa.id_tarefa}...`);
      
      // Buscar observações na tabela em_andamento
      const { data: observacaoData, error: errorObs } = await supabase
        .from('em_andamento')
        .select('observacoes')
        .eq('id_tarefa', tarefa.id_tarefa)
        .single();
      
      if (errorObs && errorObs.code !== 'PGRST116') { // PGRST116 = não encontrado
        console.error(`❌ Erro ao buscar observação da tarefa ${tarefa.id_tarefa}:`, errorObs);
        continue;
      }
      
      if (observacaoData && observacaoData.observacoes && observacaoData.observacoes.trim() !== '') {
        console.log(`📝 Encontrada observação para tarefa ${tarefa.id_tarefa}: "${observacaoData.observacoes.substring(0, 50)}..."`);
        
        // Atualizar a tabela concluidas com a observação
        const { error: updateError } = await supabase
          .from('concluidas')
          .update({ observacoes: observacaoData.observacoes })
          .eq('id_tarefa', tarefa.id_tarefa);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar observação da tarefa ${tarefa.id_tarefa}:`, updateError);
        } else {
          console.log(`✅ Observação atualizada para tarefa ${tarefa.id_tarefa}`);
          atualizadas++;
        }
      } else {
        console.log(`ℹ️ Nenhuma observação encontrada para tarefa ${tarefa.id_tarefa}`);
      }
    }
    
    console.log(`\n🎉 Processo concluído! ${atualizadas} observações foram recuperadas e atualizadas.`);
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar o script
recuperarObservacoes();