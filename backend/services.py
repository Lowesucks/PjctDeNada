import os
import googlemaps
from functools import lru_cache
from typing import Any
import math
import jwt
from datetime import datetime, timedelta, timezone
from .models import Usuario, db

# Clave de API de Google (se lee de variables de entorno)
GOOGLE_API_KEY: str | None = os.environ.get('GOOGLE_MAPS_API_KEY')

# Configuración JWT
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'tu-clave-secreta-cambiar-en-produccion')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

@lru_cache(maxsize=32)
def buscar_barberias_google_places(lat: float, lng: float, radio: int = 5000) -> list[dict[str, Any]]:
    """
    Busca barberías, peluquerías y salones de belleza cercanos usando la API de Google Places.
    Utiliza caché para evitar llamadas repetidas a la API con las mismas coordenadas.
    """
    if not GOOGLE_API_KEY:
        print("API Key de Google no configurada. Saltando búsqueda en Google Places.")
        return []

    try:
        gmaps = googlemaps.Client(key=GOOGLE_API_KEY)
        
        # Se realiza una única búsqueda por palabras clave para mayor precisión
        places_result = gmaps.places_nearby(  # type: ignore[attr-defined, unknown-member]
            location=(lat, lng),
            radius=radio,
            keyword='barbería OR peluquería OR "salón de belleza"',
            language='es'
        )
        
        barberias_encontradas: list[dict[str, Any]] = []
        for place in places_result.get('results', []):
            # Evitar duplicados por ID de lugar
            if any(b['google_place_id'] == place.get('place_id') for b in barberias_encontradas):
                continue

            location = place.get('geometry', {}).get('location', {})
            calificacion = float(place.get('rating', 0))
            total_calificaciones = int(place.get('user_ratings_total', 0))

            barberia = {
                'id': f"gm_{place.get('place_id')}",
                'nombre': place.get('name', 'Establecimiento'),
                'direccion': place.get('vicinity', 'Dirección no disponible'),
                'latitud': location.get('lat'),
                'longitud': location.get('lng'),
                'calificacion_promedio': calificacion,
                'total_calificaciones': total_calificaciones,
                'fuente': 'google',
                'google_place_id': place.get('place_id'),
                'telefono': 'No disponible', # Places Nearby no da teléfono, se necesitaría Place Details
                'horario': 'No disponible', # Igual que el teléfono
            }
            barberias_encontradas.append(barberia)
            
        return barberias_encontradas

    except Exception as e:
        print(f"Error al buscar en Google Places: {str(e)}")
        return []

def buscar_barberias_por_texto(query: str, lat: float = 19.432608, lng: float = -99.133209) -> list[dict[str, Any]]:
    """
    Busca barberías usando Google Places Text Search API.
    Más preciso para búsquedas por texto.
    """
    if not GOOGLE_API_KEY:
        print("API Key de Google no configurada. Saltando búsqueda en Google Places.")
        return []

    try:
        gmaps = googlemaps.Client(key=GOOGLE_API_KEY)
        
        # Construir query de búsqueda más específica
        search_query = f"{query} barbería peluquería"
        
        # Usar Text Search API para búsquedas más precisas
        places_result = gmaps.places(  # type: ignore[attr-defined, unknown-member]
            query=search_query,
            location=(lat, lng),
            radius=25000,  # Radio más pequeño para resultados más cercanos
            language='es',
            type='hair_care'  # Especificar tipo de negocio
        )
        
        barberias_encontradas: list[dict[str, Any]] = []
        for place in places_result.get('results', []):
            # Evitar duplicados por ID de lugar
            if any(b['google_place_id'] == place.get('place_id') for b in barberias_encontradas):
                continue

            location = place.get('geometry', {}).get('location', {})
            calificacion = float(place.get('rating', 0))
            total_calificaciones = int(place.get('user_ratings_total', 0))

            barberia = {
                'id': f"gm_{place.get('place_id')}",
                'nombre': place.get('name', 'Establecimiento'),
                'direccion': place.get('formatted_address', place.get('vicinity', 'Dirección no disponible')),
                'latitud': location.get('lat'),
                'longitud': location.get('lng'),
                'calificacion_promedio': calificacion,
                'total_calificaciones': total_calificaciones,
                'fuente': 'google',
                'google_place_id': place.get('place_id'),
                'telefono': 'No disponible',
                'horario': 'No disponible',
            }
            barberias_encontradas.append(barberia)
            
        return barberias_encontradas

    except Exception as e:
        print(f"Error al buscar en Google Places Text Search: {str(e)}")
        return []

def calcular_distancia(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calcula la distancia entre dos puntos usando la fórmula de Haversine"""
    R = 6371  # Radio de la Tierra en km
    
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)
    
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# ==================== SERVICIOS DE USUARIOS ====================

def crear_usuario(username: str, email: str, password: str, nombre_completo: str, telefono: str = None) -> dict[str, Any]:
    """Crea un nuevo usuario"""
    try:
        # Verificar si el usuario ya existe
        if Usuario.query.filter_by(username=username).first():
            return {'error': 'El nombre de usuario ya existe'}, 400
        
        if Usuario.query.filter_by(email=email).first():
            return {'error': 'El email ya está registrado'}, 400
        
        # Crear nuevo usuario
        nuevo_usuario = Usuario(
            username=username,
            email=email,
            nombre_completo=nombre_completo,
            telefono=telefono
        )
        nuevo_usuario.set_password(password)
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        return {'mensaje': 'Usuario creado exitosamente', 'usuario': nuevo_usuario.to_dict()}, 201
        
    except Exception as e:
        db.session.rollback()
        return {'error': f'Error al crear usuario: {str(e)}'}, 500

def autenticar_usuario(username: str, password: str) -> dict[str, Any]:
    """Autentica un usuario y retorna token JWT"""
    try:
        usuario = Usuario.query.filter_by(username=username).first()
        
        if not usuario or not usuario.check_password(password):
            return {'error': 'Credenciales inválidas'}, 401
        
        if not usuario.activo:
            return {'error': 'Usuario desactivado'}, 401
        
        # Actualizar último acceso
        usuario.ultimo_acceso = datetime.now(timezone.utc)
        db.session.commit()
        
        # Generar token JWT
        token = generar_token_jwt(usuario.id)
        
        return {
            'mensaje': 'Autenticación exitosa',
            'token': token,
            'usuario': usuario.to_dict()
        }, 200
        
    except Exception as e:
        return {'error': f'Error en autenticación: {str(e)}'}, 500

def generar_token_jwt(user_id: int) -> str:
    """Genera un token JWT para el usuario"""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verificar_token_jwt(token: str) -> dict[str, Any]:
    """Verifica y decodifica un token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return {'valido': True, 'user_id': payload['user_id']}
    except jwt.ExpiredSignatureError:
        return {'valido': False, 'error': 'Token expirado'}
    except jwt.InvalidTokenError:
        return {'valido': False, 'error': 'Token inválido'}

def obtener_usuario_por_id(user_id: int) -> Usuario:
    """Obtiene un usuario por su ID"""
    return Usuario.query.get(user_id)

def actualizar_usuario(user_id: int, datos: dict[str, Any]) -> dict[str, Any]:
    """Actualiza los datos de un usuario"""
    try:
        usuario = Usuario.query.get(user_id)
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Campos permitidos para actualizar
        campos_permitidos = ['nombre_completo', 'telefono', 'email']
        
        for campo in campos_permitidos:
            if campo in datos:
                setattr(usuario, campo, datos[campo])
        
        db.session.commit()
        return {'mensaje': 'Usuario actualizado exitosamente', 'usuario': usuario.to_dict()}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': f'Error al actualizar usuario: {str(e)}'}, 500

def cambiar_password(user_id: int, password_actual: str, password_nuevo: str) -> dict[str, Any]:
    """Cambia la contraseña de un usuario"""
    try:
        usuario = Usuario.query.get(user_id)
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        if not usuario.check_password(password_actual):
            return {'error': 'Contraseña actual incorrecta'}, 400
        
        usuario.set_password(password_nuevo)
        db.session.commit()
        
        return {'mensaje': 'Contraseña cambiada exitosamente'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': f'Error al cambiar contraseña: {str(e)}'}, 500 