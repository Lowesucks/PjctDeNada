# 🚀 Barberías App - Aplicación Universal

Una aplicación web moderna para encontrar y calificar barberías cercanas, con mapa interactivo y sistema de calificaciones.

## ✨ Características

- 🗺️ **Mapa Interactivo**: Visualiza barberías en un mapa con Google Maps
- 📍 **Ubicación en Tiempo Real**: Encuentra barberías cercanas a tu ubicación
- ⭐ **Sistema de Calificaciones**: Califica y comenta sobre barberías
- 🔍 **Búsqueda Avanzada**: Busca por nombre, dirección o ubicación
- 📱 **Responsive Design**: Funciona perfectamente en móviles y desktop
- 🌐 **Datos Reales**: Integración con Google Places API para barberías reales
- 🎨 **UI Moderna**: Interfaz elegante con sidebar colapsible

## 🛠️ Tecnologías

- **Backend**: Python Flask + SQLAlchemy (estructura modular)
- **Frontend**: React + Google Maps API
- **Base de Datos**: SQLite
- **APIs**: Google Places API
- **Estilos**: CSS moderno con optimizaciones móviles

## 📋 Requisitos

- **Python 3.7+**
- **Node.js 14+**
- **npm** (incluido con Node.js)

## 🚀 Instalación y Uso

### Opción 1: Script Universal (Recomendado)
```bash
python run.py
```

### Opción 2: Scripts Específicos por Plataforma

#### Windows
```cmd
run.bat
```

#### Linux/macOS
```bash
./run
```

## 📱 Acceso a la Aplicación

Una vez iniciada, la aplicación estará disponible en:

### Desde tu computadora:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Desde otros dispositivos en la misma red:
- **Frontend**: http://[TU_IP_LOCAL]:3000
- **Backend**: http://[TU_IP_LOCAL]:5000

Para encontrar tu IP local:
```bash
python show_ip.py
```

## 🎯 Funcionalidades Principales

### 🗺️ Mapa Interactivo
- Visualización de barberías en el mapa
- Marcadores con información detallada
- Centrado automático en tu ubicación
- Zoom y navegación intuitiva

### 📍 Búsqueda de Barberías
- **Búsqueda por ubicación**: Encuentra barberías cercanas
- **Búsqueda por nombre**: Busca barberías específicas
- **Filtros**: Por distancia, calificación, etc.
- **Datos reales**: Integración con Google Places API

### ⭐ Sistema de Calificaciones
- Califica barberías del 1 al 5 estrellas
- Agrega comentarios y reseñas
- Promedio de calificaciones en tiempo real
- Historial de calificaciones

### 🎨 Interfaz de Usuario
- **Sidebar colapsible**: Menú lateral elegante
- **Animaciones suaves**: Transiciones fluidas
- **Diseño responsive**: Adaptable a cualquier pantalla
- **Tema moderno**: UI limpia y profesional

## 📁 Estructura del Proyecto

```
barberias-app/
├── main.py                 # Punto de entrada principal
├── run.py                  # Script universal de inicio
├── run.bat                # Script Windows
├── run                    # Script Unix
├── show_ip.py             # Mostrar IP local
├── requirements.txt       # Dependencias Python
├── backend/               # Backend modular
│   ├── __init__.py
│   ├── app.py            # Configuración de Flask
│   ├── models.py         # Modelos de base de datos
│   ├── routes.py         # Rutas de la API
│   └── services.py       # Lógica de negocio y APIs
├── frontend/              # Aplicación React
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/                  # Documentación
│   ├── README.md
│   ├── CONFIGURACION_COMPLETA.md
│   ├── GOOGLE_MAPS_SETUP.md
│   └── ...
├── scripts/               # Scripts adicionales
└── instance/              # Base de datos SQLite
```

## 🔧 Configuración Avanzada

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
FLASK_ENV=development
FLASK_DEBUG=True
GOOGLE_MAPS_API_KEY=tu_clave_de_google_maps
```

### Configuración de APIs
La aplicación usa Google Places API por defecto. Configura tu clave de API:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto y habilita Places API
3. Genera una clave de API
4. Configúrala en las variables de entorno

## 🧪 Pruebas

### Prueba de Múltiples Usuarios
```bash
python test_multiple_users.py
```

### Demostración de Funcionalidades
```bash
python demo_multiple_users.py
```

## 🛑 Detener la Aplicación

Presiona **Ctrl+C** en la terminal donde ejecutaste el script. Esto detendrá tanto el backend como el frontend de forma limpia.

## 🔍 Solución de Problemas

### Error: "Puerto ya en uso"
- Detén otros procesos que usen los puertos 3000 o 5000
- O cambia los puertos en la configuración

### Error: "Dependencias no encontradas"
- Ejecuta `pip install -r requirements.txt`
- Ejecuta `npm install` en el directorio frontend

### Error: "No se puede conectar"
- Verifica que estés en la misma red WiFi
- Usa `python show_ip.py` para obtener la IP correcta

## 📚 Documentación Adicional

Consulta la carpeta `docs/` para documentación detallada:

- [Configuración Completa](docs/CONFIGURACION_COMPLETA.md)
- [Configuración de Google Maps](docs/GOOGLE_MAPS_SETUP.md)
- [Optimización Móvil](docs/MOBILE_OPTIMIZATION.md)
- [Solución de Problemas](docs/GOOGLE_MAPS_TROUBLESHOOTING.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Google Places API**: Por los datos de barberías
- **Google Maps**: Por la librería de mapas
- **React**: Por el framework frontend
- **Flask**: Por el framework backend

---

**¡Disfruta usando la aplicación de Barberías! 🎯** 