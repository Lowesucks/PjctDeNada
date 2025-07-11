"""
Configuración centralizada para la aplicación de Barberías
"""

import os
from pathlib import Path

# Configuración de la aplicación
class Config:
    # Configuración básica
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise RuntimeError('SECRET_KEY no está definida en variables de entorno. Por favor, configúrala en .env')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Configuración de la base de datos
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI:
        raise RuntimeError('DATABASE_URL no está definida en variables de entorno. Por favor, configúrala en .env')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración de APIs
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
    GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY') or GOOGLE_MAPS_API_KEY
    
    # Configuración JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        raise RuntimeError('JWT_SECRET_KEY no está definida en variables de entorno. Por favor, configúrala en .env')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_HOURS = 24
    
    # Configuración del servidor
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    
    # Configuración de CORS
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        # Permitir acceso desde cualquier IP en la red local
        'http://0.0.0.0:3000',
        'http://0.0.0.0:3001',
        'https://192.168.1.125:3000',  # Agregado para acceso desde móvil en HTTPS
    ]
    
    # Configuración de búsqueda
    DEFAULT_SEARCH_RADIUS = 5000  # metros
    MAX_SEARCH_RADIUS = 50000     # metros
    
    # Configuración de caché
    CACHE_TIMEOUT = 300  # 5 minutos
    
    # Configuración de archivos
    UPLOAD_FOLDER = Path('uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    @staticmethod
    def init_app(app):
        """Inicializar configuración específica de la aplicación"""
        # Crear directorios necesarios
        Config.UPLOAD_FOLDER.mkdir(exist_ok=True)
        
        # Configurar CORS - permitir cualquier origen en desarrollo
        from flask_cors import CORS
        if app.config.get('DEBUG', False):
            # En desarrollo, permitir cualquier origen
            CORS(app, origins='*', supports_credentials=True)
        else:
            # En producción, usar orígenes específicos
            CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    # No sobreescribir SQLALCHEMY_DATABASE_URI aquí, usar solo variable de entorno

class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False
    # No sobreescribir SQLALCHEMY_DATABASE_URI aquí, usar solo variable de entorno
    
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Configuración adicional para producción
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not app.debug and not app.testing:
            if not os.path.exists('logs'):
                os.mkdir('logs')
            file_handler = RotatingFileHandler('logs/barberias.log', maxBytes=10240, backupCount=10)
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
            ))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            app.logger.setLevel(logging.INFO)
            app.logger.info('Barberias startup')

class TestingConfig(Config):
    """Configuración para pruebas"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# Diccionario de configuraciones
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 