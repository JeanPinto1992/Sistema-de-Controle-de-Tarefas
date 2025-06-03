#!/bin/bash

echo "=================================================="
echo "   SISTEMA DE CONTROLE DE TAREFAS - INICIALIZACAO"
echo "   SERVIDOR UNIFICADO (React + Node.js + Supabase)"
echo "=================================================="
echo

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não foi encontrado! Por favor instale o Node.js:"
    echo "https://nodejs.org/pt-br/download/"
    echo
    exit 1
fi

# Diretório raiz do projeto
PROJETO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJETO_DIR"

echo "[1/4] Instalando dependências do projeto..."
npm install

# Verifica se a pasta build existe
if [ ! -d "$PROJETO_DIR/build" ]; then
    echo "[2/4] Construindo aplicação React..."
    npm run build
else
    echo "[2/4] Build React já existe."
fi

# Verifica se o build foi criado corretamente
if [ ! -d "$PROJETO_DIR/build" ]; then
    echo "[ERRO] Falha ao construir a aplicação React!"
    exit 1
fi

echo "[3/4] Verificando configuração do Supabase..."
if [ ! -f "$PROJETO_DIR/.env" ]; then
    echo "[AVISO] Arquivo .env não encontrado!"
    echo "Certifique-se de que as variáveis REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY estão configuradas"
    echo
fi

# Inicia o servidor unificado
echo "[4/4] Iniciando servidor unificado com Supabase..."
echo
echo "=================================================="
echo "   SERVIDOR INICIADO!"
echo
echo "   Acesse a aplicação em:"
echo "   - Este computador: http://localhost:3001"
echo "   - Outros computadores na rede: http://$(hostname -I | awk '{print $1}'):3001"
echo
echo "   API disponível em: http://localhost:3001/api/"
echo "   Banco de dados: Supabase Cloud"
echo "   MCP configurado em: .cursor/mcp.json"
echo "   Pressione CTRL+C para encerrar o servidor"
echo "=================================================="
echo

# Inicia o servidor unificado
cd "$PROJETO_DIR"
node server/server.js 