"""
Sistema de caché para optimizar el rendimiento de consultas frecuentes
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Optional, Callable
from flask import current_app

class SimpleCache:
    """Cache simple en memoria para desarrollo"""
    
    def __init__(self):
        self._cache = {}
        self._expiry = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Obtiene un valor del caché"""
        if key in self._cache:
            if key in self._expiry and datetime.now() > self._expiry[key]:
                # Clave expirada
                del self._cache[key]
                del self._expiry[key]
                return None
            return self._cache[key]
        return None
    
    def set(self, key: str, value: Any, timeout: int = 300) -> None:
        """Guarda un valor en el caché"""
        self._cache[key] = value
        self._expiry[key] = datetime.now() + timedelta(seconds=timeout)
    
    def delete(self, key: str) -> None:
        """Elimina una clave del caché"""
        if key in self._cache:
            del self._cache[key]
        if key in self._expiry:
            del self._expiry[key]
    
    def clear(self) -> None:
        """Limpia todo el caché"""
        self._cache.clear()
        self._expiry.clear()
    
    def stats(self) -> dict:
        """Obtiene estadísticas del caché"""
        now = datetime.now()
        active_keys = 0
        expired_keys = 0
        
        for key in self._cache:
            if key in self._expiry and now > self._expiry[key]:
                expired_keys += 1
            else:
                active_keys += 1
        
        return {
            'total_keys': len(self._cache),
            'active_keys': active_keys,
            'expired_keys': expired_keys,
            'memory_usage_mb': self._estimate_memory_usage()
        }
    
    def _estimate_memory_usage(self) -> float:
        """Estima el uso de memoria del caché"""
        try:
            cache_str = json.dumps(self._cache, default=str)
            return len(cache_str.encode('utf-8')) / (1024 * 1024)  # MB
        except:
            return 0.0

# Instancia global del caché
cache = SimpleCache()

def generate_cache_key(*args, **kwargs) -> str:
    """Genera una clave de caché basada en los argumentos"""
    key_data = {
        'args': args,
        'kwargs': sorted(kwargs.items()) if kwargs else None
    }
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode('utf-8')).hexdigest()

def cached(timeout: int = 300, key_prefix: str = ""):
    """Decorador para cachear resultados de funciones"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generar clave de caché
            cache_key = f"{key_prefix}:{func.__name__}:{generate_cache_key(*args, **kwargs)}"
            
            # Intentar obtener del caché
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                print(f"💾 Cache HIT: {cache_key[:50]}...")
                return cached_result
            
            # Ejecutar función y cachear resultado
            print(f"🔄 Cache MISS: {cache_key[:50]}...")
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern: str) -> int:
    """Invalida todas las claves de caché que coincidan con un patrón"""
    invalidated = 0
    keys_to_delete = []
    
    for key in cache._cache.keys():
        if pattern in key:
            keys_to_delete.append(key)
    
    for key in keys_to_delete:
        cache.delete(key)
        invalidated += 1
    
    return invalidated

def warm_up_cache():
    """Pre-carga el caché con datos frecuentemente consultados"""
    try:
        from .models import Barberia, Calificacion
        from .services import buscar_barberias_google_places
        
        print("🔥 Iniciando calentamiento de caché...")
        
        # Cachear barberías más populares
        barberias_populares = (Barberia.query
                              .filter(Barberia.total_calificaciones > 0)
                              .order_by(Barberia.calificacion_promedio.desc())
                              .limit(10)
                              .all())
        
        for barberia in barberias_populares:
            cache_key = f"barberia:details:{barberia.id}"
            barberia_data = {
                'id': barberia.id,
                'nombre': barberia.nombre,
                'direccion': barberia.direccion,
                'telefono': barberia.telefono,
                'horario': barberia.horario,
                'latitud': barberia.latitud,
                'longitud': barberia.longitud,
                'calificacion_promedio': round(barberia.calificacion_promedio, 1),
                'total_calificaciones': barberia.total_calificaciones,
            }
            cache.set(cache_key, barberia_data, 600)  # 10 minutos
        
        print(f"✅ Caché calentado con {len(barberias_populares)} barberías populares")
        
    except Exception as e:
        print(f"❌ Error al calentar caché: {str(e)}")

def cache_stats() -> dict:
    """Obtiene estadísticas detalladas del caché"""
    stats = cache.stats()
    
    # Agrupar por prefijos
    prefixes = {}
    for key in cache._cache.keys():
        prefix = key.split(':')[0] if ':' in key else 'unknown'
        prefixes[prefix] = prefixes.get(prefix, 0) + 1
    
    stats['by_prefix'] = prefixes
    return stats

# Decoradores específicos para diferentes tipos de datos
def cache_barberia_details(timeout: int = 600):
    """Caché específico para detalles de barberías (10 minutos)"""
    return cached(timeout=timeout, key_prefix="barberia_details")

def cache_barberia_search(timeout: int = 300):
    """Caché específico para búsquedas de barberías (5 minutos)"""
    return cached(timeout=timeout, key_prefix="barberia_search")

def cache_google_places(timeout: int = 1800):
    """Caché específico para resultados de Google Places (30 minutos)"""
    return cached(timeout=timeout, key_prefix="google_places")

def cache_user_favorites(timeout: int = 120):
    """Caché específico para favoritos de usuario (2 minutos)"""
    return cached(timeout=timeout, key_prefix="user_favorites")

# Funciones para invalidar caché específico
def invalidate_barberia_cache(barberia_id: int) -> None:
    """Invalida el caché relacionado con una barbería específica"""
    patterns = [
        f"barberia_details:obtener_barberia:{barberia_id}",
        f"barberia_search:",
        f"barberia:details:{barberia_id}"
    ]
    
    total_invalidated = 0
    for pattern in patterns:
        total_invalidated += invalidate_cache_pattern(pattern)
    
    print(f"🗑️ Invalidado caché de barbería {barberia_id}: {total_invalidated} claves")

def invalidate_user_cache(user_id: int) -> None:
    """Invalida el caché relacionado con un usuario específico"""
    patterns = [
        f"user_favorites:obtener_favoritos:{user_id}",
        f"user_favorites:"
    ]
    
    total_invalidated = 0
    for pattern in patterns:
        total_invalidated += invalidate_cache_pattern(pattern)
    
    print(f"🗑️ Invalidado caché de usuario {user_id}: {total_invalidated} claves")

def setup_cache_cleanup():
    """Configura limpieza automática del caché"""
    import atexit
    
    def cleanup_cache():
        print("Limpiando cache al cerrar aplicacion...")
        cache.clear()
    
    atexit.register(cleanup_cache)