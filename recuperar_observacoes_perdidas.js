const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function recuperarObservacoesPerdidas() {
  try {
    console.log('🔍 RECUPERANDO OBSERVAÇÕES PERDIDAS...');
    
    // 1. Buscar TODAS as tarefas concluídas (sem observações)
    const { data: tarefasConcluidas, error: errorConcluidas } = await supabase
      .from('concluidas')
      .select('id_tarefa')
      .or('observacoes.is.null,observacoes.eq.');
    
    if (errorConcluidas) {
      console.error('❌ Erro ao buscar concluídas:', errorConcluidas);
      return;
    }
    
    console.log(`📊 Tarefas concluídas sem observações: ${tarefasConcluidas.length}`);
    
    // 2. Buscar TODAS as observações na tabela em_andamento
    const { data: todasObservacoes, error: errorObs } = await supabase
      .from('em_andamento')
      .select('id_tarefa, observacoes')
      .not('observacoes', 'is', null)
      .neq('observacoes', '');
    
    if (errorObs) {
      console.error('❌ Erro ao buscar observações:', errorObs);
      return;
    }
    
    console.log(`📝 Observações encontradas na tabela em_andamento: ${todasObservacoes.length}`);
    
    // 3. Criar mapa de observações por id_tarefa
    const mapaObservacoes = {};
    todasObservacoes.forEach(obs => {
      mapaObservacoes[obs.id_tarefa] = obs.observacoes;
    });
    
    // 4. Recuperar observações para tarefas concluídas
    let recuperadas = 0;
    
    for (const tarefa of tarefasConcluidas) {
      const observacao = mapaObservacoes[tarefa.id_tarefa];
      
      if (observacao && observacao.trim() !== '') {
        console.log(`🔄 Recuperando observação da tarefa ${tarefa.id_tarefa}...`);
        console.log(`   "${observacao.substring(0, 60)}${observacao.length > 60 ? '...' : ''}"`);;
        
        // Atualizar a tabela concluidas
        const { error: updateError } = await supabase
          .from('concluidas')
          .update({ observacoes: observacao })
          .eq('id_tarefa', tarefa.id_tarefa);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar tarefa ${tarefa.id_tarefa}:`, updateError);
        } else {
          console.log(`✅ Observação recuperada para tarefa ${tarefa.id_tarefa}`);
          recuperadas++;
        }
      }
    }
    
    console.log(`\n🎉 RECUPERAÇÃO CONCLUÍDA!`);
    console.log(`📊 Total de observações recuperadas: ${recuperadas}`);
    console.log(`📊 Tarefas que permaneceram sem observações: ${tarefasConcluidas.length - recuperadas}`);
    
    if (recuperadas > 0) {
      console.log(`\n✅ Agora as observações devem aparecer na aba "Concluídas"!`);
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar o script
recuperarObservacoesPerdidas();