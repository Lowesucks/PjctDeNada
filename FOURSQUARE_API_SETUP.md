# 🏪 Configuración de Foursquare API

## 📋 Pasos para obtener tu API Key de Foursquare

### 1. Crear cuenta en Foursquare for Developers
1. Ve a [Foursquare for Developers](https://developer.foursquare.com/)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto

### 2. Obtener API Key
1. En tu dashboard de desarrollador, ve a "Projects"
2. Crea un nuevo proyecto o selecciona uno existente
3. En la configuración del proyecto, copia tu **API Key**

### 3. Configurar la API Key en la aplicación

#### Opción A: Variable de entorno (Recomendado)
Crea un archivo `.env` en la raíz del proyecto:

```bash
FOURSQUARE_API_KEY=tu_api_key_aqui
```

#### Opción B: Modificar directamente el código
En el archivo `app.py`, línea 15, reemplaza:

```python
FOURSQUARE_API_KEY = os.environ.get('FOURSQUARE_API_KEY', 'TU_API_KEY_FOURSQUARE')
```

Por:

```python
FOURSQUARE_API_KEY = 'tu_api_key_real_aqui'
```

### 4. Instalar dependencias
Ejecuta el comando para instalar la nueva dependencia:

```bash
pip install requests==2.31.0
```

## 🔧 Funcionalidades de Foursquare

### Búsqueda de barberías cercanas
La aplicación ahora busca barberías usando la API de Foursquare con estas características:

- **Búsqueda por ubicación**: Usa las coordenadas del usuario
- **Radio de búsqueda**: 5km por defecto (configurable)
- **Categorías**: Busca específicamente barberías y barber shops
- **Ordenamiento**: Por calificación y distancia
- **Información adicional**: 
  - Calificaciones de Foursquare
  - Distancia desde tu ubicación
  - Categoría del negocio
  - Teléfono (si está disponible)

### Combinación de datos
La aplicación combina:
- **Barberías de Foursquare**: Datos en tiempo real de la API
- **Barberías locales**: Datos guardados en tu base de datos

### Identificación visual
- Las barberías de Foursquare se muestran con un badge verde "📍 Foursquare"
- Se muestra la distancia en kilómetros
- Las calificaciones provienen de Foursquare

## 🚀 Uso

### Endpoint de barberías cercanas
```
GET /api/barberias/cercanas?lat={latitud}&lng={longitud}&radio={radio_en_metros}
```

### Parámetros:
- `lat`: Latitud (opcional, por defecto Ciudad de México)
- `lng`: Longitud (opcional, por defecto Ciudad de México)  
- `radio`: Radio de búsqueda en metros (opcional, por defecto 5000)

### Ejemplo de respuesta:
```json
[
  {
    "id": "fs_123456789",
    "nombre": "Barbería Moderna",
    "direccion": "Av. Principal 123, Ciudad",
    "telefono": "+52 55 1234 5678",
    "horario": "Horario no disponible",
    "latitud": 19.4326,
    "longitud": -99.1332,
    "calificacion_promedio": 4.5,
    "total_calificaciones": 25,
    "fuente": "foursquare",
    "distancia": 1200,
    "categoria": "Barber Shop"
  }
]
```

## ⚠️ Limitaciones

- **API Key opcional**: Sin API key, la aplicación funciona perfectamente con barberías locales
- **Límites de Foursquare**: Consulta los límites de tu plan en la documentación oficial
- **Datos limitados**: Algunos negocios pueden no tener teléfono u horarios disponibles

## 🔍 Solución de problemas

### Error "API Key no válida"
- Verifica que tu API key esté correctamente configurada
- Asegúrate de que el proyecto esté activo en Foursquare

### No se muestran barberías de Foursquare
- Verifica la conexión a internet
- Revisa los logs del servidor para errores de API
- Confirma que tu ubicación esté habilitada en el navegador

### Fallback automático
Si Foursquare no está disponible o no hay API key configurada, la aplicación automáticamente:
- Muestra solo barberías locales
- Continúa funcionando normalmente
- Muestra un indicador visual sutil de "Foursquare no configurado"
- Registra información en la consola del servidor

## 📱 Interfaz de usuario

### Indicadores visuales:
- **Badge verde**: Barberías de Foursquare
- **Distancia**: Mostrada en kilómetros
- **Calificaciones**: De Foursquare cuando están disponibles
- **Información faltante**: Se ocultan campos como "Teléfono no disponible"

### Búsqueda automática:
- Al cargar la aplicación, busca barberías cercanas automáticamente
- Usa la ubicación del usuario si está disponible
- Fallback a barberías locales si no hay ubicación o API key
- Indicador visual cuando Foursquare no está configurado 