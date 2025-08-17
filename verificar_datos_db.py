
import os
import sys
from backend.app import create_app, db
from backend.models import Barberia

# Añadir el directorio raíz al path para que las importaciones funcionen
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def verificar_barberias():
    """
    Se conecta a la base de datos y muestra los datos de las barberías.
    """
    app = create_app(config_name='default')
    with app.app_context():
        print("--- Verificando Barberías en la Base de Datos ---")
        
        try:
            barberias = Barberia.query.all()
            
            if not barberias:
                print("-> No se encontró ninguna barbería en la tabla 'Barberia'.")
                return

            print(f"-> Se encontraron {len(barberias)} barberías. Detalle:")
            print("="*50)
            
            for b in barberias:
                print(f"  ID: {b.id}")
                print(f"  Nombre: {b.nombre}")
                print(f"  Latitud: {b.latitud}")
                print(f"  Longitud: {b.longitud}")
                print("-"*20)

        except Exception as e:
            print(f"Error al consultar la base de datos: {e}")
        
        print("="*50)
        print("--- Verificación Finalizada ---")

if __name__ == "__main__":
    verificar_barberias()
