#!/usr/bin/env python3
"""
Script para probar las APIs de autenticación y usuarios
"""

import requests
import json
import sys
import os

# Configuración
BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api"

def print_response(response, title=""):
    """Imprime la respuesta de la API de forma legible"""
    print(f"\n{'='*50}")
    if title:
        print(f"📋 {title}")
    print(f"Status: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*50}")

def test_registro():
    """Prueba el registro de usuarios"""
    print("\n🔐 Probando registro de usuarios...")
    
    # Usuario válido
    usuario_nuevo = {
        "username": "test_user",
        "email": "test@example.com",
        "password": "password123",
        "nombre_completo": "Usuario de Prueba",
        "telefono": "555-9999"
    }
    
    response = requests.post(f"{API_BASE}/auth/registro", json=usuario_nuevo)
    print_response(response, "Registro de usuario nuevo")
    
    # Intentar registrar el mismo usuario (debe fallar)
    response = requests.post(f"{API_BASE}/auth/registro", json=usuario_nuevo)
    print_response(response, "Registro de usuario duplicado (debe fallar)")
    
    # Usuario con datos inválidos
    usuario_invalido = {
        "username": "test2",
        "email": "email-invalido",
        "password": "123",  # Muy corta
        "nombre_completo": ""
    }
    
    response = requests.post(f"{API_BASE}/auth/registro", json=usuario_invalido)
    print_response(response, "Registro con datos inválidos (debe fallar)")

def test_login():
    """Prueba el login de usuarios"""
    print("\n🔑 Probando login de usuarios...")
    
    # Login válido
    credenciales_validas = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=credenciales_validas)
    print_response(response, "Login válido")
    
    if response.status_code == 200:
        token = response.json().get('token')
        return token
    
    # Login inválido
    credenciales_invalidas = {
        "username": "admin",
        "password": "password_incorrecta"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=credenciales_invalidas)
    print_response(response, "Login con credenciales inválidas (debe fallar)")
    
    return None

def test_perfil_usuario(token):
    """Prueba las operaciones del perfil de usuario"""
    if not token:
        print("\n❌ No hay token válido para probar perfil")
        return
    
    print("\n👤 Probando operaciones de perfil...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Obtener perfil
    response = requests.get(f"{API_BASE}/auth/perfil", headers=headers)
    print_response(response, "Obtener perfil de usuario")
    
    # Actualizar perfil
    datos_actualizacion = {
        "nombre_completo": "Administrador Actualizado",
        "telefono": "555-0000"
    }
    
    response = requests.put(f"{API_BASE}/auth/perfil", json=datos_actualizacion, headers=headers)
    print_response(response, "Actualizar perfil de usuario")
    
    # Cambiar contraseña
    cambio_password = {
        "password_actual": "admin123",
        "password_nuevo": "nueva_password123"
    }
    
    response = requests.post(f"{API_BASE}/auth/cambiar-password", json=cambio_password, headers=headers)
    print_response(response, "Cambiar contraseña")
    
    # Volver a cambiar la contraseña para no afectar otras pruebas
    cambio_password_revert = {
        "password_actual": "nueva_password123",
        "password_nuevo": "admin123"
    }
    
    response = requests.post(f"{API_BASE}/auth/cambiar-password", json=cambio_password_revert, headers=headers)
    print_response(response, "Revertir cambio de contraseña")

def test_calificaciones_usuario(token):
    """Prueba obtener calificaciones del usuario"""
    if not token:
        print("\n❌ No hay token válido para probar calificaciones")
        return
    
    print("\n⭐ Probando calificaciones del usuario...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/auth/mis-calificaciones", headers=headers)
    print_response(response, "Obtener calificaciones del usuario")

def test_rutas_protegidas():
    """Prueba acceder a rutas protegidas sin token"""
    print("\n🚫 Probando acceso a rutas protegidas sin token...")
    
    # Intentar obtener perfil sin token
    response = requests.get(f"{API_BASE}/auth/perfil")
    print_response(response, "Obtener perfil sin token (debe fallar)")
    
    # Intentar con token inválido
    headers = {"Authorization": "Bearer token_invalido"}
    response = requests.get(f"{API_BASE}/auth/perfil", headers=headers)
    print_response(response, "Obtener perfil con token inválido (debe fallar)")

def test_barberias_con_autenticacion(token):
    """Prueba las rutas de barberías con autenticación"""
    print("\n🏪 Probando barberías con autenticación...")
    
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    # Obtener barberías
    response = requests.get(f"{API_BASE}/barberias")
    print_response(response, "Obtener barberías (público)")
    
    # Si hay barberías, probar calificar una
    if response.status_code == 200 and response.json():
        barberia_id = response.json()[0]['id']
        
        calificacion = {
            "calificacion": 5,
            "comentario": "Excelente servicio! Probado desde API con autenticación."
        }
        
        response = requests.post(f"{API_BASE}/barberias/{barberia_id}/calificar", 
                               json=calificacion, headers=headers)
        print_response(response, f"Calificar barbería {barberia_id}")

def main():
    """Función principal de pruebas"""
    print("🧪 INICIANDO PRUEBAS DE API DE AUTENTICACIÓN")
    print(f"📍 URL Base: {BASE_URL}")
    
    try:
        # Verificar que el servidor esté corriendo
        response = requests.get(f"{BASE_URL}/api/barberias")
        if response.status_code != 200:
            print(f"❌ Error: No se puede conectar al servidor en {BASE_URL}")
            print("Asegúrate de que el servidor esté corriendo con: python main.py")
            return
        
        print("✅ Servidor conectado correctamente")
        
        # Ejecutar pruebas
        test_registro()
        token = test_login()
        test_perfil_usuario(token)
        test_calificaciones_usuario(token)
        test_rutas_protegidas()
        test_barberias_con_autenticacion(token)
        
        print("\n🎉 ¡Todas las pruebas completadas!")
        print("\n📝 Resumen de endpoints probados:")
        print("   ✅ POST /api/auth/registro")
        print("   ✅ POST /api/auth/login")
        print("   ✅ GET  /api/auth/perfil")
        print("   ✅ PUT  /api/auth/perfil")
        print("   ✅ POST /api/auth/cambiar-password")
        print("   ✅ GET  /api/auth/mis-calificaciones")
        print("   ✅ Protección de rutas")
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: No se puede conectar al servidor en {BASE_URL}")
        print("Asegúrate de que el servidor esté corriendo con: python main.py")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")

if __name__ == "__main__":
    main() 