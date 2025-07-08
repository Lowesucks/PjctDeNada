@echo off
echo ================================================
echo   Configurador Automatico - Barberias App
echo ================================================
echo.

echo 🔍 Verificando configuracion actual...
call verificar_configuracion.bat

echo.
echo ¿Deseas continuar con la configuracion automatica?
set /p continuar="(s/N): "
if /i not "%continuar%"=="s" (
    echo Configuracion cancelada.
    pause
    exit /b 0
)

echo.
echo 🧹 Limpiando y reconstruyendo...
call limpiar_todo_y_reconstruir.bat

echo.
echo 📝 Creando archivos de configuracion...

REM Crear .env en la raíz si no existe
if not exist .env (
    echo Creando .env en la raiz...
    (
        echo # Configuracion del Backend
        echo # Reemplaza con tus API keys reales
        echo.
        echo # Google Maps API Key ^(OBLIGATORIO^)
        echo GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
        echo.
        echo # Foursquare API Key ^(OPCIONAL^)
        echo FOURSQUARE_API_KEY=TU_API_KEY_DE_FOURSQUARE
        echo.
        echo # Configuracion de la base de datos
        echo DATABASE_URL=sqlite:///barberias.db
        echo.
        echo # Configuracion del servidor
        echo FLASK_ENV=development
        echo FLASK_DEBUG=1
    ) > .env
    echo ✓ .env creado en la raiz
) else (
    echo ✓ .env ya existe en la raiz
)

REM Crear frontend/.env si no existe
if not exist frontend\.env (
    echo Creando frontend\.env...
    (
        echo # Configuracion del Frontend
        echo # Reemplaza con tus API keys reales
        echo.
        echo # Google Maps API Key ^(OBLIGATORIO^)
        echo REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
        echo.
        echo # Configuracion para acceso externo
        echo HOST=0.0.0.0
        echo PORT=3000
        echo DANGEROUSLY_DISABLE_HOST_CHECK=true
        echo.
        echo # URL del backend ^(opcional^)
        echo REACT_APP_API_URL=http://localhost:5000
    ) > frontend\.env
    echo ✓ frontend\.env creado
) else (
    echo ✓ frontend\.env ya existe
)

echo.
echo ✅ Configuracion completada!
echo.
echo 📋 Pasos siguientes:
echo 1. Editar .env y frontend\.env con tus API keys
echo 2. Ejecutar: iniciar_simple.bat
echo.
echo 🔑 Para obtener Google Maps API Key:
echo   1. Ve a https://console.cloud.google.com/
echo   2. Crea un proyecto
echo   3. Habilita "Maps JavaScript API"
echo   4. Crea credenciales ^(API Key^)
echo.
pause 