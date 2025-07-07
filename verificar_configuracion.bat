@echo off
echo ================================================
echo   Verificador de Configuracion - Barberias App
echo ================================================
echo.

set errores=0

echo 📁 Verificando archivos de configuracion...

REM Verificar .env en la raíz
if not exist .env (
    echo ❌ FALTA: Archivo .env en la raiz del proyecto
    echo    Crear .env con: GOOGLE_MAPS_API_KEY=tu_api_key
    set /a errores+=1
) else (
    echo ✓ .env encontrado en la raiz
)

REM Verificar frontend/.env
if not exist frontend\.env (
    echo ❌ FALTA: Archivo frontend\.env
    echo    Crear frontend\.env con las variables necesarias
    set /a errores+=1
) else (
    echo ✓ frontend\.env encontrado
)

echo.
echo 🔧 Verificando dependencias...

REM Verificar entorno virtual
if not exist venv (
    echo ❌ FALTA: Entorno virtual (venv)
    echo    Ejecutar: python -m venv venv
    set /a errores+=1
) else (
    echo ✓ Entorno virtual encontrado
)

REM Verificar node_modules
if not exist frontend\node_modules (
    echo ❌ FALTA: node_modules en frontend
    echo    Ejecutar: cd frontend && npm install
    set /a errores+=1
) else (
    echo ✓ node_modules encontrado
)

echo.
echo 🌐 Verificando puertos...

REM Verificar puerto 5000
netstat -an | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 5000 esta en uso
) else (
    echo ✓ Puerto 5000 disponible
)

REM Verificar puerto 3000
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 3000 esta en uso
) else (
    echo ✓ Puerto 3000 disponible
)

echo.
echo 📋 Resumen de verificacion:

if %errores% equ 0 (
    echo ✅ Configuracion correcta
    echo.
    echo 🚀 Puedes iniciar la aplicacion con:
    echo    iniciar_simple.bat
    echo    o
    echo    python run.py
) else (
    echo ❌ Se encontraron %errores% errores
    echo.
    echo 🔧 Para solucionar:
    echo    1. Ejecutar: limpiar_todo_y_reconstruir.bat
    echo    2. Crear archivos .env con las API keys
    echo    3. Ejecutar: iniciar_simple.bat
)

echo.
pause 