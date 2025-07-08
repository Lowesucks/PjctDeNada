#!/usr/bin/env python3
"""
Archivo principal para ejecutar la aplicación de Barberías
Usa la nueva estructura modular del backend
"""

import os
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
        print("✓ Base de datos inicializada")

if __name__ == '__main__':
    # Inicializar base de datos
    init_db()
    
    # Ejecutar aplicación
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    ) 