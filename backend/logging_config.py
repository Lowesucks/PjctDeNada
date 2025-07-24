"""
Sistema de logging estructurado para monitoreo y debugging
"""

import os
import json
import logging
import logging.handlers
from datetime import datetime
from typing import Any, Dict, Optional
from flask import request, g
from functools import wraps
import traceback

class StructuredFormatter(logging.Formatter):
    """Formatter que genera logs en formato JSON estructurado"""
    
    def format(self, record):
        # Datos base del log
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'thread': record.thread,
            'process': record.process
        }
        
        # Agregar información de request si está disponible
        try:
            if request:
                log_data['request'] = {
                    'method': request.method,
                    'url': request.url,
                    'endpoint': request.endpoint,
                    'remote_addr': request.remote_addr,
                    'user_agent': request.headers.get('User-Agent', ''),
                    'content_length': request.content_length
                }
                
                # Agregar user_id si está en el contexto
                if hasattr(g, 'current_user') and g.current_user:
                    log_data['user_id'] = g.current_user.id
                    
        except RuntimeError:
            # Fuera del contexto de request
            pass
        
        # Agregar información adicional si está en el record
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data
        
        # Agregar información de excepción si existe
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        return json.dumps(log_data, ensure_ascii=False, default=str)

class AppLogger:
    """Logger principal de la aplicación"""
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Inicializa el sistema de logging para Flask"""
        
        # Configurar nivel de logging
        log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
        app.logger.setLevel(getattr(logging, log_level))
        
        # Limpiar handlers existentes
        app.logger.handlers.clear()
        
        # Configurar handler para consola (desarrollo)
        if app.config.get('DEBUG', False):
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.DEBUG)
            console_formatter = logging.Formatter(
                '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            app.logger.addHandler(console_handler)
        
        # Configurar handler para archivo (producción)
        if not app.config.get('DEBUG', False) or os.environ.get('LOG_TO_FILE', 'false').lower() == 'true':
            log_dir = 'logs'
            if not os.path.exists(log_dir):
                os.makedirs(log_dir)
            
            # Handler para logs generales
            file_handler = logging.handlers.RotatingFileHandler(
                os.path.join(log_dir, 'app.log'),
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=5
            )
            file_handler.setLevel(logging.INFO)
            file_handler.setFormatter(StructuredFormatter())
            app.logger.addHandler(file_handler)
            
            # Handler separado para errores
            error_handler = logging.handlers.RotatingFileHandler(
                os.path.join(log_dir, 'errors.log'),
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=10
            )
            error_handler.setLevel(logging.ERROR)
            error_handler.setFormatter(StructuredFormatter())
            app.logger.addHandler(error_handler)
        
        # Configurar logging para bibliotecas externas
        logging.getLogger('werkzeug').setLevel(logging.WARNING)
        logging.getLogger('urllib3').setLevel(logging.WARNING)
        
        app.logger.info("Sistema de logging inicializado", extra={'extra_data': {
            'log_level': log_level,
            'debug_mode': app.config.get('DEBUG', False)
        }})

# Logger específicos para diferentes componentes
def get_logger(name: str) -> logging.Logger:
    """Obtiene un logger específico para un componente"""
    logger = logging.getLogger(f"barberias.{name}")
    logger.setLevel(logging.INFO)
    return logger

# Loggers especializados
auth_logger = get_logger('auth')
api_logger = get_logger('api')
cache_logger = get_logger('cache')
db_logger = get_logger('database')
google_logger = get_logger('google_places')

def log_api_call(endpoint_name: str = ""):
    """Decorador para loggear llamadas a API"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            
            # Log de inicio
            api_logger.info(f"API call started: {endpoint_name or func.__name__}", extra={
                'extra_data': {
                    'endpoint': endpoint_name or func.__name__,
                    'args_count': len(args),
                    'kwargs_count': len(kwargs)
                }
            })
            
            try:
                result = func(*args, **kwargs)
                
                # Log de éxito
                duration = (datetime.utcnow() - start_time).total_seconds()
                api_logger.info(f"API call completed: {endpoint_name or func.__name__}", extra={
                    'extra_data': {
                        'endpoint': endpoint_name or func.__name__,
                        'duration_seconds': duration,
                        'status': 'success'
                    }
                })
                
                return result
                
            except Exception as e:
                # Log de error
                duration = (datetime.utcnow() - start_time).total_seconds()
                api_logger.error(f"API call failed: {endpoint_name or func.__name__}", extra={
                    'extra_data': {
                        'endpoint': endpoint_name or func.__name__,
                        'duration_seconds': duration,
                        'status': 'error',
                        'error_type': type(e).__name__,
                        'error_message': str(e)
                    }
                }, exc_info=True)
                
                raise
        
        return wrapper
    return decorator

def log_auth_event(event_type: str, user_id: Optional[int] = None, extra_data: Dict[str, Any] = None):
    """Log específico para eventos de autenticación"""
    auth_logger.info(f"Auth event: {event_type}", extra={
        'extra_data': {
            'event_type': event_type,
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            **(extra_data or {})
        }
    })

def log_cache_event(event_type: str, cache_key: str, hit: bool = None, extra_data: Dict[str, Any] = None):
    """Log específico para eventos de caché"""
    cache_logger.debug(f"Cache event: {event_type}", extra={
        'extra_data': {
            'event_type': event_type,
            'cache_key': cache_key[:100],  # Truncar claves largas
            'cache_hit': hit,
            'timestamp': datetime.utcnow().isoformat(),
            **(extra_data or {})
        }
    })

def log_db_query(query_type: str, table: str, duration: float = None, extra_data: Dict[str, Any] = None):
    """Log específico para queries de base de datos"""
    db_logger.debug(f"DB query: {query_type} on {table}", extra={
        'extra_data': {
            'query_type': query_type,
            'table': table,
            'duration_seconds': duration,
            'timestamp': datetime.utcnow().isoformat(),
            **(extra_data or {})
        }
    })

def log_google_api_call(api_type: str, success: bool, duration: float = None, extra_data: Dict[str, Any] = None):
    """Log específico para llamadas a Google Places API"""
    level = logging.INFO if success else logging.WARNING
    google_logger.log(level, f"Google API call: {api_type}", extra={
        'extra_data': {
            'api_type': api_type,
            'success': success,
            'duration_seconds': duration,
            'timestamp': datetime.utcnow().isoformat(),
            **(extra_data or {})
        }
    })

def log_security_event(event_type: str, severity: str = "medium", extra_data: Dict[str, Any] = None):
    """Log específico para eventos de seguridad"""
    security_logger = get_logger('security')
    
    level_map = {
        'low': logging.INFO,
        'medium': logging.WARNING,
        'high': logging.ERROR,
        'critical': logging.CRITICAL
    }
    
    level = level_map.get(severity, logging.WARNING)
    
    security_logger.log(level, f"Security event: {event_type}", extra={
        'extra_data': {
            'event_type': event_type,
            'severity': severity,
            'timestamp': datetime.utcnow().isoformat(),
            **(extra_data or {})
        }
    })

# Middleware para logging automático de requests
def setup_request_logging(app):
    """Configura logging automático de requests"""
    
    @app.before_request
    def before_request():
        g.start_time = datetime.utcnow()
        
        # Log del request entrante
        api_logger.info("Request started", extra={
            'extra_data': {
                'method': request.method,
                'url': request.url,
                'endpoint': request.endpoint,
                'remote_addr': request.remote_addr,
                'content_length': request.content_length
            }
        })
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            duration = (datetime.utcnow() - g.start_time).total_seconds()
            
            # Log del response
            api_logger.info("Request completed", extra={
                'extra_data': {
                    'method': request.method,
                    'url': request.url,
                    'endpoint': request.endpoint,
                    'status_code': response.status_code,
                    'duration_seconds': duration,
                    'content_length': response.content_length
                }
            })
        
        return response

# Función para generar reportes de logs
def generate_log_stats(log_file: str = 'logs/app.log') -> Dict[str, Any]:
    """Genera estadísticas básicas de los logs"""
    if not os.path.exists(log_file):
        return {'error': 'Log file not found'}
    
    stats = {
        'total_lines': 0,
        'by_level': {},
        'by_module': {},
        'errors': [],
        'recent_entries': []
    }
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                
                stats['total_lines'] += 1
                
                try:
                    log_entry = json.loads(line)
                    level = log_entry.get('level', 'UNKNOWN')
                    module = log_entry.get('module', 'unknown')
                    
                    stats['by_level'][level] = stats['by_level'].get(level, 0) + 1
                    stats['by_module'][module] = stats['by_module'].get(module, 0) + 1
                    
                    if level == 'ERROR':
                        stats['errors'].append({
                            'timestamp': log_entry.get('timestamp'),
                            'message': log_entry.get('message'),
                            'module': module
                        })
                    
                    # Mantener solo las últimas 10 entradas
                    stats['recent_entries'].append(log_entry)
                    if len(stats['recent_entries']) > 10:
                        stats['recent_entries'].pop(0)
                        
                except json.JSONDecodeError:
                    continue
    
    except Exception as e:
        stats['error'] = str(e)
    
    return stats