import os
import googlemaps
from functools import lru_cache
from typing import Any
import math

# Clave de API de Google (se lee de variables de entorno)
GOOGLE_API_KEY: str | None = os.environ.get('GOOGLE_MAPS_API_KEY')

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