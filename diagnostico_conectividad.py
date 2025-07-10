#!/usr/bin/env python3
"""
Script de diagnóstico para verificar conectividad desde teléfonos
"""

import os
import sys
import socket
import subprocess
import platform
import requests
from pathlib import Path

def get_local_ip():
    """Obtiene la IP local de la máquina"""
    try:
        # Conectar a un servidor externo para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"❌ Error obteniendo IP local: {e}")
        return None

def check_port_open(host, port):
    """Verifica si un puerto está abierto"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def check_service_responding(url):
    """Verifica si un servicio responde"""
    try:
        response = requests.get(url, timeout=5)
        return response.status_code == 200
    except:
        return False

def check_backend_api():
    """Verifica específicamente la API del backend"""
    try:
        response = requests.get("http://localhost:5000/api/barberias", timeout=5)
        return response.status_code == 200
    except:
        return False

def configure_windows_firewall():
    """Configura el firewall de Windows"""
    if platform.system() != "Windows":
        return True
        
    print("🔧 Configurando firewall de Windows...")
    
    try:
        # Agregar reglas para puerto 3000
        subprocess.run([
            "netsh", "advfirewall", "firewall", "add", "rule",
            "name=Barberias Frontend", "dir=in", "action=allow", 
            "protocol=TCP", "localport=3000"
        ], check=True, capture_output=True)
        
        # Agregar reglas para puerto 5000
        subprocess.run([
            "netsh", "advfirewall", "firewall", "add", "rule",
            "name=Barberias Backend", "dir=in", "action=allow", 
            "protocol=TCP", "localport=5000"
        ], check=True, capture_output=True)
        
        print("✓ Firewall configurado")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error configurando firewall: {e}")
        return False

def create_frontend_env():
    """Crea o actualiza el archivo .env del frontend"""
    frontend_env_path = Path("frontend/.env")
    
    env_content = """# Configuración del Frontend para acceso externo
HOST=0.0.0.0
PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true
REACT_APP_API_URL=http://localhost:5000
"""
    
    # Agregar API key si existe
    if Path(".env").exists():
        with open(".env", "r") as f:
            content = f.read()
            if "GOOGLE_MAPS_API_KEY" in content:
                for line in content.split("\n"):
                    if line.startswith("GOOGLE_MAPS_API_KEY="):
                        env_content += f"REACT_APP_GOOGLE_MAPS_API_KEY={line.split('=')[1]}\n"
                        break
    
    with open(frontend_env_path, "w") as f:
        f.write(env_content)
    
    print("✓ Archivo frontend/.env configurado")

def main():
    """Función principal de diagnóstico"""
    print("🔍 Diagnóstico de Conectividad - Barberias App")
    print("=" * 50)
    
    # Obtener IP local
    local_ip = get_local_ip()
    if not local_ip:
        print("❌ No se pudo obtener la IP local")
        return False
    
    print(f"📱 Tu IP local es: {local_ip}")
    print()
    
    # Configurar firewall
    if not configure_windows_firewall():
        print("⚠️  No se pudo configurar el firewall automáticamente")
        print("   Ejecuta configurar_firewall.bat como administrador")
    
    # Crear archivo .env del frontend
    create_frontend_env()
    
    # Verificar servicios
    print("🔍 Verificando servicios...")
    
    frontend_responding = check_service_responding("http://localhost:3000")
    backend_responding = check_backend_api()
    
    print(f"Frontend (localhost:3000): {'✅ Respondiendo' if frontend_responding else '❌ No responde'}")
    print(f"Backend (localhost:5000):  {'✅ Respondiendo' if backend_responding else '❌ No responde'}")
    
    # Resumen
    print("\n" + "=" * 50)
    print("📋 RESUMEN")
    print("=" * 50)
    
    if frontend_responding and backend_responding:
        print("✅ TODO FUNCIONANDO CORRECTAMENTE")
        print()
        print("📱 URLs para acceso desde teléfono:")
        print(f"   Frontend: http://{local_ip}:3000")
        print(f"   Backend:  http://{local_ip}:5000")
        print()
        print("💡 Asegúrate de que tu teléfono esté en la misma red WiFi")
        return True
    else:
        print("❌ HAY PROBLEMAS DE CONECTIVIDAD")
        print()
        if not frontend_responding:
            print("• Frontend no responde - Verifica que esté iniciado")
        if not backend_responding:
            print("• Backend no responde - Verifica que esté iniciado")
        print()
        print("🛠️  SOLUCIONES:")
        print("1. Ejecuta: python run.py")
        print("2. O ejecuta: iniciar_simple.bat")
        print("3. Verifica que no haya otros servicios usando los puertos")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        input("\nPresiona Enter para salir...")
        sys.exit(1) 