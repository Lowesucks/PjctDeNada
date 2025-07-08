#!/usr/bin/env python3
"""
Script de prueba para verificar que la API funciona correctamente
"""

import requests
import json
import time

def test_api():
    """Prueba las principales rutas de la API"""
    
    base_url = "http://localhost:5000/api"
    
    print("🧪 Probando API de Barberías...")
    print("=" * 50)
    
    # Test 1: Obtener todas las barberías
    print("1. Probando GET /api/barberias...")
    try:
        response = requests.get(f"{base_url}/barberias")
        if response.status_code == 200:
            barberias = response.json()
            print(f"   ✅ Éxito: {len(barberias)} barberías encontradas")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Buscar barberías cercanas
    print("\n2. Probando GET /api/barberias/cercanas...")
    try:
        params = {
            'lat': 33.9607552,
            'lng': -118.2171136,
            'radio': 5000
        }
        response = requests.get(f"{base_url}/barberias/cercanas", params=params)
        if response.status_code == 200:
            barberias = response.json()
            print(f"   ✅ Éxito: {len(barberias)} barberías cercanas encontradas")
            
            # Mostrar algunas barberías
            for i, barberia in enumerate(barberias[:3]):
                print(f"      {i+1}. {barberia.get('nombre', 'N/A')} - {barberia.get('distancia', 0):.2f} km")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
            print(f"   Respuesta: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Buscar barberías por texto
    print("\n3. Probando GET /api/barberias/buscar...")
    try:
        response = requests.get(f"{base_url}/barberias/buscar?q=barber")
        if response.status_code == 200:
            barberias = response.json()
            print(f"   ✅ Éxito: {len(barberias)} barberías encontradas en búsqueda")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Pruebas completadas!")

if __name__ == "__main__":
    # Esperar un poco para que el servidor esté listo
    print("⏳ Esperando que el servidor esté listo...")
    time.sleep(2)
    test_api() 