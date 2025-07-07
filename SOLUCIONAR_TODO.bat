@echo off
echo ================================================
echo   SOLUCIONADOR COMPLETO - Barberias App
echo ================================================
echo.

echo 🛑 Deteniendo todos los procesos...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 /nobreak > nul

echo.
echo 🧹 Limpieza completa...

REM Eliminar archivos problemáticos
if exist __pycache__ rmdir /s /q __pycache__
if exist frontend\__pycache__ rmdir /s /q frontend\__pycache__
if exist frontend\node_modules\.cache rmdir /s /q frontend\node_modules\.cache
if exist frontend\build rmdir /s /q frontend\build
if exist instance rmdir /s /q instance
if exist *.db del *.db
if exist *.sqlite del *.sqlite

echo.
echo 🔧 Reconstruyendo entorno virtual...
if exist venv rmdir /s /q venv
python -m venv venv

echo.
echo 📦 Instalando dependencias Python...
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo 📦 Instalando dependencias Node.js...
cd frontend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install
cd ..

echo.
echo 📝 Creando archivos de configuracion...

REM Crear .env en la raíz
if not exist .env (
    echo Creando .env en la raiz...
    (
        echo # Configuracion del Backend
        echo GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
        echo FOURSQUARE_API_KEY=TU_API_KEY_DE_FOURSQUARE
        echo DATABASE_URL=sqlite:///barberias.db
        echo FLASK_ENV=development
        echo FLASK_DEBUG=1
    ) > .env
    echo ✓ .env creado
)

REM Crear frontend/.env
if not exist frontend\.env (
    echo Creando frontend\.env...
    (
        echo # Configuracion del Frontend
        echo REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
        echo HOST=0.0.0.0
        echo PORT=3000
        echo DANGEROUSLY_DISABLE_HOST_CHECK=true
        echo REACT_APP_API_URL=http://localhost:5000
    ) > frontend\.env
    echo ✓ frontend\.env creado
)

echo.
echo 🔧 Configurando VS Code...
if not exist .vscode mkdir .vscode
(
    echo {
    echo     "python.defaultInterpreterPath": "./venv/Scripts/python.exe",
    echo     "python.terminal.activateEnvironment": true,
    echo     "python.analysis.extraPaths": [
    echo         "./venv/Lib/site-packages"
    echo     ],
    echo     "python.analysis.autoImportCompletions": true,
    echo     "python.analysis.typeCheckingMode": "off"
    echo }
) > .vscode\settings.json

echo.
echo ✅ ¡TODO CONFIGURADO!
echo.
echo 📋 Pasos siguientes:
echo 1. Cierra VS Code completamente
echo 2. Vuelve a abrir VS Code
echo 3. Edita los archivos .env con tus API keys
echo 4. Ejecuta: iniciar_simple.bat
echo.
echo 🔑 Para obtener Google Maps API Key:
echo   1. Ve a https://console.cloud.google.com/
echo   2. Crea un proyecto
echo   3. Habilita "Maps JavaScript API"
echo   4. Crea credenciales (API Key)
echo.
echo 🚀 Para iniciar la aplicacion:
echo   iniciar_simple.bat
echo.
pause 