@echo off
echo ========================================
echo    Barberias App - Iniciando Servicios
echo ========================================
echo.

echo [1/3] Iniciando Backend (Flask)...
start "Backend" cmd /k "python app.py"

echo [2/3] Esperando 3 segundos para que el backend inicie...
timeout /t 3 /nobreak > nul

echo [3/3] Iniciando Frontend (React)...
cd frontend
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    Servicios iniciados correctamente
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul 