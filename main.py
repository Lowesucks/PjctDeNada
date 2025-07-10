#!/usr/bin/env python3
"""
Archivo principal para ejecutar la aplicación de Barberías
Usa la nueva estructura modular del backend
"""

import os
import sys
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
    
    # Verificar si se debe usar HTTPS
    use_https = False
    cert_file = 'frontend/cert.pem'
    key_file = 'frontend/key.pem'
    if os.path.exists(cert_file) and os.path.exists(key_file):
        use_https = True
    else:
        print('⚠️  Certificados SSL no encontrados. Iniciando en HTTP.')
    
    # Ejecutar aplicación
    if use_https:
        app.run(
            host=app.config['HOST'],
            port=app.config['PORT'],
            debug=app.config['DEBUG'],
            ssl_context=(cert_file, key_file)
        )
    else:
        app.run(
            host=app.config['HOST'],
            port=app.config['PORT'],
            debug=app.config['DEBUG']
        ) 