@echo off
title Barberias App - Iniciador Simple

echo ========================================
echo    Barberias App - Iniciador Simple
echo ========================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado o no está en el PATH
    echo Por favor instala Python desde https://python.org
    pause
    exit /b 1
)

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
if not exist "venv" (
    echo Instalando dependencias de Python...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

if not exist "frontend\node_modules" (
    echo Instalando dependencias de Node.js...
    cd frontend
    npm install
    cd ..
)

echo.
echo Iniciando servicios...
echo.

REM Iniciar backend en una nueva ventana
start "Backend - Barberias" cmd /k "call venv\Scripts\activate && python app.py"

REM Esperar un momento
timeout /t 2 /nobreak > nul

REM Iniciar frontend en una nueva ventana
start "Frontend - Barberias" cmd /k "cd frontend && npm start -- --host 0.0.0.0"

echo.
echo ========================================
echo    ¡Servicios iniciados!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Las aplicaciones se abrirán automáticamente en tu navegador.
echo Para detener los servicios, cierra las ventanas de comandos.
echo.
pause 