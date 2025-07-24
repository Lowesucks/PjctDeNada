#!/usr/bin/env python3
"""
Script para verificar que la aplicación esté funcionando correctamente
"""

import requests
import time

def test_connectivity():
    """Prueba la conectividad con la aplicación"""
    ports_to_test = [5002, 5001, 5000]
    
    for port in ports_to_test:
        print(f"Probando puerto {port}...")
        
        try:
            # Probar endpoint principal
            response = requests.get(f'http://localhost:{port}/', timeout=5)
            if response.status_code == 200:
                print(f"SUCCESS: Aplicación funcionando en puerto {port}")
                print(f"URL: http://localhost:{port}")
                return port
            else:
                print(f"Puerto {port}: HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"Puerto {port}: No hay conexión")
        except requests.exceptions.Timeout:
            print(f"Puerto {port}: Timeout")
        except Exception as e:
            print(f"Puerto {port}: Error - {e}")
    
    print("No se pudo conectar a ningún puerto")
    return None

def test_api_endpoints(port):
    """Prueba los endpoints de la API"""
    base_url = f'http://localhost:{port}'
    
    endpoints = [
        '/api/barberias',
        '/api/auth/login',  # Este debería responder aunque sea con error
    ]
    
    print(f"\nProbando endpoints de API en puerto {port}:")
    
    for endpoint in endpoints:
        try:
            response = requests.get(f'{base_url}{endpoint}', timeout=5)
            print(f"  {endpoint}: HTTP {response.status_code}")
        except Exception as e:
            print(f"  {endpoint}: Error - {e}")

if __name__ == "__main__":
    print("=== VERIFICACION DE CONECTIVIDAD ===")
    
    port = test_connectivity()
    
    if port:
        test_api_endpoints(port)
        print(f"\n¡La aplicación está funcionando!")
        print(f"Accede desde tu navegador a: http://localhost:{port}")
    else:
        print("\nLa aplicación no está respondiendo.")
        print("Verifica que esté ejecutándose con: python main.py")