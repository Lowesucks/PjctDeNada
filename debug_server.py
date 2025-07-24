#!/usr/bin/env python3
"""
Servidor de debug para encontrar el problema
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Probar que las importaciones funcionen"""
    print("=== PROBANDO IMPORTACIONES ===")
    try:
        from dotenv import load_dotenv
        print("✓ dotenv importado")
        
        load_dotenv()
        print("✓ .env cargado")
        
        from flask import Flask
        print("✓ Flask importado")
        
        # Probar importaciones del backend
        from backend.app import create_app
        print("✓ backend.app importado")
        
        from backend.models import db
        print("✓ backend.models importado")
        
        return True
    except Exception as e:
        print(f"✗ Error en importaciones: {e}")
        return False

def test_basic_flask():
    """Probar Flask básico"""
    print("\n=== PROBANDO FLASK BÁSICO ===")
    try:
        from flask import Flask
        
        app = Flask(__name__)
        
        @app.route('/')
        def home():
            return '<h1>Servidor funcionando</h1><p>Puerto: 5000</p>'
        
        @app.route('/test')
        def test():
            return {'status': 'ok', 'message': 'API básica funcionando'}
        
        print("✓ Flask básico configurado")
        print("Iniciando en puerto 5000...")
        
        app.run(host='127.0.0.1', port=5000, debug=False)
        
    except Exception as e:
        print(f"✗ Error en Flask básico: {e}")
        return False

def test_full_app():
    """Probar la aplicación completa"""
    print("\n=== PROBANDO APLICACIÓN COMPLETA ===")
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        from backend.app import create_app
        from backend.models import db
        
        print("✓ Creando aplicación...")
        app = create_app()
        
        print("✓ Inicializando base de datos...")
        with app.app_context():
            db.create_all()
        
        print("✓ Configurando servidor...")
        
        # Usar configuración simple
        host = '127.0.0.1'  # Cambiar de 0.0.0.0 a localhost
        port = 5000
        debug = False  # Desactivar debug para evitar problemas
        
        print(f"Iniciando servidor en http://{host}:{port}")
        print("IMPORTANTE: Usa http://localhost:5000 en tu navegador")
        
        # Ejecutar sin HTTPS
        app.run(host=host, port=port, debug=debug, use_reloader=False)
        
    except Exception as e:
        print(f"✗ Error en aplicación completa: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("DIAGNÓSTICO DE SERVIDOR - APLICACIÓN BARBERÍAS")
    print("=" * 60)
    
    # Probar importaciones
    if not test_imports():
        print("\nERROR: Problema con las importaciones")
        return
    
    # Preguntar qué test ejecutar
    print("\n¿Qué quieres probar?")
    print("1. Flask básico (recomendado)")
    print("2. Aplicación completa")
    
    try:
        choice = input("Elige opción (1 o 2): ").strip()
    except KeyboardInterrupt:
        print("\nCancelado por usuario")
        return
    
    if choice == '1':
        test_basic_flask()
    elif choice == '2':
        test_full_app()
    else:
        print("Opción no válida. Probando Flask básico...")
        test_basic_flask()

if __name__ == '__main__':
    main()