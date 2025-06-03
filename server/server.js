// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 🔥 Confirmação de arquivo correto
console.log('🚀 Iniciando SERVIDOR UNIFICADO em', __filename);

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ───────────────────────────────────────────────────────────────
// Servir arquivos estáticos do React (build)
// ───────────────────────────────────────────────────────────────
const buildPath = path.join(__dirname, '..', 'build');
const publicPath = path.join(__dirname, '..', 'public');

// Verificar se o build existe, senão usar public para desenvolvimento
if (fs.existsSync(buildPath)) {
  console.log('📁 Servindo arquivos do build React:', buildPath);
  app.use(express.static(buildPath));
} else {
  console.log('📁 Build não encontrado, servindo arquivos públicos:', publicPath);
  app.use(express.static(publicPath));
}

// ───────────────────────────────────────────────────────────────
// Configuração do PostgreSQL
// ───────────────────────────────────────────────────────────────
let dbPassword = 'postgres';
const senhaFile = path.join(__dirname, 'SENHA POSTGREE.txt');
if (fs.existsSync(senhaFile)) {
  dbPassword = fs.readFileSync(senhaFile, 'latin1').trim();
}

const pool = new Pool({
  user:     'postgres',
  host:     'localhost',
  database: 'controle_tarefas',
  password: dbPassword,
  port:     5432,
});

pool.on('connect', () => console.log('✅ Conectado ao PostgreSQL!'));
pool.on('error', err => {
  console.error('❌ Pool error:', err);
  process.exit(-1);
});

// ───────────────────────────────────────────────────────────────
// Rotas da API
// ───────────────────────────────────────────────────────────────

// 0) Teste de conexão
app.get('/api/test-db', async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT now()');
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erro /api/test-db:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 1) Listar "A REALIZAR"
app.get('/api/tarefas', async (_, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tarefas WHERE status = 'A REALIZAR' ORDER BY id_tarefa"
    );
    const data = rows.map(r => ({
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
    return res.json(data);
  } catch (err) {
    console.error('Erro /api/tarefas:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2) Listar "EM ANDAMENTO"
app.get('/api/em-andamento', async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, e.observacoes
        FROM tarefas t
        LEFT JOIN em_andamento e USING (id_tarefa)
       WHERE t.status = 'EM ANDAMENTO'
       ORDER BY t.id_tarefa
    `);
    const data = rows.map(r => ({
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
      observacoes:  r.observacoes,
      acao:         'CONCLUIR'
    }));
    return res.json(data);
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
      await pool.query(`
        UPDATE tarefas
           SET tarefa      = $2,
               descricao   = $3,
               responsavel = $4,
               repetir     = $5,
               prioridade  = $6,
               mes         = $7,
               setor       = $8
         WHERE id_tarefa   = $1
      `, [
        id_tarefa_para_atualizar,
        tarefa, descricao, responsavel,
        repetir, prioridade, mes, setor
      ]);
    } else {
      // INSERT
      await pool.query(`
        INSERT INTO tarefas
          (data_criacao, tarefa, descricao, status,
           responsavel, repetir, prioridade, mes, setor)
        VALUES
          (now(), $1, $2, 'A REALIZAR', $3, $4, $5, $6, $7)
      `, [
        tarefa, descricao,
        responsavel, repetir,
        prioridade, mes, setor
      ]);
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
    await pool.query(`
      UPDATE tarefas
         SET status = 'EM ANDAMENTO'
       WHERE id_tarefa = $1
    `, [id_tarefa]);

    await pool.query(`
      INSERT INTO em_andamento (id_tarefa)
      VALUES ($1)
      ON CONFLICT (id_tarefa) DO NOTHING
    `, [id_tarefa]);

    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro POST /api/tarefas/mover-para-andamento:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5) Listar "CONCLUÍDAS"
app.get('/api/concluidas', async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*,
             c.observacoes,
             c.data_conclusao,
             c.dias_para_conclusao
        FROM tarefas t
        LEFT JOIN concluidas c USING (id_tarefa)
       WHERE t.status = 'CONCLUIDA'
       ORDER BY t.id_tarefa
    `);
    const data = rows.map(r => ({
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
      observacoes:         r.observacoes,
      data_conclusao:      r.data_conclusao,
      dias_para_conclusao: r.dias_para_conclusao
    }));
    return res.json(data);
  } catch (err) {
    console.error('Erro /api/concluidas:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 6) Mover para "CONCLUÍDAS"
app.post('/api/tarefas/mover-para-concluidas', async (req, res) => {
  const { id_tarefa, observacoes = '' } = req.body;
  try {
    // Atualiza status
    await pool.query(`
      UPDATE tarefas
         SET status = 'CONCLUIDA'
       WHERE id_tarefa = $1
    `, [id_tarefa]);

    // Insere/atualiza registro de conclusão
    await pool.query(`
      INSERT INTO concluidas
        (id_tarefa, observacoes, data_conclusao, dias_para_conclusao)
      SELECT
        t.id_tarefa,
        $2::text,
        now(),
        (now()::date - t.data_criacao::date)
      FROM tarefas t
     WHERE t.id_tarefa = $1
      ON CONFLICT (id_tarefa) DO UPDATE
        SET observacoes         = EXCLUDED.observacoes,
            data_conclusao      = EXCLUDED.data_conclusao,
            dias_para_conclusao = EXCLUDED.dias_para_conclusao
    `, [id_tarefa, observacoes]);

    // Remove da tabela em_andamento
    await pool.query(`
      DELETE FROM em_andamento
       WHERE id_tarefa = $1
    `, [id_tarefa]);

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
    await pool.query(`
      UPDATE em_andamento
         SET observacoes = $2
       WHERE id_tarefa   = $1
    `, [id, observacoes]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro PUT /api/em-andamento/:id/observacoes:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ───────────────────────────────────────────────────────────────
// Catch-all handler: envia de volta o React app
// ───────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = fs.existsSync(buildPath) 
    ? path.join(buildPath, 'index.html')
    : path.join(publicPath, 'index.html');
    
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Arquivo index.html não encontrado. Execute npm run build primeiro.');
  }
});

// ───────────────────────────────────────────────────────────────
// Inicia o servidor
// ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌐 Servidor unificado rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`🔗 API disponível em: http://localhost:${PORT}/api/`);
});
