# 🗺️ Configuración de Google Maps API

## 📋 Pasos para obtener tu API Key

### 1. Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la facturación (requerido para usar las APIs)

### 2. Habilitar APIs necesarias
En la consola de Google Cloud, habilita estas APIs:
- **Maps JavaScript API**
- **Places API** (opcional, para búsquedas avanzadas)
- **Geocoding API** (opcional, para convertir direcciones a coordenadas)

### 3. Crear credenciales
1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "API Key"
3. Copia la API key generada

### 4. Configurar restricciones (recomendado)
Para mayor seguridad, configura restricciones en tu API key:
- **Application restrictions**: HTTP referrers
- **API restrictions**: Solo las APIs que necesitas

### 5. Agregar la API key a la aplicación
1. Abre el archivo `frontend/src/config/maps.js`
2. Reemplaza `'TU_API_KEY_AQUI'` con tu API key real:

```javascript
export const GOOGLE_MAPS_API_KEY = 'tu_api_key_real_aqui';
```

## 🔧 Configuración adicional

### Cambiar ubicación por defecto
En `frontend/src/config/maps.js`, puedes cambiar las coordenadas por defecto:

```javascript
export const MAP_CONFIG = {
  defaultCenter: { lat: 19.4326, lng: -99.1332 }, // Ciudad de México
  // Cambia a las coordenadas de tu ciudad
  defaultZoom: 12,
  // ...
};
```

### Agregar coordenadas reales a las barberías
En el backend, puedes agregar coordenadas reales a las barberías:

```python
# En app.py, función crear_tablas()
barberias_ejemplo = [
    Barberia(
        nombre='Barbería Clásica', 
        direccion='Av. Principal 123', 
        telefono='555-0101', 
        horario='Lun-Sáb 9:00-19:00',
        latitud=19.4326,  # Coordenada real
        longitud=-99.1332  # Coordenada real
    ),
    # ...
]
```

## 💰 Costos
- **Google Maps JavaScript API**: Gratis hasta 28,500 cargas de mapa por mes
- **Places API**: Gratis hasta 1,000 solicitudes por mes
- **Geocoding API**: Gratis hasta 2,500 solicitudes por mes

Para uso personal o proyectos pequeños, es completamente gratuito.

## 🚀 Funcionalidades implementadas

### ✅ Completadas
- [x] Mapa interactivo con Google Maps
- [x] Marcadores para cada barbería
- [x] Info windows con detalles
- [x] Geolocalización del usuario
- [x] Botón para centrar en ubicación actual
- [x] Diseño responsive
- [x] Integración con la lista existente

### 🔄 Próximas mejoras (opcionales)
- [ ] Búsqueda de barberías por proximidad
- [ ] Rutas y navegación
- [ ] Filtros por calificación en el mapa
- [ ] Clusters de marcadores para muchas barberías
- [ ] Modo satélite/terreno

## 🐛 Solución de problemas

### Error: "Error al cargar Google Maps"
- Verifica que tu API key sea válida
- Asegúrate de que las APIs estén habilitadas
- Revisa las restricciones de la API key

### El mapa no se centra en mi ubicación
- Verifica que el navegador tenga permisos de ubicación
- Asegúrate de estar usando HTTPS (requerido para geolocalización)

### Los marcadores no aparecen
- Verifica que las barberías tengan coordenadas válidas
- Revisa la consola del navegador para errores

## 📱 Prueba en móvil
La funcionalidad de mapas funciona perfectamente en dispositivos móviles:
- Geolocalización automática
- Gestos táctiles (zoom, pan)
- Diseño responsive
- Info windows optimizadas para touch 