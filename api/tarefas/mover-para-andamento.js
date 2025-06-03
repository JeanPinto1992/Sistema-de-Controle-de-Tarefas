const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do PostgreSQL - Use Environment Variables no Vercel!
let dbPassword = process.env.PGPASSWORD || 'postgres'; // Prefer Environment Variable
const senhaFile = path.join(__dirname, '..\/..\/backend\/SENHA POSTGREE.txt'); // Caminho ajustado

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

// 🔥 Estrutura da Vercel Function para o endpoint POST /api/tarefas/mover-para-andamento
module.exports = async (req, res) => {
  // Verifica se o método é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { id_tarefa } = req.body;

  // Validação simples
  if (!id_tarefa) {
    return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
  }

  try {
    // Atualiza status na tabela tarefas
    await pool.query(`
      UPDATE tarefas
         SET status = 'EM ANDAMENTO'
       WHERE id_tarefa = $1
    `, [id_tarefa]);

    // Insere registro na tabela em_andamento (ON CONFLICT DO NOTHING)
    await pool.query(`
      INSERT INTO em_andamento (id_tarefa)
      VALUES ($1)
      ON CONFLICT (id_tarefa) DO NOTHING
    `, [id_tarefa]);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro POST /api/tarefas/mover-para-andamento:', err);
    res.status(500).json({ error: err.message });
  }
}; 