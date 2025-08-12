#!/usr/bin/env python3
"""
Script para ejecutar Flask con HTTPS
"""

import os
import ssl
from backend.app import app

if __name__ == '__main__':
    # Configuración SSL
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    
    # Verificar si existen certificados
    cert_path = 'cert.pem'
    key_path = 'key.pem'
    
    if os.path.exists(cert_path) and os.path.exists(key_path):
        ssl_context.load_cert_chain(cert_path, key_path)
        print("Iniciando servidor HTTPS...")
        app.run(
            host='0.0.0.0',
            port=5000,
            ssl_context=ssl_context,
            debug=True
        )
    else:
        print("⚠️  Certificados SSL no encontrados.")
        print("📝 Para generar certificados de desarrollo:")
        print("   openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365")
        print("🔗 Iniciando servidor HTTP...")
        app.run(host='0.0.0.0', port=5000, debug=True) 