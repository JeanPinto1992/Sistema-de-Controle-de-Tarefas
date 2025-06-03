# Projeto Análise de Dados - Versão React

Este projeto é uma recriação da aplicação original de controle de tarefas (feita em Python/Dash) utilizando:

*   **Frontend:** React, HTML, CSS
*   **Backend:** Node.js, Express
*   **Banco de Dados:** PostgreSQL (o mesmo da aplicação original)

## Estrutura do Projeto

-   `/backend`: Contém o servidor Node.js/Express que lida com a lógica de negócios e a comunicação com o banco de dados.
-   `/frontend`: Contém a aplicação React que renderiza a interface do usuário.

## Configuração e Execução

### Pré-requisitos

-   Node.js e npm (ou Yarn)
-   Acesso ao banco de dados PostgreSQL configurado para a aplicação original.
-   Um arquivo `SENHA POSTGREE.txt` na raiz da pasta `backend/` contendo a senha do usuário `postgres` do banco de dados (ou configuração via variáveis de ambiente).

### Método Simplificado (Recomendado)

Para instalar e executar o projeto com um único comando:

1. Navegue até a pasta raiz do projeto:
   ```
   cd analise_dados_react
   ```

2. Instale todas as dependências:
   ```
   npm install
   npm run install-all
   ```

3. Inicie backend e frontend simultaneamente:
   ```
   npm run dev
   ```

Esta configuração iniciará automaticamente o backend na porta 3001 e o frontend na porta 3000.

### Método Manual (Alternativa)

#### Backend

1.  Navegue até a pasta `backend`: `cd analise_dados_react/backend`
2.  Instale as dependências: `npm install`
3.  Inicie o servidor: `npm start` (ou `node server.js`)

#### Frontend

1.  Navegue até a pasta `frontend`: `cd analise_dados_react/frontend`
2.  Instale as dependências: `npm install`
3.  Inicie a aplicação React: `npm start`

A aplicação estará acessível em `http://localhost:3000` (ou outra porta, se configurada).

## Solução de Problemas

- Se enfrentar erros 500 ao iniciar, verifique se:
  - O PostgreSQL está em execução
  - O banco de dados `controle_tarefas` existe e está configurado corretamente
  - O arquivo `SENHA POSTGREE.txt` está na pasta backend com a senha correta 