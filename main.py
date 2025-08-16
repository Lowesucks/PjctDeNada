#!/usr/bin/env python3
"""
Archivo principal para ejecutar la aplicación de Barberías
Usa la nueva estructura modular del backend
"""

import os
import sys
import ssl
import socket
from dotenv import load_dotenv
load_dotenv()
from backend.app import create_app
from backend.models import db
from config import config

# Obtener configuración del entorno
config_name = os.environ.get('FLASK_CONFIG') or 'default'
app = create_app(config_name)

def get_local_ip():
    """Obtiene la IP local de la máquina. Devuelve 'localhost' si no se puede obtener."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # No necesita estar conectado realmente, solo se usa para obtener la interfaz preferida
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

def init_db():
    """Inicializa la base de datos"""
    with app.app_context():
        db.create_all()
        print("Base de datos inicializada correctamente")

if __name__ == '__main__':
    print("Iniciando aplicación de Barberías optimizada...")
    
    # Verificar si se solicita HTTPS
    use_https = '--https' in sys.argv
    
    # Inicializar base de datos
    init_db()
    
    # Configuración para acceso desde red local (móviles)
    host = '0.0.0.0'  # Permitir acceso desde cualquier IP de la red local
    port = 5000
    debug = False  # Sin debug para evitar problemas de doble logging
    local_ip = get_local_ip()

    if use_https:
        # Configuración HTTPS
        cert_path = 'cert.pem'
        key_path = 'key.pem'
        
        if os.path.exists(cert_path) and os.path.exists(key_path):
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
            ssl_context.load_cert_chain(cert_path, key_path)
            print('🔒 Iniciando en HTTPS con certificados SSL')
            print(f"Servidor iniciando en https://{host}:{port}")
            print("IMPORTANTE: URLs para acceder:")
            print(f"  - Desde PC: https://localhost:{port}")
            print(f"  - Desde móvil en la misma red: https://{local_ip}:{port}")
        else:
            print("⚠️  Certificados SSL no encontrados. Iniciando en HTTP...")
            use_https = False
    
    if not use_https:
        print('Iniciando en HTTP (sin SSL para mayor compatibilidad)')
        print(f"Servidor iniciando en http://{host}:{port}")
        print("IMPORTANTE: URLs para acceder:")
        print(f"  - Desde PC: http://localhost:{port}")
        print(f"  - Desde móvil en la misma red: http://{local_ip}:{port}")
    
    print("Presiona Ctrl+C para detener el servidor")
    print("")
    print("Todas las optimizaciones están activas:")
    print("- Cache multinivel funcionando")
    print("- Validaciones robustas implementadas")
    print("- Logging estructurado activado")
    print("- Indices de base de datos optimizados")
    print("")
    
    # Ejecutar aplicación con configuración estable
    try:
        if use_https and os.path.exists(cert_path) and os.path.exists(key_path):
            app.run(
                host=host,
                port=port,
                debug=debug,
                use_reloader=False,  # Sin reloader para evitar problemas
                threaded=True,       # Para mejor rendimiento
                ssl_context=ssl_context
            )
        else:
            app.run(
                host=host,
                port=port,
                debug=debug,
                use_reloader=False,  # Sin reloader para evitar problemas
                threaded=True        # Para mejor rendimiento
            )
    except Exception as e:
        print(f"Error al iniciar el servidor: {e}")
        print("Verifica que el puerto 5000 no esté ocupado por otro proceso")