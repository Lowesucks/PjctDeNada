#!/usr/bin/env python3
"""
Script para mostrar la IP local y permitir acceso desde teléfonos
"""

import socket
import platform
import subprocess

def get_local_ip():
    """Obtiene la IP local de la máquina"""
    try:
        # Conectar a un servidor externo para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "No se pudo obtener la IP"

def get_all_ips():
    """Obtiene todas las IPs de la máquina"""
    ips = []
    try:
        hostname = socket.gethostname()
        ips.append(socket.gethostbyname(hostname))
        
        # Obtener IPs adicionales
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            if ip not in ips and not str(ip).startswith('127.'):
                ips.append(ip)
    except Exception:
        pass
    
    return ips

def main():
    print("Información de Red para Acceso desde Teléfonos")
    print("=" * 50)
    
    system = platform.system()
    print(f"Sistema: {system}")
    
    # Obtener IP principal
    main_ip = get_local_ip()
    print(f"IP Principal: {main_ip}")
    
    # Obtener todas las IPs
    all_ips = get_all_ips()
    if all_ips:
        print("Todas las IPs disponibles:")
        for ip in all_ips:
            print(f"  • {ip}")
    
    print("\nURLs para acceso desde teléfonos:")
    print("=" * 50)
    
    if main_ip != "No se pudo obtener la IP":
        print(f"Frontend: http://{main_ip}:3000")
        print(f"Backend:  http://{main_ip}:5000")
        print()
        print("Instrucciones:")
        print("1. Asegúrate de que tu teléfono esté conectado a la misma red WiFi")
        print("2. Abre el navegador en tu teléfono")
        print("3. Ve a: http://{main_ip}:3000")
        print("4. ¡Disfruta de la aplicación en tu teléfono!")
    else:
        print("No se pudo obtener la IP local")
        print("Verifica tu conexión de red")
    
    print("\nComandos útiles:")
    if system == "Windows":
        print("• Ver IP: ipconfig")
        print("• Verificar conectividad: ping {main_ip}")
    else:
        print("• Ver IP: ifconfig o ip addr")
        print("• Verificar conectividad: ping {main_main_ip}")

if __name__ == "__main__":
    main()