from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barberias.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)

db = SQLAlchemy(app)

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