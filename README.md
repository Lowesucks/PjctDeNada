# 🚀 Barberías App - Aplicación Universal

Una aplicación web moderna para encontrar y calificar barberías cercanas, con mapa interactivo y sistema de calificaciones.

## ✨ Características

- 🗺️ **Mapa Interactivo**: Visualiza barberías en un mapa con Leaflet
- 📍 **Ubicación en Tiempo Real**: Encuentra barberías cercanas a tu ubicación
- ⭐ **Sistema de Calificaciones**: Califica y comenta sobre barberías
- 🔍 **Búsqueda Avanzada**: Busca por nombre, dirección o ubicación
- 📱 **Responsive Design**: Funciona perfectamente en móviles y desktop
- 🌐 **Datos Reales**: Integración con OpenStreetMap para barberías reales
- 🎨 **UI Moderna**: Interfaz elegante con sidebar colapsible

## 🛠️ Tecnologías

- **Backend**: Python Flask + SQLAlchemy
- **Frontend**: React + Leaflet (mapas)
- **Base de Datos**: SQLite
- **APIs**: OpenStreetMap Overpass API
- **Estilos**: CSS moderno con animaciones

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
./run.sh
```

### Opción 3: Script de Shell Universal
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
- **Datos reales**: Integración con OpenStreetMap

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

## 🔧 Configuración Avanzada

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
FLASK_ENV=development
FLASK_DEBUG=True
```

### Configuración de APIs
La aplicación usa OpenStreetMap por defecto, pero puedes configurar otras APIs:

- **Google Places API**: Para datos más detallados
- **Foursquare API**: Para información adicional
- **OpenStreetMap**: Gratuito y sin límites

## 📁 Estructura del Proyecto

```
barberias-app/
├── app.py                 # Backend Flask
├── run.py                 # Script universal
├── run.bat               # Script Windows
├── run.sh                # Script Unix
├── show_ip.py            # Mostrar IP local
├── requirements.txt      # Dependencias Python
├── frontend/             # Aplicación React
│   ├── src/
│   ├── public/
│   └── package.json
├── instance/             # Base de datos SQLite
└── README.md
```

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

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **OpenStreetMap**: Por los datos de barberías
- **Leaflet**: Por la librería de mapas
- **React**: Por el framework frontend
- **Flask**: Por el framework backend

---

**¡Disfruta usando la aplicación de Barberías! 🎯** 