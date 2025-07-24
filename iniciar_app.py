#!/usr/bin/env python3
"""
Script simplificado para iniciar la aplicación optimizada
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

try:
    from backend.app import create_app
    from backend.models import db
    
    print("Iniciando aplicación optimizada...")
    
    # Crear aplicación
    app = create_app()
    
    # Inicializar base de datos
    with app.app_context():
        db.create_all()
        print("Base de datos inicializada")
    
    # Configurar para desarrollo
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"Iniciando servidor en http://{host}:{port}")
    print("Presiona Ctrl+C para detener")
    
    # Iniciar servidor
    app.run(host=host, port=port, debug=debug)
    
except Exception as e:
    print(f"Error al iniciar la aplicación: {e}")
    print("\nVerifica que:")
    print("1. El archivo .env esté configurado correctamente")
    print("2. Las dependencias estén instaladas")
    print("3. No haya otros procesos usando el puerto")
    sys.exit(1)