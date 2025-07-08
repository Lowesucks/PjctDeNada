from flask import Flask
from .models import db
from .routes import (
    obtener_barberias, crear_barberia, obtener_barberia, 
    calificar_barberia, buscar_barberias, buscar_barberias_cercanas,
    usuarios_bp
)
import sys
import os

# Agregar el directorio raíz al path para importar config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import config

def create_app(config_name='default'):
    """Factory function para crear la aplicación Flask"""
    app = Flask(__name__)
    
    # Cargar configuración
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Inicializar extensiones
    db.init_app(app)
    
    # Registrar rutas de barberías
    app.add_url_rule('/api/barberias', 'obtener_barberias', obtener_barberias, methods=['GET'])
    app.add_url_rule('/api/barberias', 'crear_barberia', crear_barberia, methods=['POST'])
    app.add_url_rule('/api/barberias/<int:barberia_id>', 'obtener_barberia', obtener_barberia, methods=['GET'])
    app.add_url_rule('/api/barberias/<int:barberia_id>/calificar', 'calificar_barberia', calificar_barberia, methods=['POST'])
    app.add_url_rule('/api/barberias/buscar', 'buscar_barberias', buscar_barberias, methods=['GET'])
    app.add_url_rule('/api/barberias/cercanas', 'buscar_barberias_cercanas', buscar_barberias_cercanas, methods=['GET'])
    
    # Registrar blueprint de usuarios
    app.register_blueprint(usuarios_bp)
    
    return app

# Crear instancia de la aplicación
app = create_app()

def init_db() -> None:
    """Inicializa la base de datos"""
    with app.app_context():
        db.create_all()
        print("✓ Base de datos inicializada")

@app.cli.command("crear-db")
def crear_tablas_comando() -> None:
    """Comando CLI para crear las tablas de la base de datos"""
    init_db()

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True) 