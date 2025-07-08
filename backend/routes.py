from flask import request, jsonify
from typing import Any
from .models import db, Barberia, Calificacion, Usuario
from .services import (
    buscar_barberias_google_places, buscar_barberias_por_texto, calcular_distancia,
    crear_usuario, autenticar_usuario, verificar_token_jwt, obtener_usuario_por_id,
    actualizar_usuario, cambiar_password
)
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

def obtener_barberia(barberia_id: int) -> dict[str, Any]:
    barberia = Barberia.query.get_or_404(barberia_id)
    calificaciones = Calificacion.query.filter_by(barberia_id=barberia_id).order_by(Calificacion.fecha.desc()).all()
    
    return {
        'id': barberia.id,
        'nombre': barberia.nombre,
        'direccion': barberia.direccion,
        'telefono': barberia.telefono,
        'horario': barberia.horario,
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
    return {'mensaje': 'Calificación agregada exitosamente'}, 201

def buscar_barberias() -> list[dict[str, Any]]:
    try:
        query: str = request.args.get('q', '').lower()
        # Obtener coordenadas del usuario si están disponibles
        lat_user = request.args.get('lat')
        lng_user = request.args.get('lng')
        
        todas_barberias = []
        
        # Buscar en base de datos local
        barberias_db = Barberia.query.filter(
            db.or_(
                db.func.lower(Barberia.nombre).ilike(f'%{query}%'),
                db.func.lower(Barberia.direccion).ilike(f'%{query}%')
            )
        ).all()
        
        # Agregar barberías de la base de datos
        for barberia in barberias_db:
            barberia_dict = {
                'id': barberia.id,
                'nombre': barberia.nombre,
                'direccion': barberia.direccion,
                'telefono': barberia.telefono,
                'horario': barberia.horario,
                'latitud': barberia.latitud,
                'longitud': barberia.longitud,
                'lat': barberia.latitud,
                'lng': barberia.longitud,
                'calificacion_promedio': round(barberia.calificacion_promedio, 1),
                'total_calificaciones': barberia.total_calificaciones,
                'fuente': 'local'
            }
            todas_barberias.append(barberia_dict)
        
        # Buscar en Google Places API usando Text Search
        if query.strip():
            # Usar coordenadas del usuario si están disponibles, sino usar CDMX como fallback
            if lat_user and lng_user:
                try:
                    lat = float(lat_user)
                    lng = float(lng_user)
                except ValueError:
                    lat = 19.432608
                    lng = -99.133209
            else:
                lat = 19.432608
                lng = -99.133209
            
            # Usar la nueva función de búsqueda por texto con la ubicación del usuario
            barberias_google = buscar_barberias_por_texto(query, lat, lng)
            
            # Agregar campos necesarios para el frontend
            for barberia in barberias_google:
                barberia['lat'] = barberia['latitud']
                barberia['lng'] = barberia['longitud']
                # Calcular distancia si tenemos ubicación del usuario
                if lat_user and lng_user:
                    try:
                        distancia = calcular_distancia(float(lat_user), float(lng_user), barberia['latitud'], barberia['longitud'])
                        barberia['distancia'] = distancia
                    except:
                        barberia['distancia'] = 0
                else:
                    barberia['distancia'] = 0
                todas_barberias.append(barberia)
        
        return todas_barberias
        
    except Exception as e:
        print(f"Error en buscar_barberias: {e}")
        return []

def buscar_barberias_cercanas() -> list[dict[str, Any]]:
    try:
        lat = float(request.args.get('lat', 0))
        lng = float(request.args.get('lng', 0))
        radio = int(request.args.get('radio', 5000))
        
        # Para radios grandes, hacer múltiples búsquedas
        if radio > 25000:
            barberias_google = []
            # Hacer búsquedas con diferentes términos para obtener más resultados
            search_terms = ['barbería', 'peluquería', 'salón de belleza', 'corte de cabello']
            
            for term in search_terms:
                try:
                    barberias_term = buscar_barberias_por_texto(term, lat, lng)
                    barberias_google.extend(barberias_term)
                except Exception as e:
                    print(f"Error buscando con término '{term}': {e}")
                    continue
        else:
            # Buscar en Google Places API para radios normales
            barberias_google = buscar_barberias_google_places(lat, lng, radio)
        
        # Buscar en base de datos local
        barberias_db = Barberia.query.all()
        
        # Eliminar duplicados de Google Places
        barberias_google_unicas = []
        ids_google_vistos = set()
        
        for barberia in barberias_google:
            if barberia.get('google_place_id') and barberia['google_place_id'] not in ids_google_vistos:
                ids_google_vistos.add(barberia['google_place_id'])
                barberias_google_unicas.append(barberia)
            elif not barberia.get('google_place_id'):
                # Si no tiene place_id, usar el id normal
                if barberia.get('id') not in ids_google_vistos:
                    ids_google_vistos.add(barberia.get('id'))
                    barberias_google_unicas.append(barberia)
        
        # Combinar resultados
        todas_barberias = []
        
        # Agregar barberías de la base de datos
        for barberia in barberias_db:
            distancia = calcular_distancia(lat, lng, barberia.latitud, barberia.longitud)
            barberia_dict = {
                'id': barberia.id,
                'nombre': barberia.nombre,
                'direccion': barberia.direccion,
                'telefono': barberia.telefono,
                'horario': barberia.horario,
                'latitud': barberia.latitud,
                'longitud': barberia.longitud,
                'lat': barberia.latitud,
                'lng': barberia.longitud,
                'calificacion_promedio': round(barberia.calificacion_promedio, 1),
                'total_calificaciones': barberia.total_calificaciones,
                'distancia': distancia,
                'fuente': 'local'
            }
            todas_barberias.append(barberia_dict)
        
        # Agregar barberías de Google Places
        for barberia in barberias_google_unicas:
            distancia = calcular_distancia(lat, lng, barberia['latitud'], barberia['longitud'])
            barberia['distancia'] = distancia
            todas_barberias.append(barberia)
        
        # Ordenar por distancia
        todas_barberias.sort(key=lambda x: x.get('distancia', float('inf')))
        
        return todas_barberias
        
    except Exception as e:
        print(f"Error en buscar_barberias_cercanas: {e}")
        return []

# ==================== RUTAS DE AUTENTICACIÓN Y USUARIOS ====================

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