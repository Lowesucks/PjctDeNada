"""
Sistema de validaciones robustas para inputs del usuario
"""

import re
from typing import Any, Dict, List, Optional, Tuple
from flask import request
from functools import wraps

class ValidationError(Exception):
    """Excepción personalizada para errores de validación"""
    pass

class InputValidator:
    """Validador principal para inputs de usuario"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Valida formato de email"""
        if not email or len(email) > 254:
            return False
        
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password(password: str) -> Tuple[bool, str]:
        """Valida fortaleza de contraseña"""
        if not password:
            return False, "La contraseña es requerida"
        
        if len(password) < 8:
            return False, "La contraseña debe tener al menos 8 caracteres"
        
        if len(password) > 128:
            return False, "La contraseña no puede exceder 128 caracteres"
        
        # Verificar que tenga al menos una letra y un número
        if not re.search(r'[a-zA-Z]', password):
            return False, "La contraseña debe contener al menos una letra"
        
        if not re.search(r'\d', password):
            return False, "La contraseña debe contener al menos un número"
        
        # Verificar caracteres prohibidos
        if re.search(r'[<>"\']', password):
            return False, "La contraseña contiene caracteres no permitidos"
        
        return True, "Contraseña válida"
    
    @staticmethod
    def validate_username(username: str) -> Tuple[bool, str]:
        """Valida username"""
        if not username:
            return False, "El username es requerido"
        
        if len(username) < 3:
            return False, "El username debe tener al menos 3 caracteres"
        
        if len(username) > 50:
            return False, "El username no puede exceder 50 caracteres"
        
        # Solo alfanuméricos, guiones y guiones bajos
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            return False, "El username solo puede contener letras, números, guiones y guiones bajos"
        
        return True, "Username válido"
    
    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, str]:
        """Valida número de teléfono"""
        if not phone:
            return True, "Teléfono opcional"  # Es opcional
        
        # Remover espacios y caracteres especiales comunes
        clean_phone = re.sub(r'[\s\-\(\)\+]', '', phone)
        
        if len(clean_phone) < 10:
            return False, "El teléfono debe tener al menos 10 dígitos"
        
        if len(clean_phone) > 15:
            return False, "El teléfono no puede exceder 15 dígitos"
        
        if not clean_phone.isdigit():
            return False, "El teléfono solo puede contener números"
        
        return True, "Teléfono válido"
    
    @staticmethod
    def validate_coordinates(lat: float, lng: float) -> Tuple[bool, str]:
        """Valida coordenadas geográficas"""
        try:
            lat_float = float(lat)
            lng_float = float(lng)
            
            if not (-90 <= lat_float <= 90):
                return False, "Latitud debe estar entre -90 y 90"
            
            if not (-180 <= lng_float <= 180):
                return False, "Longitud debe estar entre -180 y 180"
            
            return True, "Coordenadas válidas"
            
        except (ValueError, TypeError):
            return False, "Coordenadas deben ser números válidos"
    
    @staticmethod
    def validate_rating(rating: int) -> Tuple[bool, str]:
        """Valida calificación (1-5 estrellas)"""
        try:
            rating_int = int(rating)
            if not (1 <= rating_int <= 5):
                return False, "La calificación debe estar entre 1 y 5"
            return True, "Calificación válida"
        except (ValueError, TypeError):
            return False, "La calificación debe ser un número entero"
    
    @staticmethod
    def validate_search_query(query: str) -> Tuple[bool, str]:
        """Valida query de búsqueda"""
        if not query:
            return False, "La búsqueda no puede estar vacía"
        
        if len(query.strip()) < 2:
            return False, "La búsqueda debe tener al menos 2 caracteres"
        
        if len(query) > 100:
            return False, "La búsqueda no puede exceder 100 caracteres"
        
        # Evitar inyecciones básicas
        dangerous_patterns = [';', '--', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT', 'UPDATE']
        query_upper = query.upper()
        
        for pattern in dangerous_patterns:
            if pattern.upper() in query_upper:
                return False, "La búsqueda contiene caracteres no permitidos"
        
        return True, "Búsqueda válida"
    
    @staticmethod
    def sanitize_text(text: str, max_length: int = 500) -> str:
        """Sanitiza texto general"""
        if not text:
            return ""
        
        # Remover caracteres peligrosos
        sanitized = re.sub(r'[<>"\']', '', text)
        
        # Truncar si es muy largo
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized.strip()

# Decoradores para validación automática
def validate_json_input(required_fields: List[str] = None, optional_fields: List[str] = None):
    """Decorador para validar input JSON"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return {'error': 'Se requiere JSON válido'}, 400
            
            # Validar campos requeridos
            if required_fields:
                for field in required_fields:
                    if field not in data or not data[field]:
                        return {'error': f'Campo {field} es requerido'}, 400
            
            # Validar que no haya campos extras
            allowed_fields = set(required_fields or []) | set(optional_fields or [])
            extra_fields = set(data.keys()) - allowed_fields
            
            if extra_fields:
                return {'error': f'Campos no permitidos: {", ".join(extra_fields)}'}, 400
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def validate_user_registration():
    """Validaciones específicas para registro de usuario"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return {'error': 'Datos JSON requeridos'}, 400
            
            # Validar username
            username = data.get('username', '')
            valid, message = InputValidator.validate_username(username)
            if not valid:
                return {'error': message}, 400
            
            # Validar email
            email = data.get('email', '')
            if not InputValidator.validate_email(email):
                return {'error': 'Formato de email inválido'}, 400
            
            # Validar password
            password = data.get('password', '')
            valid, message = InputValidator.validate_password(password)
            if not valid:
                return {'error': message}, 400
            
            # Validar nombre completo
            nombre_completo = data.get('nombre_completo', '')
            if not nombre_completo or len(nombre_completo.strip()) < 2:
                return {'error': 'Nombre completo es requerido (mínimo 2 caracteres)'}, 400
            
            if len(nombre_completo) > 100:
                return {'error': 'Nombre completo no puede exceder 100 caracteres'}, 400
            
            # Validar teléfono (opcional)
            telefono = data.get('telefono', '')
            if telefono:
                valid, message = InputValidator.validate_phone(telefono)
                if not valid:
                    return {'error': message}, 400
            
            # Sanitizar inputs
            data['username'] = InputValidator.sanitize_text(username, 50)
            data['email'] = email.lower().strip()
            data['nombre_completo'] = InputValidator.sanitize_text(nombre_completo, 100)
            if telefono:
                data['telefono'] = InputValidator.sanitize_text(telefono, 20)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def validate_barberia_rating():
    """Validaciones para calificar barbería"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return {'error': 'Datos JSON requeridos'}, 400
            
            # Validar calificación
            calificacion = data.get('calificacion')
            if calificacion is None:
                return {'error': 'Calificación es requerida'}, 400
            
            valid, message = InputValidator.validate_rating(calificacion)
            if not valid:
                return {'error': message}, 400
            
            # Validar comentario (opcional)
            comentario = data.get('comentario', '')
            if len(comentario) > 1000:
                return {'error': 'El comentario no puede exceder 1000 caracteres'}, 400
            
            # Sanitizar comentario
            if comentario:
                data['comentario'] = InputValidator.sanitize_text(comentario, 1000)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def validate_search_params():
    """Validaciones para parámetros de búsqueda"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Validar query de búsqueda
            query = request.args.get('q', '')
            if query:
                valid, message = InputValidator.validate_search_query(query)
                if not valid:
                    return {'error': message}, 400
            
            # Validar coordenadas (si están presentes)
            lat = request.args.get('lat')
            lng = request.args.get('lng')
            
            if lat is not None and lng is not None:
                try:
                    lat_float = float(lat)
                    lng_float = float(lng)
                    valid, message = InputValidator.validate_coordinates(lat_float, lng_float)
                    if not valid:
                        return {'error': message}, 400
                except (ValueError, TypeError):
                    return {'error': 'Coordenadas deben ser números válidos'}, 400
            
            # Validar radio (si está presente)
            radio = request.args.get('radio')
            if radio is not None:
                try:
                    radio_int = int(radio)
                    if not (100 <= radio_int <= 50000):  # Entre 100m y 50km
                        return {'error': 'El radio debe estar entre 100 y 50000 metros'}, 400
                except (ValueError, TypeError):
                    return {'error': 'El radio debe ser un número entero'}, 400
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Función utilitaria para validar IDs
def validate_id_param(param_name: str, value: Any) -> Tuple[bool, str]:
    """Valida que un parámetro sea un ID válido"""
    try:
        id_value = int(value)
        if id_value <= 0:
            return False, f'{param_name} debe ser un número positivo'
        if id_value > 2147483647:  # Máximo para INTEGER en SQLite
            return False, f'{param_name} excede el valor máximo permitido'
        return True, "ID válido"
    except (ValueError, TypeError):
        return False, f'{param_name} debe ser un número entero válido'