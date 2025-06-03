@echo off
echo ===================================================
echo    SISTEMA DE CONTROLE DE TAREFAS - INICIALIZACAO
echo    SERVIDOR UNIFICADO (React + Node.js + Supabase)
echo ===================================================
echo.

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao foi encontrado! Por favor instale o Node.js:
    echo https://nodejs.org/pt-br/download/
    echo.
    pause
    exit /b
)

:: Diretório raiz do projeto
set PROJETO_DIR=%~dp0
cd %PROJETO_DIR%

echo [1/4] Instalando dependencias do projeto...
call npm install

:: Verifica se a pasta build existe
if not exist "%PROJETO_DIR%build" (
    echo [2/4] Construindo aplicacao React...
    call npm run build
) else (
    echo [2/4] Build React ja existe.
)

:: Verifica se o build foi criado corretamente
if not exist "%PROJETO_DIR%build" (
    echo [ERRO] Falha ao construir a aplicacao React!
    pause
    exit /b
)

echo [3/4] Verificando configuracao do Supabase...
if not exist "%PROJETO_DIR%.env" (
    echo [AVISO] Arquivo .env nao encontrado!
    echo Certifique-se de que as variaveis REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY estao configuradas
    echo.
)

:: Inicia o servidor unificado
echo [4/4] Iniciando servidor unificado com Supabase...
echo.
echo ===================================================
echo    SERVIDOR INICIADO! 
echo.
echo    Acesse a aplicacao em:
echo    - Este computador: http://localhost:3001
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr 255.255.255.0') do (
    echo    - Outros computadores na rede: http://%%a:3001
)
echo.
echo    API disponivel em: http://localhost:3001/api/
echo    Banco de dados: Supabase Cloud
echo    MCP configurado em: .cursor/mcp.json
echo    Pressione CTRL+C para encerrar o servidor
echo ===================================================
echo.

:: Inicia o servidor unificado
cd "%PROJETO_DIR%"
node server/server.js

pause 