#!/usr/bin/env python3
"""
Script para crear el archivo .env con la configuración correcta
"""

import secrets
from pathlib import Path

def crear_env():
    """Crea el archivo .env con la configuración correcta"""
    print("🔧 Creando archivo .env...")
    
    # Generar claves secretas seguras
    secret_key = secrets.token_hex(32)
    jwt_secret_key = secrets.token_hex(32)
    
    # Contenido del archivo .env
    env_content = f"""# Configuración del Backend
# Reemplaza con tus valores reales

# Claves secretas (OBLIGATORIAS)
SECRET_KEY={secret_key}
JWT_SECRET_KEY={jwt_secret_key}

# Configuración de la base de datos
DATABASE_URL=sqlite:///barberias.db

# Configuración del servidor
FLASK_ENV=development
FLASK_DEBUG=True
HOST=0.0.0.0
PORT=5000

# APIs (OPCIONALES)
GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps
FOURSQUARE_API_KEY=tu_api_key_de_foursquare
"""
    
    # Escribir el archivo .env
    with open(".env", "w", encoding="utf-8") as f:
        f.write(env_content)
    
    print("✅ Archivo .env creado exitosamente")
    print(f"🔑 SECRET_KEY generada: {secret_key[:20]}...")
    print(f"🔑 JWT_SECRET_KEY generada: {jwt_secret_key[:20]}...")
    print("\n⚠️  IMPORTANTE:")
    print("   - Las claves secretas se han generado automáticamente")
    print("   - Agrega tus API keys reales para Google Maps y Foursquare")
    print("   - Nunca compartas este archivo .env")

if __name__ == "__main__":
    crear_env() 