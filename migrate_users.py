#!/usr/bin/env python3
"""
Script para migrar la base de datos y agregar usuarios de prueba
"""

import os
import sys
from datetime import datetime, timezone

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app
from backend.models import db, Usuario, Calificacion
from backend.services import crear_usuario

def migrar_base_datos():
    """Migra la base de datos y agrega usuarios de prueba"""
    app = create_app()
    
    with app.app_context():
        print("🔄 Iniciando migración de base de datos...")
        
        # Crear todas las tablas
        db.create_all()
        print("✓ Tablas creadas/actualizadas")
        
        # Verificar si ya existen usuarios
        usuarios_existentes = Usuario.query.count()
        if usuarios_existentes > 0:
            print(f"⚠️  Ya existen {usuarios_existentes} usuarios en la base de datos")
            return
        
        # Crear usuarios de prueba
        usuarios_prueba = [
            {
                'username': 'admin',
                'email': 'admin@barberias.com',
                'password': 'admin123',
                'nombre_completo': 'Administrador del Sistema',
                'telefono': '555-0001',
                'es_admin': True
            },
            {
                'username': 'juan_perez',
                'email': 'juan.perez@email.com',
                'password': 'password123',
                'nombre_completo': 'Juan Pérez',
                'telefono': '555-0002',
                'es_admin': False
            },
            {
                'username': 'maria_garcia',
                'email': 'maria.garcia@email.com',
                'password': 'password123',
                'nombre_completo': 'María García',
                'telefono': '555-0003',
                'es_admin': False
            },
            {
                'username': 'carlos_rodriguez',
                'email': 'carlos.rodriguez@email.com',
                'password': 'password123',
                'nombre_completo': 'Carlos Rodríguez',
                'telefono': '555-0004',
                'es_admin': False
            }
        ]
        
        print("👥 Creando usuarios de prueba...")
        for datos_usuario in usuarios_prueba:
            try:
                # Crear usuario usando el servicio
                resultado, codigo = crear_usuario(
                    username=datos_usuario['username'],
                    email=datos_usuario['email'],
                    password=datos_usuario['password'],
                    nombre_completo=datos_usuario['nombre_completo'],
                    telefono=datos_usuario['telefono']
                )
                
                if codigo == 201:
                    # Si es admin, actualizar el campo
                    if datos_usuario.get('es_admin'):
                        usuario = Usuario.query.filter_by(username=datos_usuario['username']).first()
                        if usuario:
                            usuario.es_admin = True
                            db.session.commit()
                    
                    print(f"✓ Usuario {datos_usuario['username']} creado")
                else:
                    print(f"⚠️  Error creando usuario {datos_usuario['username']}: {resultado.get('error', 'Error desconocido')}")
                    
            except Exception as e:
                print(f"❌ Error creando usuario {datos_usuario['username']}: {str(e)}")
        
        # Migrar calificaciones existentes (si las hay)
        print("🔄 Migrando calificaciones existentes...")
        calificaciones_sin_usuario = Calificacion.query.filter_by(usuario_id=None).all()
        
        if calificaciones_sin_usuario:
            # Asignar calificaciones sin usuario a un usuario de prueba
            usuario_default = Usuario.query.filter_by(username='juan_perez').first()
            
            if usuario_default:
                for calificacion in calificaciones_sin_usuario:
                    calificacion.usuario_id = usuario_default.id
                    if not calificacion.nombre_usuario:
                        calificacion.nombre_usuario = usuario_default.nombre_completo
                
                db.session.commit()
                print(f"✓ {len(calificaciones_sin_usuario)} calificaciones migradas a usuario {usuario_default.username}")
        
        print("\n🎉 Migración completada exitosamente!")
        print("\n📋 Usuarios de prueba creados:")
        print("   👤 admin / admin123 (Administrador)")
        print("   👤 juan_perez / password123")
        print("   👤 maria_garcia / password123")
        print("   👤 carlos_rodriguez / password123")
        print("\n🔗 Endpoints de autenticación disponibles:")
        print("   POST /api/auth/registro - Registrar nuevo usuario")
        print("   POST /api/auth/login - Iniciar sesión")
        print("   GET  /api/auth/perfil - Obtener perfil (requiere token)")
        print("   PUT  /api/auth/perfil - Actualizar perfil (requiere token)")
        print("   POST /api/auth/cambiar-password - Cambiar contraseña (requiere token)")
        print("   GET  /api/auth/mis-calificaciones - Ver mis calificaciones (requiere token)")

if __name__ == '__main__':
    migrar_base_datos() 