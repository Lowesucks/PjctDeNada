#!/bin/bash

echo "========================================"
echo "   Configuración de Google Maps"
echo "========================================"
echo

echo "🔑 Este script te ayudará a configurar Google Maps"
echo

echo "📋 Pasos a seguir:"
echo
echo "1. Ve a https://console.cloud.google.com/"
echo "2. Crea un proyecto nuevo o selecciona uno existente"
echo "3. Habilita 'Maps JavaScript API' en la biblioteca de APIs"
echo "4. Crea credenciales (API Key) en 'Credenciales'"
echo "5. Habilita facturación (tienes \$200 gratis mensual)"
echo "6. Copia la API key que aparece"
echo

echo "⚠️  IMPORTANTE: Necesitas habilitar facturación para que funcione"
echo "   Google Maps te da \$200 de crédito gratis mensual"
echo

read -p "Presiona Enter para continuar..."

echo
echo "🗂️  Creando archivo .env en la carpeta frontend..."
echo

cd frontend

if [ ! -f .env ]; then
    echo "REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI" > .env
    echo "✅ Archivo .env creado"
    echo
    echo "📝 Ahora edita el archivo .env y reemplaza TU_API_KEY_AQUI"
    echo "   con tu clave real de Google Maps"
    echo
    echo "📁 El archivo está en: $(pwd)/.env"
    echo
    
    # Intentar abrir con editor preferido
    if command -v code &> /dev/null; then
        code .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "📝 Abre manualmente el archivo .env y agrega tu API key"
    fi
else
    echo "📁 El archivo .env ya existe"
    echo
    echo "📝 Edita el archivo para agregar tu API key:"
    echo "   REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI"
    echo
    
    # Intentar abrir con editor preferido
    if command -v code &> /dev/null; then
        code .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "📝 Abre manualmente el archivo .env y agrega tu API key"
    fi
fi

echo
echo "🚀 Después de configurar la API key:"
echo "   1. Guarda el archivo .env"
echo "   2. Ejecuta: python run.py"
echo "   3. El mapa debería funcionar correctamente"
echo

read -p "Presiona Enter para salir..." 