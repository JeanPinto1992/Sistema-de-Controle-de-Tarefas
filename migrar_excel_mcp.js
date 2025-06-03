const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Função para ler o arquivo Excel
function lerArquivoExcel() {
  console.log('📄 Lendo arquivo CONTROLADORIA.xlsm...');
  
  const arquivoExcel = path.join(__dirname, 'CONTROLADORIA.xlsm');
  
  if (!fs.existsSync(arquivoExcel)) {
    console.error('❌ Arquivo CONTROLADORIA.xlsm não encontrado!');
    return null;
  }
  
  try {
    // Ler o arquivo Excel
    const workbook = XLSX.readFile(arquivoExcel);
    
    console.log('📋 Planilhas encontradas:', workbook.SheetNames);
    
    // Vamos processar todas as planilhas e procurar dados de tarefas
    const dadosExtraidos = [];
    
    workbook.SheetNames.forEach(nomeSheet => {
      console.log(`\n🔍 Processando planilha: ${nomeSheet}`);
      
      const sheet = workbook.Sheets[nomeSheet];
      const dados = XLSX.utils.sheet_to_json(sheet, { 
        header: 1,
        defval: '',
        raw: false 
      });
      
      console.log(`   📊 ${dados.length} linhas encontradas`);
      
      // Procurar cabeçalhos que indiquem tarefas
      if (dados.length > 0) {
        const cabecalho = dados[0];
        console.log('   📝 Cabeçalhos:', cabecalho);
        
        // Verificar se tem colunas relacionadas a tarefas
        const colunasRelevantes = cabecalho.filter(col => 
          typeof col === 'string' && (
            col.toLowerCase().includes('tarefa') ||
            col.toLowerCase().includes('descrição') ||
            col.toLowerCase().includes('responsavel') ||
            col.toLowerCase().includes('status') ||
            col.toLowerCase().includes('prioridade') ||
            col.toLowerCase().includes('setor')
          )
        );
        
        if (colunasRelevantes.length > 0) {
          console.log('   ✅ Planilha relevante encontrada!');
          console.log('   🎯 Colunas relevantes:', colunasRelevantes);
          
          dadosExtraidos.push({
            nomeSheet,
            cabecalho,
            dados: dados.slice(1), // Remove cabeçalho
            colunasRelevantes
          });
        }
      }
    });
    
    return dadosExtraidos;
    
  } catch (error) {
    console.error('❌ Erro ao ler arquivo Excel:', error.message);
    return null;
  }
}

// Função para mapear dados do Excel para formato das tarefas
function mapearDadosParaTarefas(dadosExcel) {
  console.log('\n🔄 Mapeando dados do Excel para formato de tarefas...');
  
  const tarefasMapeadas = [];
  
  dadosExcel.forEach(planilha => {
    console.log(`\n📋 Processando planilha: ${planilha.nomeSheet}`);
    
    const cabecalho = planilha.cabecalho;
    
    // Tentar identificar colunas automaticamente
    const indiceColunas = {
      tarefa: encontrarIndiceColuna(cabecalho, ['tarefa', 'task', 'atividade', 'descrição']),
      descricao: encontrarIndiceColuna(cabecalho, ['descrição', 'description', 'detalhes', 'observação']),
      responsavel: encontrarIndiceColuna(cabecalho, ['responsável', 'responsavel', 'responsible', 'pessoa']),
      status: encontrarIndiceColuna(cabecalho, ['status', 'situação', 'estado']),
      prioridade: encontrarIndiceColuna(cabecalho, ['prioridade', 'priority', 'urgência']),
      setor: encontrarIndiceColuna(cabecalho, ['setor', 'departamento', 'área', 'sector'])
    };
    
    console.log('   🎯 Mapeamento de colunas:', indiceColunas);
    
    planilha.dados.forEach((linha, index) => {
      if (linha.length > 0 && linha.some(cell => cell && cell.toString().trim() !== '')) {
        
        const tarefa = {
          tarefa: obterValorColuna(linha, indiceColunas.tarefa) || `Tarefa ${index + 1}`,
          descricao: obterValorColuna(linha, indiceColunas.descricao) || '',
          responsavel: normalizarResponsavel(obterValorColuna(linha, indiceColunas.responsavel)),
          status: normalizarStatus(obterValorColuna(linha, indiceColunas.status)),
          prioridade: normalizarPrioridade(obterValorColuna(linha, indiceColunas.prioridade)),
          setor: obterValorColuna(linha, indiceColunas.setor) || 'CONTROLADORIA',
          mes: obterMesAtual(),
          repetir: 'NÃO'
        };
        
        // Só adicionar se tem tarefa válida
        if (tarefa.tarefa && tarefa.tarefa.trim() !== '') {
          tarefasMapeadas.push(tarefa);
        }
      }
    });
  });
  
  console.log(`\n✅ Total de ${tarefasMapeadas.length} tarefas mapeadas`);
  return tarefasMapeadas;
}

// Funções auxiliares
function encontrarIndiceColuna(cabecalho, palavrasChave) {
  for (let i = 0; i < cabecalho.length; i++) {
    const coluna = cabecalho[i];
    if (typeof coluna === 'string') {
      const colunaLower = coluna.toLowerCase();
      if (palavrasChave.some(palavra => colunaLower.includes(palavra.toLowerCase()))) {
        return i;
      }
    }
  }
  return -1;
}

function obterValorColuna(linha, indice) {
  if (indice >= 0 && indice < linha.length) {
    const valor = linha[indice];
    return valor ? valor.toString().trim() : '';
  }
  return '';
}

function normalizarResponsavel(valor) {
  if (!valor) return 'JEAN';
  
  const valorLower = valor.toLowerCase();
  if (valorLower.includes('jean')) return 'JEAN';
  if (valorLower.includes('ivana')) return 'IVANA';
  
  return 'JEAN'; // padrão
}

function normalizarStatus(valor) {
  if (!valor) return 'A REALIZAR';
  
  const valorLower = valor.toLowerCase();
  if (valorLower.includes('andamento') || valorLower.includes('execução')) return 'EM ANDAMENTO';
  if (valorLower.includes('concluí') || valorLower.includes('finaliz')) return 'CONCLUIDA';
  
  return 'A REALIZAR'; // padrão
}

function normalizarPrioridade(valor) {
  if (!valor) return 'NORMAL';
  
  const valorLower = valor.toLowerCase();
  if (valorLower.includes('alta') || valorLower.includes('urgent')) return 'ALTA';
  if (valorLower.includes('baixa') || valorLower.includes('low')) return 'BAIXA';
  
  return 'NORMAL'; // padrão
}

function obterMesAtual() {
  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  return meses[new Date().getMonth()];
}

// Função principal
function main() {
  console.log('🚀 Iniciando migração do Excel para Supabase...\n');
  
  // 1. Ler arquivo Excel
  const dadosExcel = lerArquivoExcel();
  
  if (!dadosExcel || dadosExcel.length === 0) {
    console.log('❌ Nenhum dado relevante encontrado no Excel');
    return;
  }
  
  // 2. Mapear dados
  const tarefas = mapearDadosParaTarefas(dadosExcel);
  
  if (tarefas.length === 0) {
    console.log('❌ Nenhuma tarefa válida encontrada após mapeamento');
    return;
  }
  
  // 3. Salvar dados preparados em arquivo JSON para uso com MCP
  const arquivoSaida = 'dados_excel_preparados.json';
  
  const dadosPreparados = {
    metadata: {
      dataExtracao: new Date().toISOString(),
      totalTarefas: tarefas.length,
      fonte: 'CONTROLADORIA.xlsm'
    },
    tarefas: tarefas
  };
  
  fs.writeFileSync(arquivoSaida, JSON.stringify(dadosPreparados, null, 2), 'utf8');
  
  console.log(`\n✅ Dados preparados salvos em: ${arquivoSaida}`);
  console.log(`📊 Total de tarefas extraídas: ${tarefas.length}`);
  
  // 4. Mostrar resumo
  console.log('\n📋 RESUMO DOS DADOS EXTRAÍDOS:');
  console.log('─'.repeat(50));
  
  const resumoPorResponsavel = tarefas.reduce((acc, tarefa) => {
    acc[tarefa.responsavel] = (acc[tarefa.responsavel] || 0) + 1;
    return acc;
  }, {});
  
  const resumoPorStatus = tarefas.reduce((acc, tarefa) => {
    acc[tarefa.status] = (acc[tarefa.status] || 0) + 1;
    return acc;
  }, {});
  
  const resumoPorPrioridade = tarefas.reduce((acc, tarefa) => {
    acc[tarefa.prioridade] = (acc[tarefa.prioridade] || 0) + 1;
    return acc;
  }, {});
  
  console.log('👥 Por Responsável:', resumoPorResponsavel);
  console.log('📊 Por Status:', resumoPorStatus);
  console.log('🎯 Por Prioridade:', resumoPorPrioridade);
  
  console.log('\n🎯 Agora use as funções MCP do Supabase para inserir estes dados!');
  console.log('💡 Execute o script de inserção MCP separadamente.');
  
  return dadosPreparados;
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, lerArquivoExcel, mapearDadosParaTarefas }; 