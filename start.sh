#!/bin/bash

echo "========================================"
echo "   Barberias App - Iniciando Servicios"
echo "========================================"
echo

echo "[1/3] Iniciando Backend (Flask)..."
python app.py &
BACKEND_PID=$!

echo "[2/3] Esperando 3 segundos para que el backend inicie..."
sleep 3

echo "[3/3] Iniciando Frontend (React)..."
cd frontend
npm start &
FRONTEND_PID=$!

echo
echo "========================================"
echo "   Servicios iniciados correctamente"
echo "========================================"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Presiona Ctrl+C para detener todos los servicios..."

# Función para limpiar procesos al salir
cleanup() {
    echo "Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Mantener el script ejecutándose
wait 