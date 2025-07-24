#!/usr/bin/env python3
"""
Archivo principal para ejecutar la aplicación de Barberías
Usa la nueva estructura modular del backend
"""

import os
import sys
from dotenv import load_dotenv
load_dotenv()
from backend.app import create_app
from backend.models import db
from config import config

# Obtener configuración del entorno
config_name = os.environ.get('FLASK_CONFIG') or 'default'
app = create_app(config_name)

def init_db():
    """Inicializa la base de datos"""
    with app.app_context():
        db.create_all()
        print("Base de datos inicializada correctamente")

if __name__ == '__main__':
    print("Iniciando aplicación de Barberías optimizada...")
    
    # Inicializar base de datos
    init_db()
    
    # Configuración para acceso desde red local (móviles)
    host = '0.0.0.0'  # Permitir acceso desde cualquier IP de la red local
    port = 5000
    debug = False  # Sin debug para evitar problemas de doble logging
    
    print('Iniciando en HTTP (sin SSL para mayor compatibilidad)')
    print(f"Servidor iniciando en http://{host}:{port}")
    print("IMPORTANTE: URLs para acceder:")
    print("  - Desde PC: http://localhost:5000")
    print("  - Desde móvil en la misma red: http://192.168.2.109:5000")
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