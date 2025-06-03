#!/bin/bash

echo "==================================================="
echo "   SISTEMA DE CONTROLE DE TAREFAS - INICIALIZACAO"
echo "   SERVIDOR UNIFICADO (React + Node.js)"
echo "==================================================="
echo ""

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não foi encontrado! Por favor instale o Node.js:"
    echo "https://nodejs.org/pt-br/download/"
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Diretório raiz do projeto
PROJETO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
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
    read -p "Pressione Enter para sair..."
    exit 1
fi

echo "[3/4] Verificando arquivo de senha do banco..."
if [ ! -f "$PROJETO_DIR/server/SENHA POSTGREE.txt" ]; then
    echo "[AVISO] Arquivo SENHA POSTGREE.txt não encontrado na pasta server/"
    echo "Certifique-se de que o arquivo existe com a senha do PostgreSQL"
    echo ""
fi

# Inicia o servidor unificado
echo "[4/4] Iniciando servidor unificado..."
echo ""
echo "==================================================="
echo "   SERVIDOR INICIADO!"
echo ""
echo "   Acesse a aplicação em:"
echo "   - Este computador: http://localhost:3001"

# Tenta obter o IP para acesso na rede
IP=$(hostname -I | awk '{print $1}')
if [ ! -z "$IP" ]; then
    echo "   - Outros computadores na rede: http://$IP:3001"
else
    echo "   - Não foi possível determinar o IP da rede"
fi

echo ""
echo "   API disponível em: http://localhost:3001/api/"
echo "   Pressione CTRL+C para encerrar o servidor"
echo "==================================================="
echo ""

# Inicia o servidor unificado
cd "$PROJETO_DIR"
node server/server.js 