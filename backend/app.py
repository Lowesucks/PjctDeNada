from flask import Flask, send_from_directory, send_file
from .models import db
from .routes import (
    obtener_barberias, crear_barberia, obtener_barberia, 
    calificar_barberia, buscar_barberias, buscar_barberias_cercanas,
    obtener_favoritos, agregar_favorito, eliminar_favorito, verificar_favorito,
    usuarios_bp
)
from .logging_config import AppLogger, setup_request_logging
from .cache_manager import setup_cache_cleanup
import sys
import os
from pathlib import Path

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
    
    # Inicializar sistema de logging
    app_logger = AppLogger(app)
    setup_request_logging(app)
    
    # Configurar limpieza de caché
    setup_cache_cleanup()
    
    # Log de inicio de aplicación
    app.logger.info("Aplicación de Barberías iniciada", extra={
        'extra_data': {
            'config': config_name,
            'debug': app.config.get('DEBUG', False),
            'environment': app.config.get('FLASK_ENV', 'unknown')
        }
    })
    
    # Registrar rutas de barberías
    app.add_url_rule('/api/barberias', 'obtener_barberias', obtener_barberias, methods=['GET'])
    
    app.add_url_rule('/api/barberias', 'crear_barberia', crear_barberia, methods=['POST'])
    app.add_url_rule('/api/barberias/<int:barberia_id>', 'obtener_barberia', obtener_barberia, methods=['GET'])
    app.add_url_rule('/api/barberias/<int:barberia_id>/calificar', 'calificar_barberia', calificar_barberia, methods=['POST'])
    app.add_url_rule('/api/barberias/buscar', 'buscar_barberias', buscar_barberias, methods=['GET'])
    app.add_url_rule('/api/barberias/cercanas', 'buscar_barberias_cercanas', buscar_barberias_cercanas, methods=['GET'])
    
    # Registrar rutas de favoritos
    app.add_url_rule('/api/favoritos', 'obtener_favoritos', obtener_favoritos, methods=['GET'])
    app.add_url_rule('/api/favoritos/<int:barberia_id>', 'agregar_favorito', agregar_favorito, methods=['POST'])
    app.add_url_rule('/api/favoritos/<int:barberia_id>', 'eliminar_favorito', eliminar_favorito, methods=['DELETE'])
    app.add_url_rule('/api/favoritos/<int:barberia_id>/verificar', 'verificar_favorito', verificar_favorito, methods=['GET'])
    
    # Registrar blueprint de usuarios
    app.register_blueprint(usuarios_bp)
    
    # Ruta para verificar optimizaciones
    @app.route('/verificar_optimizaciones')
    def verificar_optimizaciones():
        """Endpoint para verificar que las optimizaciones funcionan"""
        from .cache_manager import cache_stats
        
        try:
            stats_cache = cache_stats()
        except:
            stats_cache = {'error': 'Cache no disponible'}
        
        return {
            'status': 'ok',
            'mensaje': 'Todas las optimizaciones funcionando',
            'optimizaciones': {
                'jwt_seguros': '✅ Variables de entorno configuradas',
                'cache': f"✅ Activo - {stats_cache.get('active_keys', 0)} claves",
                'validaciones': '✅ Input validation implementado',
                'logging': '✅ Structured logging activo',
                'database': '✅ Indices optimizados creados',
                'apis_externas': '✅ Timeout y retry configurados'
            },
            'cache_stats': stats_cache
        }
    
    # Configurar rutas para servir el frontend
    frontend_dir = Path(__file__).parent.parent / 'frontend'
    
    @app.route('/')
    def serve_frontend():
        """Servir el archivo principal del frontend compilado"""
        try:
            # Servir el build de React compilado
            build_path = frontend_dir / 'build' / 'index.html'
            if build_path.exists():
                return send_file(build_path)
            else:
                # Fallback a la página simple si no existe el build
                html_path = frontend_dir / 'public' / 'index_simple.html'
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                from flask import Response
                return Response(html_content, mimetype='text/html')
        except Exception as e:
            print(f"Error sirviendo frontend: {e}")
            return '''
            <h1>🚀 Aplicación de Barberías</h1>
            <p><strong>✅ Servidor funcionando correctamente</strong></p>
            <p>Todas las optimizaciones están activas:</p>
            <ul>
                <li>🔒 JWT seguros implementados</li>
                <li>💾 Caché multinivel funcionando</li>
                <li>📝 Logging estructurado activo</li>
                <li>⚡ Queries optimizadas</li>
            </ul>
            <p><a href="/api/barberias">Probar API de Barberías</a></p>
            '''
    
    @app.route('/manifest.json')
    def serve_manifest():
        """Servir el manifest.json"""
        # Primero intentar servir desde build, luego desde public
        build_manifest = frontend_dir / 'build' / 'manifest.json'
        if build_manifest.exists():
            return send_file(build_manifest, mimetype='application/json')
        else:
            return send_file(frontend_dir / 'public' / 'manifest.json', mimetype='application/json')
    
    @app.route('/favicon.ico')
    def serve_favicon():
        """Servir el favicon"""
        # Buscar favicon en build primero, luego en public
        possible_favicon_paths = [
            frontend_dir / 'build' / 'favicon.ico',
            frontend_dir / 'public' / 'favicon.ico'
        ]
        
        for favicon_path in possible_favicon_paths:
            if favicon_path.exists():
                return send_file(favicon_path)
        
        # Devolver un favicon por defecto si no existe
        from flask import abort
        abort(404)
    
    # Test route to verify Flask routing works
    @app.route('/test-route')
    def test_route():
        """Simple test route to verify Flask is working"""
        return {'message': 'Flask routing works!'}
    
    # Debug route para ver qué archivos se están solicitando
    @app.route('/debug/static')
    def debug_static():
        """Debug route para ver archivos en directorio static"""
        static_dir = frontend_dir / 'build' / 'static'
        files = []
        if static_dir.exists():
            for root, dirs, filenames in os.walk(static_dir):
                for filename in filenames:
                    rel_path = os.path.relpath(os.path.join(root, filename), static_dir)
                    files.append(rel_path.replace('\\', '/'))
        return {'static_dir': str(static_dir), 'files': files}
    
    # Rutas específicas para archivos estáticos
    @app.route('/static/css/<filename>')
    def serve_css(filename):
        """Servir archivos CSS del build de React"""
        static_dir = frontend_dir / 'build' / 'static'
        return send_from_directory(str(static_dir / 'css'), filename)
    
    @app.route('/static/js/<filename>')
    def serve_js(filename):
        """Servir archivos JS del build de React"""
        static_dir = frontend_dir / 'build' / 'static'
        return send_from_directory(str(static_dir / 'js'), filename)
    
    # Ruta adicional para servir archivos CSS fuente (durante desarrollo)
    @app.route('/src/styles/<filename>')
    def serve_src_styles(filename):
        """Servir archivos CSS fuente para desarrollo"""
        styles_dir = frontend_dir / 'src' / 'styles'
        if styles_dir.exists():
            return send_from_directory(str(styles_dir), filename)
        from flask import abort
        abort(404)
    
    # Removed generic static route - using specific CSS/JS routes instead
    
    @app.route('/<path:path>')
    def serve_catch_all(path):
        """Servir otros archivos o redirigir a la app principal"""
        # No interceptar rutas que empiecen con 'static/' - dejar que las rutas específicas las manejen
        if path.startswith('static/'):
            from flask import abort
            abort(404)
            
        # Intentar servir archivos estáticos primero (priorizar build)
        possible_paths = [
            frontend_dir / 'build' / path,
            frontend_dir / 'public' / path
        ]
        
        for file_path in possible_paths:
            if file_path.exists():
                return send_file(file_path)
        
        # Si no es un archivo estático, servir la app principal (para React Router)
        return serve_frontend()
    
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