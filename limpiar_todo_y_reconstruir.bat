@echo off
echo ================================================
echo   Barberias App - Limpieza Completa y Reconstruccion
echo ================================================
echo.

echo ⚠️  ADVERTENCIA: Esto eliminara todos los datos y configuraciones
echo    y reconstruira la aplicacion desde cero.
echo.
set /p confirm="¿Estas seguro? Escribe 'SI' para continuar: "
if /i not "%confirm%"=="SI" (
    echo Operacion cancelada.
    pause
    exit /b 0
)

echo.
echo 🧹 Limpiando todo...

echo Deteniendo todos los procesos...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 /nobreak > nul

echo Eliminando archivos temporales y cache...
if exist __pycache__ rmdir /s /q __pycache__
if exist frontend\__pycache__ rmdir /s /q frontend\__pycache__
if exist frontend\node_modules\.cache rmdir /s /q frontend\node_modules\.cache
if exist frontend\build rmdir /s /q frontend\build
if exist instance rmdir /s /q instance
if exist *.db del *.db
if exist *.sqlite del *.sqlite

echo Eliminando entorno virtual...
if exist venv rmdir /s /q venv

echo Eliminando node_modules...
if exist frontend\node_modules rmdir /s /q frontend\node_modules

echo Eliminando archivos de lock...
if exist package-lock.json del package-lock.json
if exist frontend\package-lock.json del frontend\package-lock.json

echo.
echo 🔧 Reconstruyendo la aplicacion...

echo Creando nuevo entorno virtual...
python -m venv venv

echo Activando entorno virtual e instalando dependencias...
call venv\Scripts\activate
pip install -r requirements.txt

echo Instalando dependencias de Node.js...
cd frontend
npm install
cd ..

echo.
echo ✅ Reconstruccion completada!
echo.
echo 📋 Pasos siguientes:
echo 1. Verifica que tienes los archivos .env necesarios
echo 2. Ejecuta: iniciar_simple.bat
echo.
echo 📁 Archivos .env necesarios:
echo - .env (raiz): GOOGLE_MAPS_API_KEY=tu_api_key
echo - frontend/.env: REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key
echo.
pause 