#!/bin/bash

echo "========================================"
echo "   Barberias App - Iniciador Simple"
echo "========================================"
echo

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 no está instalado"
    echo "Por favor instala Python desde https://python.org"
    exit 1
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no está instalado"
    echo "Por favor instala Node.js desde https://nodejs.org"
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "venv" ]; then
    echo "Instalando dependencias de Python..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Instalando dependencias de Node.js..."
    cd frontend
    npm install
    cd ..
fi

echo
echo "Iniciando servicios..."
echo

# Función para limpiar procesos al salir
cleanup() {
    echo "Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servicios detenidos."
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Iniciar backend
echo "Iniciando Backend..."
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Esperar un momento
sleep 2

# Iniciar frontend
echo "Iniciando Frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo
echo "========================================"
echo "   ¡Servicios iniciados!"
echo "========================================"
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Las aplicaciones se abrirán automáticamente en tu navegador."
echo "Presiona Ctrl+C para detener todos los servicios."
echo

# Mantener el script ejecutándose
wait 