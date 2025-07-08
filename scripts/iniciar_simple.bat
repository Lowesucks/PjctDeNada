@echo off
echo ================================================
echo   Barberias App - Inicio Simple
echo ================================================
echo.

echo Deteniendo procesos anteriores...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Iniciando Backend...
start "Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && python app.py"

echo Esperando 3 segundos...
timeout /t 3 /nobreak > nul

echo.
echo Iniciando Frontend...
start "Frontend" cmd /k "cd /d %~dp0\frontend && npm start"

echo.
echo ================================================
echo   ¡Aplicacion iniciada!
echo ================================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Si el frontend dice que el puerto esta ocupado:
echo 1. Presiona Y para usar otro puerto
echo 2. O cierra el proceso que use el puerto 3000
echo.
pause 