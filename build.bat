@echo off
echo ====================================================
echo      TimerRent - Gerador de Executavel (Builder)
echo ====================================================
echo.

echo [1/3] Instalando e atualizando dependencias (isso evita erros em novos PCs)
call npm install

echo.
echo [2/3] Verificando/Convertendo o icone do aplicativo
if not exist "icons\icon.ico" (
    echo Icone ICO nao encontrado! Gerando um novo a partir do PNG...
    call npx png-to-ico icons\icon.png > icons\icon.ico
) else (
    echo Icone ICO encontrado!
)

echo.
echo [3/3] Compilando o aplicativo para Windows (NSIS)...
call npm run build

echo.
echo ====================================================
echo SUCESSO! O executavel foi criado dentro da pasta "dist".
echo ====================================================
pause
