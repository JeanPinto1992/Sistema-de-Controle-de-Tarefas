@echo off
echo ===================================================
echo    SISTEMA DE CONTROLE DE TAREFAS - INICIALIZACAO
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

echo [1/5] Instalando dependencias do projeto principal...
call npm install

:: Verifica se a pasta node_modules do backend existe
if not exist "%PROJETO_DIR%backend\node_modules" (
    echo [2/5] Instalando dependencias do backend...
    cd "%PROJETO_DIR%backend"
    call npm install
) else (
    echo [2/5] Dependencias do backend ja instaladas.
)

:: Verifica se a pasta node_modules do frontend existe
if not exist "%PROJETO_DIR%frontend\node_modules" (
    echo [3/5] Instalando dependencias do frontend...
    cd "%PROJETO_DIR%frontend"
    call npm install
) else (
    echo [3/5] Dependencias do frontend ja instaladas.
)

:: Constroi a versão de produção do frontend
echo [4/5] Construindo versao de producao do frontend...
cd "%PROJETO_DIR%frontend"
call npm run build

:: Verifica se o build foi criado corretamente
if not exist "%PROJETO_DIR%frontend\build" (
    echo [ERRO] Falha ao construir o frontend!
    pause
    exit /b
)

:: Inicia o servidor backend
echo [5/5] Iniciando o servidor...
cd "%PROJETO_DIR%backend"
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
echo    Pressione CTRL+C para encerrar o servidor
echo ===================================================
echo.

:: Inicia o servidor backend
node server.js

pause 