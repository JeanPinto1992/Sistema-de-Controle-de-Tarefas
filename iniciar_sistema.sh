#!/bin/bash

echo "==================================================="
echo "   SISTEMA DE CONTROLE DE TAREFAS - INICIALIZACAO"
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

echo "[1/5] Instalando dependências do projeto principal..."
npm install

# Verifica se a pasta node_modules do backend existe
if [ ! -d "$PROJETO_DIR/backend/node_modules" ]; then
    echo "[2/5] Instalando dependências do backend..."
    cd "$PROJETO_DIR/backend"
    npm install
else
    echo "[2/5] Dependências do backend já instaladas."
fi

# Verifica se a pasta node_modules do frontend existe
if [ ! -d "$PROJETO_DIR/frontend/node_modules" ]; then
    echo "[3/5] Instalando dependências do frontend..."
    cd "$PROJETO_DIR/frontend"
    npm install
else
    echo "[3/5] Dependências do frontend já instaladas."
fi

# Constroi a versão de produção do frontend
echo "[4/5] Construindo versão de produção do frontend..."
cd "$PROJETO_DIR/frontend"
npm run build

# Verifica se o build foi criado corretamente
if [ ! -d "$PROJETO_DIR/frontend/build" ]; then
    echo "[ERRO] Falha ao construir o frontend!"
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Inicia o servidor backend
echo "[5/5] Iniciando o servidor..."
cd "$PROJETO_DIR/backend"
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
echo "   Pressione CTRL+C para encerrar o servidor"
echo "==================================================="
echo ""

# Inicia o servidor backend
node server.js 