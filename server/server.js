// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carregar .env sempre em desenvolvimento, no Vercel as variáveis são definidas no painel
const envPath = path.join(__dirname, '..', '.env');
console.log('🔧 Tentando carregar .env de:', envPath);
console.log('🔧 Arquivo .env existe?', require('fs').existsSync(envPath));

const dotenvResult = require('dotenv').config({ path: envPath });
console.log('🔧 Resultado do dotenv:', dotenvResult.error ? `ERRO: ${dotenvResult.error}` : 'SUCESSO');
console.log('🔧 Variáveis carregadas:', dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : 'NENHUMA');

// 🔥 Confirmação de arquivo correto
console.log('🚀 Iniciando SERVIDOR UNIFICADO com SUPABASE em', __filename);
console.log('🔧 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🔧 Diretório atual:', __dirname);

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// ───────────────────────────────────────────────────────────────
// Servir arquivos estáticos do React (build)
// ───────────────────────────────────────────────────────────────
const buildPath = path.join(__dirname, '..', 'build');
const publicPath = path.join(__dirname, '..', 'public');

// No Vercel, sempre servir do build se estiver em produção
if (process.env.NODE_ENV === 'production') {
  console.log('📁 PRODUÇÃO: Servindo arquivos do build React');
  app.use(express.static(buildPath));
} else {
  // Em desenvolvimento local, verificar se build existe
  if (fs.existsSync(buildPath)) {
    console.log('📁 Servindo arquivos do build React:', buildPath);
    app.use(express.static(buildPath));
  } else {
    console.log('📁 Build não encontrado, servindo arquivos públicos:', publicPath);
    app.use(express.static(publicPath));
  }
}

// ───────────────────────────────────────────────────────────────
// Configuração do Supabase
// ───────────────────────────────────────────────────────────────
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 Verificando variáveis de ambiente...');
console.log('URL:', process.env.REACT_APP_SUPABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('Anon Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('Todas as env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));

if (!supabaseUrl) {
  console.error('❌ REACT_APP_SUPABASE_URL não encontrada!');
  process.exit(1);
}

// Usar Service Key se disponível, senão usar Anon Key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const keyType = supabaseServiceKey ? 'SERVICE_ROLE' : 'ANON';

if (!supabaseKey) {
  console.error('❌ Nenhuma chave do Supabase encontrada!');
  console.error('Certifique-se de que SUPABASE_SERVICE_ROLE_KEY ou REACT_APP_SUPABASE_ANON_KEY estão definidas no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log(`✅ Cliente Supabase configurado com ${keyType} key!`);

if (keyType === 'ANON') {
  console.log('⚠️  Usando ANON key - algumas operações podem ter permissões limitadas');
  console.log('💡 Para funcionalidade completa, adicione SUPABASE_SERVICE_ROLE_KEY ao .env');
}

// ───────────────────────────────────────────────────────────────
// Rotas da API
// ───────────────────────────────────────────────────────────────

// 0) Teste de conexão
app.get('/api/test-db', async (_, res) => {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return res.json({ 
      status: 'success',
      message: 'Conectado ao Supabase!',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erro /api/test-db:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 1) Listar "A REALIZAR"
app.get('/api/tarefas', async (_, res) => {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('status', 'A REALIZAR')
      .order('id_tarefa');

    if (error) throw error;

    const formattedData = data.map(r => ({
      id_tarefa:    r.id_tarefa,
      data_criacao: r.data_criacao,
      tarefa:       r.tarefa,
      descricao:    r.descricao,
      status:       r.status,
      responsavel:  r.responsavel,
      repetir:      r.repetir,
      prioridade:   r.prioridade,
      mes:          r.mes,
      setor:        r.setor,
      reabrir:      'REABRIR'
    }));

    return res.json(formattedData);
  } catch (err) {
    console.error('Erro /api/tarefas:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2) Listar "EM ANDAMENTO"
app.get('/api/em-andamento', async (_, res) => {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select(`
        *,
        em_andamento!left(observacoes)
      `)
      .eq('status', 'EM ANDAMENTO')
      .order('id_tarefa');

    if (error) throw error;

    const formattedData = data.map(r => ({
      id_tarefa:    r.id_tarefa,
      data_criacao: r.data_criacao,
      tarefa:       r.tarefa,
      descricao:    r.descricao,
      status:       r.status,
      responsavel:  r.responsavel,
      repetir:      r.repetir,
      prioridade:   r.prioridade,
      mes:          r.mes,
      setor:        r.setor,
      observacoes:  r.em_andamento?.[0]?.observacoes || '',
      acao:         'CONCLUIR'
    }));

    return res.json(formattedData);
  } catch (err) {
    console.error('Erro /api/em-andamento:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3) Criar ou Editar tarefa
app.post('/api/tarefas', async (req, res) => {
  const {
    id_tarefa_para_atualizar,
    tarefa, descricao, responsavel,
    repetir, prioridade, mes, setor
  } = req.body;

  try {
    if (id_tarefa_para_atualizar) {
      // UPDATE
      const { error } = await supabase
        .from('tarefas')
        .update({
          tarefa,
          descricao,
          responsavel,
          repetir,
          prioridade,
          mes,
          setor
        })
        .eq('id_tarefa', id_tarefa_para_atualizar);

      if (error) throw error;
    } else {
      // INSERT
      const { error } = await supabase
        .from('tarefas')
        .insert({
          data_criacao: new Date().toISOString(),
          tarefa,
          descricao,
          status: 'A REALIZAR',
          responsavel,
          repetir,
          prioridade,
          mes,
          setor
        });

      if (error) throw error;
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro POST /api/tarefas:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4) Mover para "EM ANDAMENTO"
app.post('/api/tarefas/mover-para-andamento', async (req, res) => {
  const { id_tarefa } = req.body;
  
  try {
    // Atualizar status da tarefa
    const { error: updateError } = await supabase
      .from('tarefas')
      .update({ status: 'EM ANDAMENTO' })
      .eq('id_tarefa', id_tarefa);

    if (updateError) throw updateError;

    // Inserir na tabela em_andamento
    const { error: insertError } = await supabase
      .from('em_andamento')
      .upsert({ id_tarefa }, { onConflict: 'id_tarefa' });

    if (insertError) throw insertError;

    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro POST /api/tarefas/mover-para-andamento:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5) Listar "CONCLUÍDAS"
app.get('/api/concluidas', async (_, res) => {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select(`
        *,
        concluidas!left(observacoes, data_conclusao, dias_para_conclusao)
      `)
      .eq('status', 'CONCLUIDA')
      .order('id_tarefa');

    if (error) throw error;

    const formattedData = data.map(r => ({
      id_tarefa:           r.id_tarefa,
      data_criacao:        r.data_criacao,
      tarefa:              r.tarefa,
      descricao:           r.descricao,
      status:              r.status,
      responsavel:         r.responsavel,
      repetir:             r.repetir,
      prioridade:          r.prioridade,
      mes:                 r.mes,
      setor:               r.setor,
      observacoes:         r.concluidas?.[0]?.observacoes || '',
      data_conclusao:      r.concluidas?.[0]?.data_conclusao || '',
      dias_para_conclusao: r.concluidas?.[0]?.dias_para_conclusao || 0
    }));

    return res.json(formattedData);
  } catch (err) {
    console.error('Erro /api/concluidas:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 6) Mover para "CONCLUÍDAS"
app.post('/api/tarefas/mover-para-concluidas', async (req, res) => {
  const { id_tarefa, observacoes = '' } = req.body;
  
  try {
    // Buscar data de criação da tarefa
    const { data: tarefaData, error: selectError } = await supabase
      .from('tarefas')
      .select('data_criacao')
      .eq('id_tarefa', id_tarefa)
      .single();

    if (selectError) throw selectError;

    // Calcular dias para conclusão
    const dataCriacao = new Date(tarefaData.data_criacao);
    const dataAtual = new Date();
    const diasParaConclusao = Math.floor((dataAtual - dataCriacao) / (1000 * 60 * 60 * 24));

    // Atualizar status da tarefa
    const { error: updateError } = await supabase
      .from('tarefas')
      .update({ status: 'CONCLUIDA' })
      .eq('id_tarefa', id_tarefa);

    if (updateError) throw updateError;

    // Inserir na tabela concluidas
    const { error: insertError } = await supabase
      .from('concluidas')
      .upsert({
        id_tarefa,
        observacoes,
        data_conclusao: new Date().toISOString(),
        dias_para_conclusao: diasParaConclusao
      }, { onConflict: 'id_tarefa' });

    if (insertError) throw insertError;

    // Remover da tabela em_andamento
    const { error: deleteError } = await supabase
      .from('em_andamento')
      .delete()
      .eq('id_tarefa', id_tarefa);

    if (deleteError) throw deleteError;

    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro POST /api/tarefas/mover-para-concluidas:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 7) Atualizar observações em "EM ANDAMENTO"
app.put('/api/em-andamento/:id/observacoes', async (req, res) => {
  const { id } = req.params;
  const { observacoes } = req.body;
  
  try {
    const { error } = await supabase
      .from('em_andamento')
      .upsert({
        id_tarefa: parseInt(id),
        observacoes
      }, { onConflict: 'id_tarefa' });

    if (error) throw error;

    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro PUT /api/em-andamento/:id/observacoes:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 8) Excluir tarefa
app.delete('/api/tarefas/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const idTarefa = parseInt(id);
    
    // Excluir da tabela tarefas
    const { error: errorTarefas } = await supabase
      .from('tarefas')
      .delete()
      .eq('id_tarefa', idTarefa);
    
    if (errorTarefas) throw errorTarefas;
    
    // Excluir da tabela em_andamento (se existir)
    const { error: errorEmAndamento } = await supabase
      .from('em_andamento')
      .delete()
      .eq('id_tarefa', idTarefa);
    
    // Não lançar erro se não existir em em_andamento
    if (errorEmAndamento && !errorEmAndamento.message.includes('No rows found')) {
      throw errorEmAndamento;
    }
    
    // Excluir da tabela concluidas (se existir)
    const { error: errorConcluidas } = await supabase
      .from('concluidas')
      .delete()
      .eq('id_tarefa', idTarefa);
    
    // Não lançar erro se não existir em concluidas
    if (errorConcluidas && !errorConcluidas.message.includes('No rows found')) {
      throw errorConcluidas;
    }
    
    console.log(`✅ Tarefa ${idTarefa} excluída com sucesso de todas as tabelas`);
    return res.json({ 
      ok: true, 
      message: `Tarefa ${idTarefa} excluída com sucesso` 
    });
    
  } catch (err) {
    console.error('Erro DELETE /api/tarefas/:id:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ───────────────────────────────────────────────────────────────
// Catch-all handler: envia de volta o React app
// ───────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // No Vercel, sempre servir do build
    const indexPath = path.join(buildPath, 'index.html');
    res.sendFile(indexPath);
  } else {
    // Em desenvolvimento, verificar se existe
    const indexPath = fs.existsSync(buildPath) 
      ? path.join(buildPath, 'index.html')
      : path.join(publicPath, 'index.html');
      
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Arquivo index.html não encontrado. Execute npm run build primeiro.');
    }
  }
});

// ───────────────────────────────────────────────────────────────
// Inicia o servidor (apenas em desenvolvimento local)
// ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🌐 Servidor unificado com Supabase rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🔗 API disponível em: http://localhost:${PORT}/api/`);
    console.log(`🗄️  Banco de dados: Supabase Cloud`);
  });
}

// ───────────────────────────────────────────────────────────────
// Exportar para Vercel (produção)
// ───────────────────────────────────────────────────────────────
module.exports = app;