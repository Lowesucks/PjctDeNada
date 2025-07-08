#!/usr/bin/env python3
"""
Script para probar múltiples usuarios simultáneos
"""

import requests
import threading
import time
import json
from concurrent.futures import ThreadPoolExecutor

def test_single_user(user_id):
    """Simula un usuario haciendo consultas"""
    base_url = "http://localhost:5000"
    
    print(f"👤 Usuario {user_id}: Iniciando...")
    
    try:
        # Consulta 1: Obtener todas las barberías
        response1 = requests.get(f"{base_url}/api/barberias")
        if response1.status_code == 200:
            barberias = response1.json()
            print(f"👤 Usuario {user_id}: Encontró {len(barberias)} barberías")
        else:
            print(f"❌ Usuario {user_id}: Error en consulta 1")
            return False
        
        # Consulta 2: Buscar barberías cercanas
        response2 = requests.get(f"{base_url}/api/barberias/cercanas?lat=19.4326&lng=-99.1332&radio=5000")
        if response2.status_code == 200:
            cercanas = response2.json()
            print(f"👤 Usuario {user_id}: Encontró {len(cercanas)} barberías cercanas")
        else:
            print(f"❌ Usuario {user_id}: Error en consulta 2")
            return False
        
        # Consulta 3: Buscar por nombre
        response3 = requests.get(f"{base_url}/api/barberias/buscar?q=barberia")
        if response3.status_code == 200:
            busqueda = response3.json()
            print(f"👤 Usuario {user_id}: Encontró {len(busqueda)} en búsqueda")
        else:
            print(f"❌ Usuario {user_id}: Error en consulta 3")
            return False
        
        print(f"✅ Usuario {user_id}: Todas las consultas exitosas")
        return True
        
    except Exception as e:
        print(f"❌ Usuario {user_id}: Error - {e}")
        return False

def test_concurrent_users(num_users=5):
    """Prueba múltiples usuarios simultáneos"""
    print(f"🧪 Probando {num_users} usuarios simultáneos...")
    print("=" * 50)
    
    start_time = time.time()
    
    # Usar ThreadPoolExecutor para ejecutar usuarios en paralelo
    with ThreadPoolExecutor(max_workers=num_users) as executor:
        # Crear tareas para cada usuario
        futures = [executor.submit(test_single_user, i+1) for i in range(num_users)]
        
        # Esperar a que todas las tareas terminen
        results = [future.result() for future in futures]
    
    end_time = time.time()
    total_time = end_time - start_time
    
    # Resumen
    successful_users = sum(results)
    failed_users = num_users - successful_users
    
    print("\n" + "=" * 50)
    print("📊 RESULTADOS DE LA PRUEBA")
    print("=" * 50)
    print(f"Usuarios totales: {num_users}")
    print(f"Usuarios exitosos: {successful_users}")
    print(f"Usuarios fallidos: {failed_users}")
    print(f"Tiempo total: {total_time:.2f} segundos")
    print(f"Tiempo promedio por usuario: {total_time/num_users:.2f} segundos")
    
    if successful_users == num_users:
        print("🎉 ¡TODOS LOS USUARIOS EXITOSOS!")
        print("✅ La aplicación maneja múltiples usuarios correctamente")
    else:
        print("⚠️  Algunos usuarios fallaron")
        print("🔧 Revisa la configuración del servidor")
    
    return successful_users == num_users

def test_server_status():
    """Verifica que el servidor esté funcionando"""
    try:
        response = requests.get("http://localhost:5000/api/barberias")
        if response.status_code == 200:
            print("✅ Servidor funcionando correctamente")
            return True
        else:
            print(f"❌ Servidor respondió con código: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor")
        print("💡 Asegúrate de que el servidor esté ejecutándose con: python run.py")
        return False

if __name__ == "__main__":
    print("🧪 Prueba de Múltiples Usuarios Simultáneos")
    print("=" * 50)
    
    # Verificar que el servidor esté funcionando
    if not test_server_status():
        exit(1)
    
    print()
    
    # Probar con diferentes números de usuarios
    test_cases = [2, 5, 10]
    
    for num_users in test_cases:
        print(f"\n🔍 Probando con {num_users} usuarios...")
        success = test_concurrent_users(num_users)
        
        if not success:
            print(f"⚠️  La prueba con {num_users} usuarios falló")
            break
        
        print(f"✅ Prueba con {num_users} usuarios exitosa")
        time.sleep(1)  # Pausa entre pruebas
    
    print("\n🎯 Prueba completada!")
    print("💡 Si todas las pruebas fueron exitosas, tu aplicación")
    print("   puede manejar múltiples usuarios simultáneos correctamente.") 