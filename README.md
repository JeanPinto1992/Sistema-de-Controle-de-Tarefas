# Sistema de Controle de Tarefas - Servidor Unificado

Sistema completo de gerenciamento de tarefas com interface moderna e intuitiva, desenvolvido em **servidor único** que integra React frontend e Node.js backend para máxima simplicidade e performance.

## 📋 Descrição

Este sistema é uma aplicação web completa para controle e gerenciamento de tarefas, oferecendo uma interface visual tipo "mural" com post-its digitais e visualizações em grade detalhadas. **Arquitetura unificada** com um único servidor Node.js servindo tanto a API REST quanto os arquivos estáticos do React, simplificando deployment e manutenção.

## 🏗️ Arquitetura Unificada

### Tecnologias Principais
- **Node.js + Express** - Servidor único que serve API e frontend
- **React 18.2.0** - Interface de usuário moderna e responsiva
- **PostgreSQL** - Banco de dados relacional robusto
- **Bootstrap 5.3.6** - Framework CSS para design responsivo

### Dependências Completas
- **AG-Grid React 31.3.4** - Grid avançado para visualização de dados
- **Axios 0.21.4** - Cliente HTTP para comunicação interna
- **React Bootstrap 2.7.0** - Componentes React integrados
- **React Icons 5.5.0** - Biblioteca de ícones
- **CORS 2.8.5** - Middleware para Cross-Origin Resource Sharing

### Vantagens da Arquitetura Unificada
- ✅ **Deploy simplificado** - apenas uma aplicação para subir
- ✅ **Menos configuração** - sem necessidade de proxies ou CORS complexos
- ✅ **Melhor performance** - comunicação direta entre frontend e backend
- ✅ **Desenvolvimento ágil** - um único comando para rodar tudo
- ✅ **Manutenção facilitada** - estrutura mais simples e organizada

## ⚡ Funcionalidades Principais

### 1. Mural Visual (Dashboard)
- **Interface tipo Kanban** com post-its digitais
- **Separação por responsável** (Jean e Ivana)  
- **Código de cores por prioridade**:
  - 🔴 Alta prioridade
  - 🟡 Prioridade normal
  - 🟢 Baixa prioridade
- **Filtro por mês** para organização temporal
- **Modal de detalhes** com descrição completa das tarefas

### 2. Gerenciamento de Tarefas
- **Estados de tarefa**:
  - **A Realizar** - Tarefas criadas aguardando início
  - **Em Andamento** - Tarefas sendo executadas
  - **Concluídas** - Tarefas finalizadas
- **Campos por tarefa**:
  - Título da tarefa
  - Descrição detalhada
  - Responsável (Jean/Ivana)
  - Prioridade (Alta/Normal/Baixa)
  - Setor de origem
  - Opção de repetição automática
  - Observações durante execução

### 3. Fluxo de Trabalho
- **Criação de tarefas** com formulário completo
- **Movimentação entre estados** (A Realizar → Em Andamento → Concluída)
- **Edição de tarefas** em qualquer estado
- **Sistema de repetição** - tarefas marcadas como "repetir" são recriadas automaticamente
- **Observações em tempo real** durante execução
- **Histórico completo** com data de conclusão e tempo gasto

### 4. Interface Avançada
- **Visualização em grade (AG-Grid)** com:
  - Ordenação por colunas
  - Filtros avançados
  - Redimensionamento de colunas
  - Export de dados
- **Interface responsiva** adaptável a diferentes telas
- **Notificações** em tempo real para ações do usuário
- **Modais interativos** para edição e visualização

## 📁 Estrutura do Projeto (Servidor Unificado)

```
Sistema-de-Controle-de-Tarefas/
├── src/                        # Código fonte React
│   ├── components/
│   │   └── TarefaGrid.js      # Componente de tabela com AG-Grid
│   ├── App.js                 # Componente principal da aplicação
│   ├── index.js               # Ponto de entrada do React
│   └── index.css              # Estilos globais da aplicação
├── public/                     # Arquivos estáticos do React
│   ├── index.html             # Template HTML principal
│   └── manifest.json          # Configurações PWA
├── server/                     # Servidor Node.js unificado
│   ├── server.js              # Servidor que serve API + frontend
│   └── SENHA POSTGREE.txt     # Arquivo com senha do PostgreSQL
├── build/                      # Build de produção React (gerado)
├── package.json               # Dependências unificadas do projeto
├── iniciar_sistema.bat        # Script de inicialização para Windows
├── iniciar_sistema.sh         # Script de inicialização para Linux/Mac
└── README.md                  # Esta documentação
```

## 🚀 Execução Ultra-Simplificada

### Pré-requisitos
1. **Node.js** (versão 14 ou superior)
2. **PostgreSQL** em execução
3. **Banco de dados** `controle_tarefas` configurado
4. **Arquivo de senha** (`SENHA POSTGREE.txt`) na pasta `server/`

### Método 1: Execução Automática (Recomendado)

**Para Windows:**
```bash
# Execute o arquivo batch - faz tudo automaticamente
iniciar_sistema.bat
```

**Para Linux/Mac:**
```bash
# Torne o script executável e execute
chmod +x iniciar_sistema.sh
./iniciar_sistema.sh
```

**O que os scripts fazem automaticamente:**
1. ✅ Verificam se Node.js está instalado
2. ✅ Instalam todas as dependências (`npm install`)
3. ✅ Constroem a aplicação React (`npm run build`)
4. ✅ Verificam configuração do banco de dados
5. ✅ Iniciam o servidor unificado
6. ✅ Mostram URLs de acesso local e da rede

### Método 2: Execução Manual

#### Desenvolvimento (com hot-reload)
```bash
# Instalar dependências
npm install

# Desenvolvimento com reconstrução automática
npm run dev
```

#### Produção
```bash
# Instalar dependências
npm install

# Construir aplicação React
npm run build

# Iniciar servidor unificado
npm start
```

### URLs de Acesso

- **Aplicação completa**: http://localhost:3001
- **API REST**: http://localhost:3001/api/
- **Rede local**: http://[SEU_IP]:3001

## 🛠️ API Endpoints

### Tarefas Gerais
- `GET /api/tarefas` - Lista tarefas "A REALIZAR"
- `POST /api/tarefas` - Cria nova tarefa ou atualiza existente
- `POST /api/tarefas/mover-para-andamento` - Move tarefa para "EM ANDAMENTO"

### Tarefas em Andamento
- `GET /api/em-andamento` - Lista tarefas "EM ANDAMENTO"
- `PUT /api/em-andamento/:id/observacoes` - Atualiza observações de uma tarefa
- `POST /api/tarefas/mover-para-concluidas` - Move tarefa para "CONCLUÍDA"

### Tarefas Concluídas
- `GET /api/concluidas` - Lista tarefas "CONCLUÍDAS"

### Utilitários
- `GET /api/test-db` - Testa conexão com banco de dados

## 🔧 Configuração do Banco de Dados

### Estrutura Necessária

```sql
-- Tabela principal de tarefas
CREATE TABLE tarefas (
    id_tarefa SERIAL PRIMARY KEY,
    data_criacao TIMESTAMP DEFAULT NOW(),
    tarefa VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'A REALIZAR',
    responsavel VARCHAR(50),
    repetir VARCHAR(10) DEFAULT 'NÃO',
    prioridade VARCHAR(20) DEFAULT 'NORMAL',
    mes VARCHAR(20),
    setor VARCHAR(50)
);

-- Tabela para controle de tarefas em andamento
CREATE TABLE em_andamento (
    id_tarefa INTEGER PRIMARY KEY REFERENCES tarefas(id_tarefa),
    observacoes TEXT
);

-- Tabela para histórico de tarefas concluídas
CREATE TABLE concluidas (
    id_tarefa INTEGER PRIMARY KEY REFERENCES tarefas(id_tarefa),
    observacoes TEXT,
    data_conclusao TIMESTAMP DEFAULT NOW(),
    dias_para_conclusao INTEGER
);
```

### Configuração de Conexão

1. Crie o arquivo `server/SENHA POSTGREE.txt`
2. Insira apenas a senha do usuário `postgres`
3. Ou configure via variáveis de ambiente:
   ```bash
   export DB_PASSWORD=sua_senha_aqui
   ```

## 🎨 Personalização Visual

### Cores por Responsável
- **Jean**: Fundo azul claro
- **Ivana**: Fundo rosa claro

### Cores por Prioridade
- **Alta**: Borda vermelha
- **Normal**: Borda amarela
- **Baixa**: Borda verde

### Layout Responsivo
- Adaptação automática para dispositivos móveis
- Grid flexível que se ajusta ao conteúdo
- Modais centralizados e responsivos

## 🔍 Solução de Problemas

### Erro ao iniciar servidor
1. Verifique se o PostgreSQL está rodando
2. Confirme se o banco `controle_tarefas` existe
3. Verifique o arquivo `server/SENHA POSTGREE.txt`
4. Teste a conexão: `curl http://localhost:3001/api/test-db`

### Build do React falha
1. Execute: `npm install` para garantir dependências
2. Execute: `npm run build` manualmente
3. Verifique se há erros de lint no código React

### Performance lenta
- O servidor unificado é otimizado para servir arquivos estáticos
- AG-Grid processa filtros no lado cliente
- Para datasets grandes, considere paginação na API

## 📊 Características Técnicas do Servidor Unificado

### Performance
- **Serving estático otimizado** pelo Express
- **Roteamento inteligente** (API vs Frontend)
- **Carregamento assíncrono** de dados
- **Cache automático** de arquivos estáticos

### Segurança
- **Validação de dados** no frontend e backend
- **Sanitização de inputs** para prevenir XSS
- **Conexão segura** com banco de dados
- **Serving seguro** de arquivos estáticos

### Escalabilidade
- **Arquitetura simplificada** para fácil scaling
- **API RESTful** padrão para integração
- **Servidor único** reduz complexidade
- **Build otimizado** para produção

## 🚀 Vantagens da Migração para Servidor Unificado

### Antes (Frontend + Backend separados)
- ❌ Dois servidores para gerenciar
- ❌ Configuração complexa de proxy/CORS
- ❌ Deploy mais complicado
- ❌ Duas portas diferentes

### Agora (Servidor Unificado)
- ✅ **Um único servidor** para tudo
- ✅ **Configuração simplificada**
- ✅ **Deploy trivial** - uma aplicação só
- ✅ **Uma porta única** (3001)
- ✅ **Performance superior**
- ✅ **Manutenção facilitada**

## 🤝 Contribuição

Para contribuir com o projeto:
1. Mantenha a arquitetura de servidor unificado
2. Testes todas as funcionalidades após modificações
3. Use os scripts de inicialização para validar mudanças
4. Documente novas funcionalidades

## 📝 Versão

**Versão atual**: 2.0.0 - Servidor Unificado
- ✨ **NOVA ARQUITETURA**: Servidor único para frontend e backend
- ✨ **SIMPLICIDADE**: Um comando para rodar tudo
- ✨ **PERFORMANCE**: Comunicação otimizada
- ✨ **MANUTENÇÃO**: Estrutura simplificada
- ✅ Sistema completo de controle de tarefas
- ✅ Interface React moderna e responsiva
- ✅ API Node.js robusta e integrada 

## ✅ STATUS ATUAL
- **✅ Conexão Supabase**: FUNCIONANDO
- **✅ Servidor local**: Porta 3002
- **✅ Build React**: Criado com sucesso
- **✅ Segurança**: .env removido do Git
- **✅ Deploy**: Pronto para Vercel

## 🔧 CONFIGURAÇÃO NECESSÁRIA PARA VERCEL

### ⚠️ IMPORTANTE: CONFIGURAR VARIÁVEIS DE AMBIENTE

**O arquivo `.env` foi removido do Git por segurança.** Você precisa configurar manualmente no Vercel:

1. **Acesse**: https://vercel.com/dashboard
2. **Selecione seu projeto**
3. **Vá em**: Settings > Environment Variables
4. **Adicione estas 4 variáveis**:

```
Nome: REACT_APP_SUPABASE_URL
Valor: https://xdwypvfgaatcfxpjygub.supabase.co
Environments: Production, Preview, Development

Nome: REACT_APP_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODA2ODUsImV4cCI6MjA2NDU1NjY4NX0.FN8h5tT77tOPyPtjs1hVysj3HXT9Q6P5qqnmM1aAPxM
Environments: Production, Preview, Development

Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk4MDY4NSwiZXhwIjoyMDY0NTU2Njg1fQ.HLgEJGRjUwU_pONu1GNGjHtaZh7rj7urcjXWDpVPdmE
Environments: Production, Preview, Development

Nome: NODE_ENV
Valor: production
Environments: Production, Preview, Development
```

5. **Após configurar, faça um redeploy** (Deploy > Redeploy)

## 🚀 COMO USAR LOCALMENTE

### 1. Clonar e Instalar
```bash
git clone https://github.com/JeanPinto1992/Sistema-de-Controle-de-Tarefas.git
cd Sistema-de-Controle-de-Tarefas
npm install
```

### 2. Configurar .env (LOCAL)
Crie um arquivo `.env` na raiz com:
```
REACT_APP_SUPABASE_URL=https://xdwypvfgaatcfxpjygub.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODA2ODUsImV4cCI6MjA2NDU1NjY4NX0.FN8h5tT77tOPyPtjs1hVysj3HXT9Q6P5qqnmM1aAPxM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd3lwdmZnYWF0Y2Z4cGp5Z3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk4MDY4NSwiZXhwIjoyMDY0NTU2Njg1fQ.HLgEJGRjUwU_pONu1GNGjHtaZh7rj7urcjXWDpVPdmE
NODE_ENV=development
```

### 3. Executar
```bash
# Build e servidor em paralelo
npm run dev

# Apenas build
npm run build

# Apenas servidor
npm start
```

**Acesse**: http://localhost:3002

## 🗄️ BANCO DE DADOS

- **Tipo**: Supabase Cloud
- **Status**: ✅ FUNCIONANDO
- **Tabelas**: tarefas, em_andamento, concluidas
- **Dashboard**: https://supabase.com/dashboard/project/xdwypvfgaatcfxpjygub

## 📋 FUNCIONALIDADES

- ✅ Interface Kanban (A REALIZAR, EM ANDAMENTO, CONCLUÍDA)
- ✅ Grid AG-Grid para listagem avançada
- ✅ Criar, editar e excluir tarefas
- ✅ Sistema de prioridades
- ✅ Controle de responsáveis
- ✅ Histórico de conclusões
- ✅ Observações em tarefas

## 🔗 LINKS IMPORTANTES

- **Aplicação**: https://seu-projeto.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/xdwypvfgaatcfxpjygub
- **Repository**: https://github.com/JeanPinto1992/Sistema-de-Controle-de-Tarefas

---

**🎉 PRONTO! Sistema funcionando local e na nuvem!** 