@echo off
echo 🚀 Iniciando build para produção...
echo.

echo 📦 Instalando dependências...
call npm install

echo.
echo 🏗️ Construindo aplicação React...
call npm run build

echo.
echo ✅ Build concluído! 
echo 📁 Arquivos estão na pasta 'build'
echo.
echo 🌐 Para fazer deploy no Vercel:
echo 1. Configure as variáveis de ambiente no painel do Vercel
echo 2. Execute: vercel --prod
echo.
pause 