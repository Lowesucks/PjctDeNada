from flask import request, jsonify
from typing import Any
from .models import db, Barberia, Calificacion
from .services import buscar_barberias_google_places, buscar_barberias_por_texto, calcular_distancia

# Rutas de la API
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
                'nombre_usuario': c.nombre_usuario,
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
    
    nueva_calificacion = Calificacion(
        barberia_id=barberia_id,
        nombre_usuario=data.get('nombre_usuario', ''),
        calificacion=data.get('calificacion', 0),
        comentario=data.get('comentario', '')
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
        
        # Buscar en Google Places API
        barberias_google = buscar_barberias_google_places(lat, lng, radio)
        
        # Buscar en base de datos local
        barberias_db = Barberia.query.all()
        
        # Combinar y calcular distancias
        todas_barberias = []
        
        # Agregar barberías de Google
        for barberia in barberias_google:
            try:
                # Verificar que las coordenadas existan y sean válidas
                if barberia.get('latitud') is not None and barberia.get('longitud') is not None:
                    distancia = calcular_distancia(lat, lng, barberia['latitud'], barberia['longitud'])
                    barberia['distancia'] = distancia
                    barberia['lat'] = barberia['latitud']
                    barberia['lng'] = barberia['longitud']
                    todas_barberias.append(barberia)
            except (KeyError, TypeError, ValueError) as e:
                print(f"Error procesando barbería de Google: {e}")
                continue
        
        # Agregar barberías de la base de datos
        for barberia in barberias_db:
            try:
                if barberia.latitud is not None and barberia.longitud is not None:
                    distancia = calcular_distancia(lat, lng, barberia.latitud, barberia.longitud)
                    if distancia <= radio / 1000:  # Convertir radio a km
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
            except Exception as e:
                print(f"Error procesando barbería de BD: {e}")
                continue
        
        # Ordenar por distancia
        todas_barberias.sort(key=lambda x: x.get('distancia', float('inf')))
        
        return todas_barberias
        
    except Exception as e:
        print(f"Error en buscar_barberias_cercanas: {e}")
        return [] 