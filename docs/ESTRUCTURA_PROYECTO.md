# 📁 Estructura del Proyecto - Barberías App

## 🏗️ Arquitectura General

El proyecto ha sido reorganizado siguiendo principios de **arquitectura modular** y **separación de responsabilidades**. Esta estructura facilita el mantenimiento, las pruebas y la escalabilidad.

## 📂 Estructura de Directorios

```
barberias-app/
├── 📄 main.py                    # Punto de entrada principal
├── 📄 run.py                     # Script universal de inicio
├── 📄 config.py                  # Configuración centralizada
├── 📄 env.example                # Variables de entorno de ejemplo
├── 📄 requirements.txt           # Dependencias Python
├── 📄 README.md                  # Documentación principal
├── 📄 .gitignore                 # Archivos ignorados por Git
│
├── 📁 backend/                   # Backend modular
│   ├── 📄 __init__.py           # Hace del directorio un paquete Python
│   ├── 📄 app.py                # Configuración y factory de Flask
│   ├── 📄 models.py             # Modelos de base de datos
│   ├── 📄 routes.py             # Rutas de la API
│   └── 📄 services.py           # Lógica de negocio y APIs externas
│
├── 📁 frontend/                  # Aplicación React
│   ├── 📁 src/
│   │   ├── 📁 components/       # Componentes React
│   │   ├── 📁 config/           # Configuraciones del frontend
│   │   ├── 📁 context/          # Contextos de React
│   │   ├── 📁 styles/           # Estilos CSS
│   │   ├── 📁 utils/            # Utilidades JavaScript
│   │   ├── 📄 App.js            # Componente principal
│   │   └── 📄 index.js          # Punto de entrada React
│   ├── 📁 public/               # Archivos públicos
│   └── 📄 package.json          # Dependencias Node.js
│
├── 📁 docs/                      # Documentación
│   ├── 📄 README.md             # README principal
│   ├── 📄 CONFIGURACION_COMPLETA.md
│   ├── 📄 GOOGLE_MAPS_SETUP.md
│   ├── 📄 MOBILE_OPTIMIZATION.md
│   └── 📄 ESTRUCTURA_PROYECTO.md (este archivo)
│
├── 📁 scripts/                   # Scripts adicionales
│   ├── 📄 show_ip.py            # Mostrar IP local
│   ├── 📄 test_multiple_users.py # Pruebas de múltiples usuarios
│   └── 📄 demo_multiple_users.py # Demostración
│
├── 📁 instance/                  # Base de datos SQLite
├── 📁 venv/                      # Entorno virtual Python
└── 📁 logs/                      # Logs de la aplicación (producción)
```

## 🔧 Componentes del Backend

### 📄 `main.py`
- **Propósito**: Punto de entrada principal de la aplicación
- **Responsabilidades**:
  - Importar y configurar la aplicación Flask
  - Ejecutar el servidor con la configuración apropiada
  - Manejar variables de entorno

### 📄 `config.py`
- **Propósito**: Configuración centralizada de la aplicación
- **Responsabilidades**:
  - Definir configuraciones para diferentes entornos (dev, prod, test)
  - Manejar variables de entorno
  - Configurar CORS, base de datos, APIs, etc.

### 📁 `backend/`

#### 📄 `__init__.py`
- Hace del directorio `backend` un paquete Python válido

#### 📄 `app.py`
- **Propósito**: Factory function para crear la aplicación Flask
- **Responsabilidades**:
  - Crear y configurar la instancia de Flask
  - Registrar rutas de la API
  - Inicializar extensiones (SQLAlchemy, CORS)
  - Aplicar configuraciones

#### 📄 `models.py`
- **Propósito**: Definir modelos de base de datos
- **Responsabilidades**:
  - Definir clases `Barberia` y `Calificacion`
  - Configurar relaciones entre modelos
  - Manejar tipos de datos y restricciones

#### 📄 `routes.py`
- **Propósito**: Definir endpoints de la API
- **Responsabilidades**:
  - Implementar funciones para cada ruta
  - Manejar requests y responses
  - Validar datos de entrada
  - Retornar respuestas JSON

#### 📄 `services.py`
- **Propósito**: Lógica de negocio y APIs externas
- **Responsabilidades**:
  - Integración con Google Places API
  - Cálculos de distancia
  - Caché de resultados
  - Manejo de errores de APIs externas

## 🎯 Beneficios de la Nueva Estructura

### ✅ **Separación de Responsabilidades**
- Cada archivo tiene una responsabilidad específica
- Fácil de entender y mantener
- Código más limpio y organizado

### ✅ **Modularidad**
- Componentes independientes
- Fácil de reutilizar
- Testing más sencillo

### ✅ **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Configuración flexible
- Soporte para múltiples entornos

### ✅ **Mantenibilidad**
- Código bien documentado
- Estructura clara
- Fácil debugging

## 🔄 Flujo de Datos

```
1. main.py → Crea aplicación Flask
2. config.py → Aplica configuración
3. backend/app.py → Registra rutas
4. backend/routes.py → Maneja requests
5. backend/services.py → Lógica de negocio
6. backend/models.py → Acceso a base de datos
7. Response → JSON al frontend
```

## 🧪 Testing

La nueva estructura facilita las pruebas:

```python
# Ejemplo de test unitario
from backend.app import create_app
from backend.models import db

def test_create_barberia():
    app = create_app('testing')
    with app.app_context():
        # Tests aquí
        pass
```

## 🚀 Despliegue

### Desarrollo
```bash
python main.py
```

### Producción
```bash
export FLASK_CONFIG=production
python main.py
```

### Docker (futuro)
```dockerfile
FROM python:3.9
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "main.py"]
```

## 📝 Convenciones

### Nomenclatura
- **Archivos Python**: snake_case (`models.py`, `routes.py`)
- **Clases**: PascalCase (`Barberia`, `Calificacion`)
- **Funciones**: snake_case (`obtener_barberias`)
- **Variables**: snake_case (`barberia_id`)

### Documentación
- Docstrings en todas las funciones
- Comentarios explicativos donde sea necesario
- README actualizado

### Imports
- Imports absolutos para módulos del proyecto
- Imports relativos para módulos del mismo paquete
- Imports organizados por tipo (stdlib, third-party, local)

---

**Esta estructura modular hace que el proyecto sea más profesional, mantenible y escalable.** 🎯 