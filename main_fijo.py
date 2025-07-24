#!/usr/bin/env python3
"""
Main corregido para la aplicación de Barberías
"""

import os
import sys
from dotenv import load_dotenv

print("Cargando variables de entorno...")
load_dotenv()

try:
    print("Importando módulos de la aplicación...")
    from backend.app import create_app
    from backend.models import db
    
    print("Creando aplicación Flask...")
    app = create_app()
    
    print("Inicializando base de datos...")
    with app.app_context():
        try:
            db.create_all()
            print("Base de datos inicializada correctamente")
        except Exception as e:
            print(f"Advertencia: Error en base de datos: {e}")
            print("Continuando sin base de datos...")
    
    print("Configurando servidor...")
    
    # Configuración simplificada
    host = '127.0.0.1'  # Solo localhost, no 0.0.0.0
    port = 5000
    debug = False  # Sin debug para evitar problemas
    
    print(f"Servidor iniciando en http://{host}:{port}")
    print("IMPORTANTE: Abre tu navegador y ve a http://localhost:5000")
    print("Presiona Ctrl+C para detener el servidor")
    
    # Ejecutar aplicación SIN HTTPS y SIN configuraciones complejas
    app.run(
        host=host,
        port=port,
        debug=debug,
        use_reloader=False,  # Sin reloader para evitar problemas
        threaded=True        # Para mejor rendimiento
    )
    
except ImportError as e:
    print(f"Error de importación: {e}")
    print("Verifica que todas las dependencias estén instaladas")
    sys.exit(1)
except Exception as e:
    print(f"Error al iniciar la aplicación: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)