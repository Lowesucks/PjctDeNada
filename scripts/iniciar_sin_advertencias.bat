@echo off
echo ========================================
echo    INICIANDO APLICACION SIN ADVERTENCIAS
echo ========================================
echo.

REM Configurar variables de entorno para suprimir advertencias
set PYTHONWARNINGS=ignore
set FLASK_ENV=development
set FLASK_DEBUG=1

REM Iniciar el backend
echo Iniciando backend...
start "Backend" cmd /k "python app.py"

REM Esperar un momento para que el backend se inicie
timeout /t 3 /nobreak >nul

REM Iniciar el frontend
echo Iniciando frontend...
cd frontend
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    APLICACION INICIADA
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul 