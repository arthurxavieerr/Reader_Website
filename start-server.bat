@echo off
echo 🚀 Iniciando servidor em modo desenvolvimento...
echo.
set NODE_ENV=development
set DEBUG=true
set PORT=3001
set DATABASE_URL=postgresql://postgres.abbhwmskzczcjspmlcyo:THaVKszLApdYn3iW@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
set JWT_SECRET=e402eab1f7eecd643a8b1499e7b0ddf510d5254482eb703a9a53337bd8eaa8bb
set VITE_API_URL=http://localhost:3001/api
echo 📍 NODE_ENV: %NODE_ENV%
echo 📍 DEBUG: %DEBUG%
echo 📍 PORT: %PORT%
echo 📍 DATABASE_URL: Configurado
echo 📍 JWT_SECRET: Configurado
echo.
echo 🔗 APIs disponíveis:
echo   - Health: http://localhost:3001/health
echo   - Test: http://localhost:3001/api/test
echo.
node server.js