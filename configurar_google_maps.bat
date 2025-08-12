@echo off
echo ========================================
echo   Configuracion de Google Maps
echo ========================================
echo.

echo 🔑 Este script te ayudara a configurar Google Maps
echo.

echo 📋 Pasos a seguir:
echo.
echo 1. Ve a https://console.cloud.google.com/
echo 2. Crea un proyecto nuevo o selecciona uno existente
echo 3. Habilita "Maps JavaScript API" en la biblioteca de APIs
echo 4. Crea credenciales (API Key) en "Credenciales"
echo 5. Habilita facturacion (tienes $200 gratis mensual)
echo 6. Copia la API key que aparece
echo.

echo ⚠️  IMPORTANTE: Necesitas habilitar facturacion para que funcione
echo    Google Maps te da $200 de credito gratis mensual
echo.

pause

echo.
echo 🗂️  Creando archivo .env en la carpeta frontend...
echo.

cd frontend

if not exist .env (
    echo REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI > .env
    echo ✅ Archivo .env creado
    echo.
    echo 📝 Ahora edita el archivo .env y reemplaza TU_API_KEY_AQUI
    echo    con tu clave real de Google Maps
    echo.
    echo 📁 El archivo esta en: %cd%\.env
    echo.
    notepad .env
) else (
    echo 📁 El archivo .env ya existe
    echo.
    echo 📝 Edita el archivo para agregar tu API key:
    echo    REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
    echo.
    notepad .env
)

echo.
echo 🚀 Despues de configurar la API key:
echo    1. Guarda el archivo .env
echo    2. Ejecuta: python run.py
echo    3. El mapa deberia funcionar correctamente
echo.

pause 