#!/usr/bin/env python3
"""
Main simplificado para la aplicación de Barberías
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

print("Cargando aplicación...")

try:
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
            print(f"Error en base de datos: {e}")
            # Continuar sin base de datos por ahora
    
    # Configuración del servidor
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"Iniciando servidor en http://{host}:{port}")
    print("Accede desde tu navegador a la URL mostrada")
    print("Presiona Ctrl+C para detener")
    
    # Ejecutar aplicación SIN HTTPS por ahora
    app.run(host=host, port=port, debug=debug)
    
except ImportError as e:
    print(f"Error de importación: {e}")
    print("Verifica que todas las dependencias estén instaladas")
    sys.exit(1)
except Exception as e:
    print(f"Error al iniciar la aplicación: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)