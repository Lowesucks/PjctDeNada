from flask import request, jsonify, Blueprint
from typing import Any
from .models import db, Barberia, Calificacion, Usuario, Favorito
from .services import (
    buscar_barberias_google_places, buscar_barberias_por_texto, calcular_distancia,
    crear_usuario, autenticar_usuario, verificar_token_jwt, obtener_usuario_por_id,
    actualizar_usuario, cambiar_password
)
from .cache_manager import (
    cache_barberia_details, cache_barberia_search, cache_user_favorites,
    invalidate_barberia_cache, invalidate_user_cache
)
from .validators import (
    validate_user_registration, validate_barberia_rating, validate_search_params,
    validate_json_input, validate_id_param
)
from .logging_config import log_api_call, log_auth_event, log_security_event
from functools import wraps

# ==================== DECORADORES DE AUTENTICACIÓN ====================

def token_required(f):
    """Decorador para proteger rutas que requieren autenticación"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Obtener token del header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Token inválido'}), 401
        
        if not token:
            return jsonify({'error': 'Token requerido'}), 401
        
        # Verificar token
        token_data = verificar_token_jwt(token)
        if not token_data['valido']:
            return jsonify({'error': token_data['error']}), 401
        
        # Obtener usuario
        current_user = obtener_usuario_por_id(token_data['user_id'])
        if not current_user:
            return jsonify({'error': 'Usuario no encontrado'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# ==================== RUTAS DE BARBERÍAS (EXISTENTES) ====================

@log_api_call("obtener_barberias")
@cache_barberia_search(timeout=300)  # 5 minutos de caché
def obtener_barberias() -> list[dict[str, Any]]:
    try:
        barberias = Barberia.query.all()
        return [
            {
                'id': b.id,
                'nombre': b.nombre,
                'direccion': b.direccion,
                'telefono': b.telefono,
                'horario': b.horario,
                'latitud': b.latitud,
                'longitud': b.longitud,
                'calificacion_promedio': round(b.calificacion_promedio, 1),
                'total_calificaciones': b.total_calificaciones
            } for b in barberias
        ]
    except Exception as e:
        print(f"Error en obtener_barberias: {e}")
        return []

def crear_barberia() -> tuple[dict[str, Any], int]:
    data: dict[str, Any] = request.get_json()
    if not data:
        return {'error': 'Datos JSON requeridos'}, 400
    
    nueva_barberia = Barberia(
        nombre=data.get('nombre', ''),
        direccion=data.get('direccion', ''),
        telefono=data.get('telefono', ''),
        horario=data.get('horario', '')
    )
    db.session.add(nueva_barberia)
    db.session.commit()
    return {'mensaje': 'Barbería creada exitosamente', 'id': nueva_barberia.id}, 201

@cache_barberia_details(timeout=600)  # 10 minutos de caché
def obtener_barberia(barberia_id: int) -> dict[str, Any]:
    # Optimización: usar joinedload para evitar N+1 queries
    from sqlalchemy.orm import joinedload
    
    barberia = Barberia.query.get_or_404(barberia_id)
    
    # Optimización: una sola query con join para cargar usuario y calificaciones
    calificaciones = (Calificacion.query
                     .options(joinedload(Calificacion.usuario))
                     .filter_by(barberia_id=barberia_id)
                     .order_by(Calificacion.fecha.desc())
                     .limit(50)  # Limitar resultados para performance
                     .all())
    
    return {
        'id': barberia.id,
        'nombre': barberia.nombre,
        'direccion': barberia.direccion,
        'telefono': barberia.telefono,
        'horario': barberia.horario,
        'latitud': barberia.latitud,
        'longitud': barberia.longitud,
        'calificacion_promedio': round(barberia.calificacion_promedio, 1),
        'total_calificaciones': barberia.total_calificaciones,
        'calificaciones': [
            {
                'id': c.id,
                'nombre_usuario': c.usuario.nombre_completo if c.usuario else c.nombre_usuario,
                'calificacion': c.calificacion,
                'comentario': c.comentario,
                'fecha': c.fecha.strftime('%d/%m/%Y %H:%M')
            } for c in calificaciones
        ]
    }

@validate_barberia_rating()
def calificar_barberia(barberia_id: int) -> tuple[dict[str, Any], int]:
    barberia = Barberia.query.get_or_404(barberia_id)
    data: dict[str, Any] = request.get_json()
    
    if not data:
        return {'error': 'Datos JSON requeridos'}, 400
    
    # Obtener usuario del token (si está autenticado)
    usuario_actual = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        try:
            token = auth_header.split(" ")[1]
            token_data = verificar_token_jwt(token)
            if token_data['valido']:
                usuario_actual = obtener_usuario_por_id(token_data['user_id'])
        except:
            pass
    
    nueva_calificacion = Calificacion(
        barberia_id=barberia_id,
        usuario_id=usuario_actual.id if usuario_actual else None,
        calificacion=data.get('calificacion', 0),
        comentario=data.get('comentario', ''),
        nombre_usuario=data.get('nombre_usuario', '') if not usuario_actual else None
    )
    
    db.session.add(nueva_calificacion)
    
    # Actualizar promedio de calificaciones
    todas_calificaciones = Calificacion.query.filter_by(barberia_id=barberia_id).all()
    total = len(todas_calificaciones) + 1
    suma = sum(c.calificacion for c in todas_calificaciones) + data.get('calificacion', 0)
    barberia.calificacion_promedio = suma / total
    barberia.total_calificaciones = total
    
    db.session.commit()
    
    # Invalidar caché relacionado con esta barbería
    invalidate_barberia_cache(barberia_id)
    
    return {'mensaje': 'Calificación agregada exitosamente'}, 201

# Definición de categorías y palabras clave asociadas
CATEGORY_KEYWORDS = {
    'barberias': ['barbería', 'barber shop'],
    'peluquerias': ['peluquería', 'salón de belleza', 'estética'],
    'unas': ['salón de uñas', 'manicura', 'pedicura'],
    'spa': ['spa', 'masajes']
}

@validate_search_params()
def buscar_barberias() -> list[dict[str, Any]]:
    try:
        query: str = request.args.get('q', '').lower()
        lat_user = request.args.get('lat')
        lng_user = request.args.get('lng')
        
        todas_barberias = []
        
        # Buscar en base de datos local (si aplica)
        # Esta parte se mantiene por si en el futuro se guardan lugares manualmente
        if query.strip():
            barberias_db = Barberia.query.filter(
                db.or_(
                    db.func.lower(Barberia.nombre).ilike(f'%{query}%'),
                    db.func.lower(Barberia.direccion).ilike(f'%{query}%')
                )
            ).all()
            for barberia in barberias_db:
                # ... (código para añadir barberías de la DB)
                pass

        # Buscar en Google Places API usando el texto del usuario
        if query.strip() and lat_user and lng_user:
            lat = float(lat_user)
            lng = float(lng_user)
            
            # La función de servicio ahora solo usa el query del usuario
            barberias_google = buscar_barberias_por_texto(query, lat, lng)
            
            for barberia in barberias_google:
                barberia['lat'] = barberia.get('latitud')
                barberia['lng'] = barberia.get('longitud')
                distancia = calcular_distancia(lat, lng, barberia['lat'], barberia['lng'])
                barberia['distancia'] = distancia
                todas_barberias.append(barberia)

        # Ordenar por distancia si se proporcionó la ubicación del usuario
        if lat_user and lng_user:
            todas_barberias.sort(key=lambda x: x.get('distancia', float('inf')))
        
        return todas_barberias
        
    except Exception as e:
        print(f"Error en buscar_barberias: {e}")
        return []

@validate_search_params()
def buscar_barberias_cercanas() -> list[dict[str, Any]]:
    try:
        lat = float(request.args.get('lat', 0))
        lng = float(request.args.get('lng', 0))
        radio = int(request.args.get('radio', 5000))
        
        # Obtener categorías del request, si no hay, usar todas
        categorias_req = request.args.get('categorias')
        if categorias_req:
            categorias_seleccionadas = categorias_req.split(',')
        else:
            categorias_seleccionadas = list(CATEGORY_KEYWORDS.keys())

        # Construir la lista de términos de búsqueda
        search_terms = []
        for cat in categorias_seleccionadas:
            if cat in CATEGORY_KEYWORDS:
                search_terms.extend(CATEGORY_KEYWORDS[cat])
        
        if not search_terms:
             return []

        barberias_google = []
        for term in set(search_terms): # Usar set para evitar búsquedas duplicadas
            try:
                # La función de servicio ahora recibe el término de búsqueda
                barberias_term = buscar_barberias_google_places(lat, lng, term, radio)
                barberias_google.extend(barberias_term)
            except Exception as e:
                print(f"Error buscando con término '{term}': {e}")
                continue
        
        # Eliminar duplicados de Google Places por google_place_id
        barberias_google_unicas = []
        ids_google_vistos = set()
        for barberia in barberias_google:
            place_id = barberia.get('google_place_id')
            if place_id and place_id not in ids_google_vistos:
                ids_google_vistos.add(place_id)
                barberias_google_unicas.append(barberia)
        
        todas_barberias = []
        # Agregar barberías de Google Places calculando su distancia
        for barberia in barberias_google_unicas:
            distancia = calcular_distancia(lat, lng, barberia['latitud'], barberia['longitud'])
            barberia['distancia'] = distancia
            todas_barberias.append(barberia)
        
        # Ordenar por distancia
        todas_barberias.sort(key=lambda x: x.get('distancia', float('inf')))
        
        return todas_barberias[:40] # Limitar a 40 resultados para no sobrecargar
        
    except Exception as e:
        print(f"Error en buscar_barberias_cercanas: {e}")
        return []

# ===== ENDPOINTS PARA FAVORITOS =====

@cache_user_favorites(timeout=120)  # 2 minutos de caché para favoritos
def obtener_favoritos() -> tuple[dict[str, Any], int]:
    """Obtiene los favoritos del usuario autenticado"""
    try:
        # Verificar autenticación
        if 'Authorization' not in request.headers:
            return {'error': 'Token de autenticación requerido'}, 401
        
        auth_header = request.headers['Authorization']
        token = auth_header.split(" ")[1]
        token_data = verificar_token_jwt(token)
        
        if not token_data['valido']:
            return {'error': 'Token inválido'}, 401
        
        usuario = obtener_usuario_por_id(token_data['user_id'])
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Obtener favoritos del usuario
        favoritos = Favorito.query.filter_by(usuario_id=usuario.id).all()
        
        return {
            'favoritos': [favorito.to_dict() for favorito in favoritos],
            'total': len(favoritos)
        }, 200
        
    except Exception as e:
        print(f"Error obteniendo favoritos: {e}")
        return {'error': 'Error interno del servidor'}, 500

def agregar_favorito(barberia_id: int) -> tuple[dict[str, Any], int]:
    """Agrega una barbería a los favoritos del usuario"""
    try:
        # Verificar autenticación
        if 'Authorization' not in request.headers:
            return {'error': 'Token de autenticación requerido'}, 401
        
        auth_header = request.headers['Authorization']
        token = auth_header.split(" ")[1]
        token_data = verificar_token_jwt(token)
        
        if not token_data['valido']:
            return {'error': 'Token inválido'}, 401
        
        usuario = obtener_usuario_por_id(token_data['user_id'])
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Verificar que la barbería existe
        barberia = Barberia.query.get(barberia_id)
        if not barberia:
            return {'error': 'Barbería no encontrada'}, 404
        
        # Verificar si ya es favorito
        favorito_existente = Favorito.query.filter_by(
            usuario_id=usuario.id, 
            barberia_id=barberia_id
        ).first()
        
        if favorito_existente:
            return {'error': 'La barbería ya está en favoritos'}, 400
        
        # Crear nuevo favorito
        nuevo_favorito = Favorito(
            usuario_id=usuario.id,
            barberia_id=barberia_id
        )
        
        db.session.add(nuevo_favorito)
        db.session.commit()
        
        # Invalidar caché de favoritos del usuario
        invalidate_user_cache(usuario.id)
        
        return {
            'mensaje': 'Barbería agregada a favoritos',
            'favorito': nuevo_favorito.to_dict()
        }, 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error agregando favorito: {e}")
        return {'error': 'Error interno del servidor'}, 500

def eliminar_favorito(barberia_id: int) -> tuple[dict[str, Any], int]:
    """Elimina una barbería de los favoritos del usuario"""
    try:
        # Verificar autenticación
        if 'Authorization' not in request.headers:
            return {'error': 'Token de autenticación requerido'}, 401
        
        auth_header = request.headers['Authorization']
        token = auth_header.split(" ")[1]
        token_data = verificar_token_jwt(token)
        
        if not token_data['valido']:
            return {'error': 'Token inválido'}, 401
        
        usuario = obtener_usuario_por_id(token_data['user_id'])
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Buscar el favorito
        favorito = Favorito.query.filter_by(
            usuario_id=usuario.id, 
            barberia_id=barberia_id
        ).first()
        
        if not favorito:
            return {'error': 'La barbería no está en favoritos'}, 404
        
        # Eliminar favorito
        db.session.delete(favorito)
        db.session.commit()
        
        # Invalidar caché de favoritos del usuario
        invalidate_user_cache(usuario.id)
        
        return {'mensaje': 'Barbería eliminada de favoritos'}, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando favorito: {e}")
        return {'error': 'Error interno del servidor'}, 500

def verificar_favorito(barberia_id: int) -> tuple[dict[str, Any], int]:
    """Verifica si una barbería está en los favoritos del usuario"""
    try:
        # Verificar autenticación
        if 'Authorization' not in request.headers:
            return {'es_favorito': False}, 200
        
        auth_header = request.headers['Authorization']
        token = auth_header.split(" ")[1]
        token_data = verificar_token_jwt(token)
        
        if not token_data['valido']:
            return {'es_favorito': False}, 200
        
        usuario = obtener_usuario_por_id(token_data['user_id'])
        if not usuario:
            return {'es_favorito': False}, 200
        
        # Verificar si es favorito
        favorito = Favorito.query.filter_by(
            usuario_id=usuario.id, 
            barberia_id=barberia_id
        ).first()
        
        return {'es_favorito': favorito is not None}, 200
        
    except Exception as e:
        print(f"Error verificando favorito: {e}")
        return {'es_favorito': False}, 200

# ==================== RUTAS DE AUTENTICACIÓN Y USUARIOS ====================

@log_api_call("registrar_usuario")
@validate_user_registration()
def registrar_usuario() -> tuple[dict[str, Any], int]:
    """Registra un nuevo usuario"""
    data: dict[str, Any] = request.get_json()
    if not data:
        return {'error': 'Datos JSON requeridos'}, 400
    
    # Validar campos requeridos
    campos_requeridos = ['username', 'email', 'password', 'nombre_completo']
    for campo in campos_requeridos:
        if not data.get(campo):
            return {'error': f'Campo {campo} es requerido'}, 400
    
    # Validar longitud de contraseña
    if len(data['password']) < 6:
        return {'error': 'La contraseña debe tener al menos 6 caracteres'}, 400
    
    # Validar formato de email
    if '@' not in data['email']:
        return {'error': 'Formato de email inválido'}, 400
    
    resultado, codigo = crear_usuario(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        nombre_completo=data['nombre_completo'],
        telefono=data.get('telefono')
    )
    
    return resultado, codigo

def login_usuario() -> tuple[dict[str, Any], int]:
    """Autentica un usuario"""
    data: dict[str, Any] = request.get_json()
    if not data:
        return {'error': 'Datos JSON requeridos'}, 400
    
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return {'error': 'Username y password son requeridos'}, 400
    
    resultado, codigo = autenticar_usuario(username, password)
    return resultado, codigo

@token_required
def obtener_perfil_usuario(current_user: Usuario) -> dict[str, Any]:
    """Obtiene el perfil del usuario autenticado"""
    return current_user.to_dict()

@token_required
def actualizar_perfil_usuario(current_user: Usuario) -> tuple[dict[str, Any], int]:
    """Actualiza el perfil del usuario autenticado"""
    data: dict[str, Any] = request.get_json()
    if not data:
        return {'error': 'Datos JSON requeridos'}, 400
    
    resultado, codigo = actualizar_usuario(current_user.id, data)
    return resultado, codigo

@token_required
def cambiar_password_usuario(current_user: Usuario) -> tuple[dict[str, Any], int]:
    """Cambia la contraseña del usuario autenticado"""
    data: dict[str, Any] = request.get_json()
    if not data:
        return {'error': 'Datos JSON requeridos'}, 400
    
    password_actual = data.get('password_actual')
    password_nuevo = data.get('password_nuevo')
    
    if not password_actual or not password_nuevo:
        return {'error': 'Password actual y nuevo son requeridos'}, 400
    
    if len(password_nuevo) < 6:
        return {'error': 'La nueva contraseña debe tener al menos 6 caracteres'}, 400
    
    resultado, codigo = cambiar_password(current_user.id, password_actual, password_nuevo)
    return resultado, codigo

@token_required
def obtener_calificaciones_usuario(current_user: Usuario) -> list[dict[str, Any]]:
    """Obtiene las calificaciones del usuario autenticado"""
    try:
        calificaciones = Calificacion.query.filter_by(usuario_id=current_user.id).order_by(Calificacion.fecha.desc()).all()
        
        return [
            {
                'id': c.id,
                'barberia_id': c.barberia_id,
                'barberia_nombre': c.barberia.nombre,
                'calificacion': c.calificacion,
                'comentario': c.comentario,
                'fecha': c.fecha.strftime('%d/%m/%Y %H:%M')
            } for c in calificaciones
        ]
    except Exception as e:
        print(f"Error al obtener calificaciones del usuario: {e}")
        return []

usuarios_bp = Blueprint('usuarios', __name__)

# Registro de usuario
usuarios_bp.route('/api/auth/register', methods=['POST'])(registrar_usuario)

# Login de usuario
usuarios_bp.route('/api/auth/login', methods=['POST'])(login_usuario)

# Obtener perfil
usuarios_bp.route('/api/auth/profile', methods=['GET'])(obtener_perfil_usuario)

# Actualizar perfil
usuarios_bp.route('/api/auth/update', methods=['POST'])(actualizar_perfil_usuario)

# Cambiar contraseña
usuarios_bp.route('/api/auth/change-password', methods=['POST'])(cambiar_password_usuario)

# Obtener calificaciones del usuario
usuarios_bp.route('/api/auth/mis-calificaciones', methods=['GET'])(obtener_calificaciones_usuario)

__all__ = ["usuarios_bp", "obtener_barberias_por_cercania"] 