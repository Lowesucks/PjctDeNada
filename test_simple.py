#!/usr/bin/env python3
"""
Test simple para verificar Flask básico
"""

from flask import Flask
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

@app.route('/')
def home():
    return '<h1>Aplicación Flask funcionando!</h1><p>Puerto: 5000</p>'

@app.route('/test')
def test():
    return {'status': 'ok', 'message': 'API funcionando'}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Iniciando servidor de prueba en puerto {port}")
    print(f"Accede a: http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)