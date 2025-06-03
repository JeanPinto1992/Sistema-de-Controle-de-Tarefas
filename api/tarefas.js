const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do PostgreSQL - Use Environment Variables no Vercel!
let dbPassword = process.env.PGPASSWORD || 'postgres'; // Prefer Environment Variable
const senhaFile = path.join(__dirname, '..\/backend\/SENHA POSTGREE.txt'); // Caminho ajustado

// Apenas para desenvolvimento local ou teste inicial de migração
// Em produção no Vercel, use Environment Variables.
if (!process.env.PGPASSWORD && fs.existsSync(senhaFile)) {
  try {
    dbPassword = fs.readFileSync(senhaFile, 'latin1').trim();
  } catch (error) {
    console.error('Erro ao ler SENHA POSTGREE.txt:', error);
  }
}

const pool = new Pool({
  user:     process.env.PGUSER || 'postgres', // Prefer Environment Variable
  host:     process.env.PGHOST || 'localhost', // Prefer Environment Variable
  database: process.env.PGDATABASE || 'controle_tarefas', // Prefer Environment Variable
  password: dbPassword,
  port:     process.env.PGPORT || 5432, // Prefer Environment Variable
});

// 🔥 Estrutura da Vercel Function para o endpoint /api/tarefas
module.exports = async (req, res) => {
  // Verifica o método HTTP da requisição
  if (req.method === 'GET') {
    // Lógica para Listar "A REALIZAR"
    try {
      const { rows } = await pool.query(
        "SELECT * FROM tarefas WHERE status = 'A REALIZAR' ORDER BY id_tarefa"
      );
      // Em Vercel Functions, você não precisa do return extra antes do res.json/res.status
      res.status(200).json(rows);
    } catch (err) {
      console.error('Erro GET /api/tarefas:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'POST') {
    // Lógica para Criar ou Editar tarefa
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
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Erro POST /api/tarefas:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    // Método não permitido para esta função
    res.status(405).json({ error: 'Método não permitido.' });
  }
}; 