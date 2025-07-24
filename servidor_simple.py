#!/usr/bin/env python3
"""
Servidor simple para probar conectividad
"""

from flask import Flask
import os

# Crear aplicación Flask simple
app = Flask(__name__)

@app.route('/')
def home():
    return '''
    <html>
    <head>
        <title>Servidor Funcionando</title>
    </head>
    <body>
        <h1>¡El servidor está funcionando!</h1>
        <p>Puerto: 5000</p>
        <p>Si ves esto, la conectividad funciona.</p>
        <a href="/test">Probar API</a>
    </body>
    </html>
    '''

@app.route('/test')
def test_api():
    return {
        'status': 'ok', 
        'message': 'API funcionando correctamente',
        'puerto': 5000
    }

if __name__ == '__main__':
    print("Iniciando servidor simple en puerto 5000...")
    print("Abre tu navegador y ve a: http://localhost:5000")
    print("Presiona Ctrl+C para detener")
    
    try:
        # Configuración muy básica
        app.run(
            host='127.0.0.1',  # Solo localhost
            port=5000,
            debug=False,        # Sin debug
            use_reloader=False  # Sin reloader
        )
    except Exception as e:
        print(f"Error: {e}")
        print("Verifica que el puerto 5000 no esté ocupado")