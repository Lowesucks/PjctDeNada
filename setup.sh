#!/bin/bash

echo "========================================"
echo "   Barberias App - Configuración Inicial"
echo "========================================"
echo

echo "Este script configurará todo lo necesario para ejecutar la aplicación."
echo

# Verificar Python
echo "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 no está instalado"
    echo "Por favor instala Python desde https://python.org"
    exit 1
else
    echo "✓ Python encontrado"
fi

# Verificar Node.js
echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no está instalado"
    echo "Por favor instala Node.js desde https://nodejs.org"
    exit 1
else
    echo "✓ Node.js encontrado"
fi

echo
echo "Instalando dependencias..."

# Crear entorno virtual de Python
if [ ! -d "venv" ]; then
    echo "Creando entorno virtual de Python..."
    python3 -m venv venv
fi

# Activar entorno virtual e instalar dependencias
echo "Instalando dependencias de Python..."
source venv/bin/activate
pip install -r requirements.txt

# Instalar dependencias de Node.js
echo "Instalando dependencias de Node.js..."
cd frontend
npm install
cd ..

echo
echo "========================================"
echo "   ¡Configuración completada!"
echo "========================================"
echo
echo "Ahora puedes ejecutar la aplicación con:"
echo "  - ./run.sh (Linux/Mac)"
echo "  - run.bat (Windows)"
echo
echo "O manualmente:"
echo "  1. Backend:  python app.py"
echo "  2. Frontend: cd frontend && npm start" 