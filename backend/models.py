from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, timezone
import bcrypt

db = SQLAlchemy()

class Usuario(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nombre_completo = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(20))
    fecha_registro = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ultimo_acceso = db.Column(db.DateTime)
    activo = db.Column(db.Boolean, default=True)
    es_admin = db.Column(db.Boolean, default=False)
    
    # Relación con calificaciones
    calificaciones = db.relationship('Calificacion', backref='usuario', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Encripta y guarda la contraseña"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password):
        """Verifica si la contraseña es correcta"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        """Convierte el usuario a diccionario (sin contraseña)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'nombre_completo': self.nombre_completo,
            'telefono': self.telefono,
            'fecha_registro': self.fecha_registro.strftime('%d/%m/%Y %H:%M'),
            'ultimo_acceso': self.ultimo_acceso.strftime('%d/%m/%Y %H:%M') if self.ultimo_acceso else None,
            'activo': self.activo,
            'es_admin': self.es_admin
        }

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
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    calificacion = db.Column(db.Integer, nullable=False)  # 1-5 estrellas
    comentario = db.Column(db.Text)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Mantener compatibilidad con el campo anterior
    nombre_usuario = db.Column(db.String(50), nullable=True)  # Para calificaciones antiguas

class Favorito(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    barberia_id = db.Column(db.Integer, db.ForeignKey('barberia.id'), nullable=False)
    fecha_agregado = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relación con usuario y barbería
    usuario = db.relationship('Usuario', backref='favoritos')
    barberia = db.relationship('Barberia', backref='favoritos')
    
    # Índice único para evitar duplicados
    __table_args__ = (db.UniqueConstraint('usuario_id', 'barberia_id', name='_usuario_barberia_favorito_uc'),)
    
    def to_dict(self):
        """Convierte el favorito a diccionario"""
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'barberia_id': self.barberia_id,
            'fecha_agregado': self.fecha_agregado.strftime('%d/%m/%Y %H:%M'),
            'barberia': {
                'id': self.barberia.id,
                'nombre': self.barberia.nombre,
                'direccion': self.barberia.direccion,
                'telefono': self.barberia.telefono,
                'horario': self.barberia.horario,
                'latitud': self.barberia.latitud,
                'longitud': self.barberia.longitud,
                'calificacion_promedio': round(self.barberia.calificacion_promedio, 1),
                'total_calificaciones': self.barberia.total_calificaciones
            } if self.barberia else None
        } 