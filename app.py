from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import requests
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barberias.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)

db = SQLAlchemy(app)

# Configuración de Foursquare API
FOURSQUARE_API_KEY = os.environ.get('FOURSQUARE_API_KEY', 'TU_API_KEY_FOURSQUARE')
FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3'

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
    Busca barberías cercanas usando la API de Foursquare
    """
    try:
        lat = float(request.args.get('lat', 19.4326))  # Ciudad de México por defecto
        lng = float(request.args.get('lng', -99.1332))
        radio = int(request.args.get('radio', 5000))  # Radio en metros
        
        # Buscar en Foursquare (solo si hay API key configurada)
        barberias_foursquare = buscar_barberias_foursquare(lat, lng, radio)
        
        # Obtener barberías locales
        barberias_locales = Barberia.query.all()
        barberias_comb = []
        
        # Agregar barberías de Foursquare (si las hay)
        for barberia in barberias_foursquare:
            barberias_comb.append({
                'id': barberia['id'],
                'nombre': barberia['nombre'],
                'direccion': barberia['direccion'],
                'telefono': barberia['telefono'],
                'horario': barberia['horario'],
                'latitud': barberia['latitud'],
                'longitud': barberia['longitud'],
                'calificacion_promedio': barberia['calificacion_promedio'],
                'total_calificaciones': barberia['total_calificaciones'],
                'fuente': 'foursquare',
                'distancia': barberia['distancia'],
                'categoria': barberia['categoria']
            })
        
        # Agregar barberías locales (siempre disponibles)
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
        
        # Ordenar por distancia (si está disponible) o por calificación
        barberias_comb.sort(key=lambda x: x.get('distancia', 999999))
        
        return jsonify(barberias_comb)
        
    except Exception as e:
        print(f"Error al buscar barberías cercanas: {str(e)}")
        # En caso de error, devolver solo barberías locales
        barberias_locales = Barberia.query.all()
        return jsonify([{
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
        } for barberia in barberias_locales])

# Crear tablas y datos de ejemplo
def crear_tablas():
    with app.app_context():
        db.create_all()
        
        # Agregar datos de ejemplo si la base está vacía
        if not Barberia.query.first():
            barberias_ejemplo = [
                Barberia(
                    nombre='Barbería Clásica', 
                    direccion='Av. Principal 123', 
                    telefono='555-0101', 
                    horario='Lun-Sáb 9:00-19:00',
                    latitud=19.4326,
                    longitud=-99.1332
                ),
                Barberia(
                    nombre='Corte Moderno', 
                    direccion='Calle Central 456', 
                    telefono='555-0202', 
                    horario='Lun-Vie 8:00-18:00',
                    latitud=19.4342,
                    longitud=-99.1312
                ),
                Barberia(
                    nombre='Estilo Urbano', 
                    direccion='Plaza Mayor 789', 
                    telefono='555-0303', 
                    horario='Mar-Dom 10:00-20:00',
                    latitud=19.4306,
                    longitud=-99.1352
                ),
            ]
            
            for barberia in barberias_ejemplo:
                db.session.add(barberia)
            
            db.session.commit()

# Llamar a la función al iniciar la aplicación
crear_tablas()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 