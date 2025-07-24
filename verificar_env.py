#!/usr/bin/env python3
"""
Script para verificar la configuración del archivo .env
"""

import os
from pathlib import Path

def verificar_env():
    """Verifica la configuración del archivo .env"""
    print("🔍 Verificando archivo .env...")
    
    # Verificar si existe el archivo .env
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ Archivo .env no encontrado en la raíz del proyecto")
        print("📝 Creando archivo .env con variables básicas...")
        
        # Crear archivo .env básico
        env_content = """# Configuración del Backend
# Reemplaza con tus valores reales

# Claves secretas (OBLIGATORIAS)
SECRET_KEY=tu_clave_secreta_aqui_cambiala_por_una_segura
JWT_SECRET_KEY=tu_jwt_secret_key_aqui_cambiala_por_una_segura

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
        
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(env_content)
        
        print("✅ Archivo .env creado")
        print("⚠️  IMPORTANTE: Edita el archivo .env y cambia las claves secretas")
        return False
    
    print("✅ Archivo .env encontrado")
    
    # Leer y verificar variables
    with open(env_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar variables críticas
    variables_criticas = [
        "SECRET_KEY",
        "JWT_SECRET_KEY"
    ]
    
    variables_opcionales = [
        "GOOGLE_MAPS_API_KEY",
        "FOURSQUARE_API_KEY",
        "DATABASE_URL",
        "FLASK_ENV",
        "FLASK_DEBUG"
    ]
    
    print("\n📋 Variables encontradas:")
    
    # Verificar variables críticas
    for var in variables_criticas:
        if f"{var}=" in content:
            # Verificar si tiene un valor real (no placeholder)
            for line in content.split("\n"):
                if line.startswith(f"{var}="):
                    value = line.split("=", 1)[1].strip()
                    if value and not value.startswith("tu_") and not value.startswith("TU_"):
                        print(f"✅ {var}: Configurada")
                    else:
                        print(f"⚠️  {var}: Tiene valor placeholder - DEBES CAMBIARLO")
                    break
        else:
            print(f"❌ {var}: NO ENCONTRADA")
    
    # Verificar variables opcionales
    for var in variables_opcionales:
        if f"{var}=" in content:
            print(f"✅ {var}: Configurada")
        else:
            print(f"ℹ️  {var}: No configurada (opcional)")
    
    print("\n🔧 Para generar claves secretas seguras:")
    print("   python -c \"import secrets; print('SECRET_KEY=' + secrets.token_hex(32))\"")

if __name__ == "__main__":
    verificar_env() 