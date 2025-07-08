from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

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
    fecha_creacion = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    google_place_id = db.Column(db.String(255), unique=True, nullable=True)
    
    # Relación con calificaciones
    calificaciones = db.relationship('Calificacion', backref='barberia', lazy=True, cascade='all, delete-orphan')

class Calificacion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barberia_id = db.Column(db.Integer, db.ForeignKey('barberia.id'), nullable=False)
    nombre_usuario = db.Column(db.String(50), nullable=False)
    calificacion = db.Column(db.Integer, nullable=False)  # 1-5 estrellas
    comentario = db.Column(db.Text)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc)) 