from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import requests
import json
import googlemaps
from functools import lru_cache

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barberias.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)

db = SQLAlchemy(app)

# --- Configuración de APIs Externas ---

# Clave de API de Google (se lee de variables de entorno)
GOOGLE_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')

# Opcional: Clave para Foursquare (se mantiene como fallback)
FOURSQUARE_API_KEY = os.environ.get('FOURSQUARE_API_KEY')
FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3'

@lru_cache(maxsize=32)
def buscar_barberias_google_places(lat, lng, radio=5000):
    """
    Busca barberías, peluquerías y salones de belleza cercanos usando la API de Google Places.
    Utiliza caché para evitar llamadas repetidas a la API con las mismas coordenadas.
    """
    if not GOOGLE_API_KEY:
        print("API Key de Google no configurada. Saltando búsqueda en Google Places.")
        return []

    try:
        gmaps = googlemaps.Client(key=GOOGLE_API_KEY)
        
        # Tipos de lugares a buscar. Incluimos varios para mayor cobertura.
        tipos_de_lugar = ['barber_shop', 'hair_salon', 'beauty_salon']
        
        barberias_encontradas = []
        
        for tipo in tipos_de_lugar:
            places_result = gmaps.places_nearby(
                location=(lat, lng),
                radius=radio,
                type=tipo,
                language='es'  # Pedimos resultados en español
            )
            
            for place in places_result.get('results', []):
                # Evitar duplicados por ID de lugar
                if any(b['google_place_id'] == place.get('place_id') for b in barberias_encontradas):
                    continue

                location = place.get('geometry', {}).get('location', {})
                calificacion = place.get('rating', 0)
                total_calificaciones = place.get('user_ratings_total', 0)

                barberia = {
                    'id': f"gm_{place.get('place_id')}",
                    'nombre': place.get('name', 'Establecimiento'),
                    'direccion': place.get('vicinity', 'Dirección no disponible'),
                    'latitud': location.get('lat'),
                    'longitud': location.get('lng'),
                    'calificacion_promedio': float(calificacion) if calificacion else 0.0,
                    'total_calificaciones': total_calificaciones if total_calificaciones else 0,
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

# La función de Foursquare se deja por si se quiere usar en el futuro, pero no se llama por defecto
def buscar_barberias_foursquare(lat, lng, radio=5000):
    """
    Busca barberías cercanas usando la API de Foursquare
    """
    if FOURSQUARE_API_KEY == 'TU_API_KEY_FOURSQUARE' or not FOURSQUARE_API_KEY:
        print("API Key de Foursquare no configurada. Usando solo barberías locales.")
        return []
    
    headers = {
        'Authorization': FOURSQUARE_API_KEY,
        'Accept': 'application/json'
    }
    
    params = {
        'query': 'barbería barberia barber shop',
        'll': f'{lat},{lng}',
        'radius': radio,
        'categories': '10036',  # Categoría de barberías en Foursquare
        'limit': 50,
        'sort': 'RATING'
    }
    
    try:
        response = requests.get(
            f'{FOURSQUARE_BASE_URL}/places/search',
            headers=headers,
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            barberias = []
            
            for place in data.get('results', []):
                location = place.get('location', {})
                barberia = {
                    'id': f"fs_{place.get('fsq_id', '')}",
                    'nombre': place.get('name', 'Barbería'),
                    'direccion': location.get('formatted_address', 'Dirección no disponible'),
                    'telefono': place.get('tel', 'Teléfono no disponible'),
                    'horario': 'Horario no disponible',
                    'latitud': location.get('lat'),
                    'longitud': location.get('lng'),
                    'calificacion_promedio': place.get('rating', 0),
                    'total_calificaciones': place.get('stats', {}).get('total_photos', 0),
                    'foursquare_id': place.get('fsq_id'),
                    'categoria': place.get('categories', [{}])[0].get('name', 'Barbería'),
                    'distancia': place.get('distance', 0)
                }
                barberias.append(barberia)
            
            return barberias
        else:
            print(f"Error en API Foursquare: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"Error al buscar en Foursquare: {str(e)}")
        return []

# Modelos de base de datos
class Barberia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    direccion = db.Column(db.String(200), nullable=False)
    telefono = db.Column(db.String(20))
    horario = db.Column(db.String(100))
    latitud = db.Column(db.Float)
    longitud = db.Column(db.Float)
    calificacion_promedio = db.Column(db.Float, default=0.0)
    total_calificaciones = db.Column(db.Integer, default=0)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    google_place_id = db.Column(db.String(255), unique=True, nullable=True)
    
    # Relación con calificaciones
    calificaciones = db.relationship('Calificacion', backref='barberia', lazy=True, cascade='all, delete-orphan')

class Calificacion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barberia_id = db.Column(db.Integer, db.ForeignKey('barberia.id'), nullable=False)
    nombre_usuario = db.Column(db.String(50), nullable=False)
    calificacion = db.Column(db.Integer, nullable=False)  # 1-5 estrellas
    comentario = db.Column(db.Text)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

# Rutas de la API
@app.route('/api/barberias', methods=['GET'])
def obtener_barberias():
    barberias = Barberia.query.all()
    return jsonify([{
        'id': b.id,
        'nombre': b.nombre,
        'direccion': b.direccion,
        'telefono': b.telefono,
        'horario': b.horario,
        'latitud': b.latitud,
        'longitud': b.longitud,
        'calificacion_promedio': round(b.calificacion_promedio, 1),
        'total_calificaciones': b.total_calificaciones
    } for b in barberias])

@app.route('/api/barberias', methods=['POST'])
def crear_barberia():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos JSON requeridos'}), 400
    
    nueva_barberia = Barberia(
        nombre=data.get('nombre', ''),
        direccion=data.get('direccion', ''),
        telefono=data.get('telefono', ''),
        horario=data.get('horario', '')
    )
    db.session.add(nueva_barberia)
    db.session.commit()
    return jsonify({'mensaje': 'Barbería creada exitosamente', 'id': nueva_barberia.id}), 201

@app.route('/api/barberias/<int:barberia_id>', methods=['GET'])
def obtener_barberia(barberia_id):
    barberia = Barberia.query.get_or_404(barberia_id)
    calificaciones = Calificacion.query.filter_by(barberia_id=barberia_id).order_by(Calificacion.fecha.desc()).all()
    
    return jsonify({
        'id': barberia.id,
        'nombre': barberia.nombre,
        'direccion': barberia.direccion,
        'telefono': barberia.telefono,
        'horario': barberia.horario,
        'calificacion_promedio': round(barberia.calificacion_promedio, 1),
        'total_calificaciones': barberia.total_calificaciones,
        'calificaciones': [{
            'id': c.id,
            'nombre_usuario': c.nombre_usuario,
            'calificacion': c.calificacion,
            'comentario': c.comentario,
            'fecha': c.fecha.strftime('%d/%m/%Y %H:%M')
        } for c in calificaciones]
    })

@app.route('/api/barberias/<int:barberia_id>/calificar', methods=['POST'])
def calificar_barberia(barberia_id):
    barberia = Barberia.query.get_or_404(barberia_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Datos JSON requeridos'}), 400
    
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
    return jsonify({'mensaje': 'Calificación agregada exitosamente'}), 201

@app.route('/api/barberias/buscar', methods=['GET'])
def buscar_barberias():
    query = request.args.get('q', '').lower()
    barberias = Barberia.query.filter(
        db.or_(
            Barberia.nombre.ilike(f'%{query}%'),
            Barberia.direccion.ilike(f'%{query}%')
        )
    ).all()
    
    return jsonify([{
        'id': b.id,
        'nombre': b.nombre,
        'direccion': b.direccion,
        'telefono': b.telefono,
        'horario': b.horario,
        'latitud': b.latitud,
        'longitud': b.longitud,
        'calificacion_promedio': round(b.calificacion_promedio, 1),
        'total_calificaciones': b.total_calificaciones
    } for b in barberias])

@app.route('/api/barberias/cercanas', methods=['GET'])
def buscar_barberias_cercanas():
    """
    Busca barberías cercanas. Prioriza Google Places si la API key está disponible.
    """
    try:
        lat = float(request.args.get('lat', 19.4326))  # Ciudad de México por defecto
        lng = float(request.args.get('lng', -99.1332))
        radio = int(request.args.get('radio', 5000))  # Radio en metros
        
        barberias_api = []
        # Usar Google Places como fuente principal si hay API key
        if GOOGLE_API_KEY:
            barberias_api = buscar_barberias_google_places(lat, lng, radio)
        
        # Obtener barberías de la base de datos local
        barberias_locales = Barberia.query.all()
        
        barberias_comb = []
        
        # IDs de barberías locales para evitar duplicados si vienen de la API
        ids_locales = {f"gm_{b.google_place_id}" for b in barberias_locales if b.google_place_id}

        # 1. Agregar barberías de la API (Google/Foursquare)
        for barberia in barberias_api:
            # Si la barbería de la API ya está en nuestra BD local, no la agregamos
            if barberia['id'] not in ids_locales:
                barberias_comb.append({
                    'id': barberia['id'],
                    'nombre': barberia['nombre'],
                    'direccion': barberia['direccion'],
                    'latitud': barberia['latitud'],
                    'longitud': barberia['longitud'],
                    'calificacion_promedio': round(barberia.get('calificacion_promedio', 0), 1),
                    'total_calificaciones': barberia.get('total_calificaciones', 0),
                    'fuente': barberia.get('fuente', 'api_externa')
                })

        # 2. Agregar todas las barberías locales
        for barberia in barberias_locales:
            barberias_comb.append({
                'id': barberia.id,
                'nombre': barberia.nombre,
                'direccion': barberia.direccion,
                'telefono': barberia.telefono,
                'horario': barberia.horario,
                'latitud': barberia.latitud,
                'longitud': barberia.longitud,
                'calificacion_promedio': round(barberia.calificacion_promedio, 1),
                'total_calificaciones': barberia.total_calificaciones,
                'fuente': 'local'
            })
        
        return jsonify(barberias_comb)
        
    except Exception as e:
        print(f"Error al buscar barberías cercanas: {str(e)}")
        # En caso de error, devolver solo barberías locales como fallback
        barberias_locales = Barberia.query.all()
        return jsonify([{
            'id': b.id, 'nombre': b.nombre, 'direccion': b.direccion, 
            'latitud': b.latitud, 'longitud': b.longitud, 'fuente': 'local'
        } for b in barberias_locales])

def init_db():
    """Función para inicializar la base de datos."""
    with app.app_context():
        db.create_all()
        # Agregar datos de ejemplo si la base está vacía
        if not Barberia.query.first():
            barberias_ejemplo = [
                Barberia(nombre='Barbería Clásica', direccion='Av. Principal 123', latitud=19.4326, longitud=-99.1332),
                Barberia(nombre='Corte Moderno', direccion='Calle Central 456', latitud=19.4342, longitud=-99.1312),
            ]
            db.session.add_all(barberias_ejemplo)
            db.session.commit()
            print("Base de datos inicializada y datos de ejemplo insertados.")

@app.cli.command("crear-db")
def crear_tablas_comando():
    """Comando para crear las tablas de la base de datos."""
    init_db()

if __name__ == '__main__':
    # Asegurarse de que la base de datos se crea al arrancar si no existe
    with app.app_context():
        # Comprobar si la tabla 'barberia' ya existe
        inspector = db.inspect(db.engine)
        if not inspector.has_table('barberia'):
            print("Base de datos no encontrada, inicializando...")
            init_db()

    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        threaded=True
    ) 