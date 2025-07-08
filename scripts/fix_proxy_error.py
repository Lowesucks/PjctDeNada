#!/usr/bin/env python3
"""
Script para solucionar errores de proxy y verificar la aplicación
"""

import subprocess
import time
import requests
import sys
import os
from pathlib import Path

def check_port(port):
    """Verifica si un puerto está en uso"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def test_backend():
    """Prueba el backend"""
    try:
        response = requests.get('http://localhost:5000/api/barberias', timeout=5)
        if response.status_code == 200:
            print("✓ Backend funcionando correctamente")
            return True
        else:
            print(f"⚠️  Backend respondió con código: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

def test_frontend():
    """Prueba el frontend"""
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print("✓ Frontend funcionando correctamente")
            return True
        else:
            print(f"⚠️  Frontend respondió con código: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando al frontend: {e}")
        return False

def main():
    print("🔧 Diagnóstico de la aplicación Barberías")
    print("=" * 50)
    
    # Verificar puertos
    print("\n📡 Verificando puertos...")
    backend_running = check_port(5000)
    frontend_running = check_port(3000)
    
    print(f"Puerto 5000 (Backend): {'✅ En uso' if backend_running else '❌ Libre'}")
    print(f"Puerto 3000 (Frontend): {'✅ En uso' if frontend_running else '❌ Libre'}")
    
    # Probar conexiones
    print("\n🧪 Probando conexiones...")
    backend_ok = test_backend() if backend_running else False
    frontend_ok = test_frontend() if frontend_running else False
    
    # Resumen
    print("\n📊 Resumen:")
    print(f"Backend: {'✅ OK' if backend_ok else '❌ Error'}")
    print(f"Frontend: {'✅ OK' if frontend_ok else '❌ Error'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 ¡Todo funcionando correctamente!")
        print("🌐 Accede a la aplicación en: http://localhost:3000")
        print("🔗 API disponible en: http://localhost:5000")
    else:
        print("\n⚠️  Problemas detectados:")
        if not backend_running:
            print("- Backend no está ejecutándose")
        if not frontend_running:
            print("- Frontend no está ejecutándose")
        if backend_running and not backend_ok:
            print("- Backend está ejecutándose pero no responde correctamente")
        if frontend_running and not frontend_ok:
            print("- Frontend está ejecutándose pero no responde correctamente")
        
        print("\n💡 Soluciones:")
        print("1. Ejecuta 'python app.py' para iniciar el backend")
        print("2. Ejecuta 'cd frontend && npm start' para iniciar el frontend")
        print("3. O usa el script universal: 'python run.py'")

if __name__ == "__main__":
    main() 