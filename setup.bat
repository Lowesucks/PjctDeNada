@echo off
title Barberias App - Configuración Inicial

echo ========================================
echo    Barberias App - Configuración Inicial
echo ========================================
echo.

echo Este script configurará todo lo necesario para ejecutar la aplicación.
echo.

REM Verificar Python
echo Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado
    echo Por favor instala Python desde https://python.org
    echo Asegúrate de marcar "Add Python to PATH" durante la instalación
    pause
    exit /b 1
) else (
    echo ✓ Python encontrado
)

REM Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✓ Node.js encontrado
)

echo.
echo Instalando dependencias...

REM Crear entorno virtual de Python
if not exist "venv" (
    echo Creando entorno virtual de Python...
    python -m venv venv
)

REM Activar entorno virtual e instalar dependencias
echo Instalando dependencias de Python...
call venv\Scripts\activate
pip install -r requirements.txt

REM Instalar dependencias de Node.js
echo Instalando dependencias de Node.js...
cd frontend
npm install
cd ..

echo.
echo ========================================
echo    ¡Configuración completada!
echo ========================================
echo.
echo Ahora puedes ejecutar la aplicación con:
echo   - run.bat (Windows)
echo   - ./run.sh (Linux/Mac)
echo.
echo O manualmente:
echo   1. Backend:  python app.py
echo   2. Frontend: cd frontend && npm start
echo.
pause 