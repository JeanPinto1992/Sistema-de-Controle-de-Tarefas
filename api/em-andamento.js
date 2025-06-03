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

// 🔥 Estrutura da Vercel Function para o endpoint /api/em-andamento
module.exports = async (req, res) => {
  // Vercel Functions só respondem a um método HTTP por arquivo (geralmente).
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT t.*, e.observacoes
        FROM tarefas t
        LEFT JOIN em_andamento e USING (id_tarefa)
       WHERE t.status = 'EM ANDAMENTO'
       ORDER BY t.id_tarefa
    `);
    // Em Vercel Functions, você não precisa do return extra antes do res.json/res.status
    res.status(200).json(rows);
  } catch (err) {
    console.error('Erro GET /api/em-andamento:', err);
    res.status(500).json({ error: err.message });
  }
}; 