# Barberías App

Aplicación web para encontrar y calificar barberías cercanas.

## 🚀 Inicio Rápido

### 1. Verificar Configuración
```bash
verificar_configuracion.bat
```

### 2. Si hay errores, limpiar y reconstruir
```bash
limpiar_todo_y_reconstruir.bat
```

### 3. Crear archivos de configuración

**`.env` (en la raíz):**
```env
GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
FOURSQUARE_API_KEY=TU_API_KEY_DE_FOURSQUARE
```

**`frontend/.env`:**
```env
REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
HOST=0.0.0.0
PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

### 4. Iniciar aplicación
```bash
iniciar_simple.bat
```

## 📱 Acceso

- **Desktop**: http://localhost:3000
- **Móvil**: http://TU_IP_LOCAL:3000
- **Backend**: http://localhost:5000

## 🔧 Scripts Disponibles

- `verificar_configuracion.bat` - Verifica que todo esté configurado
- `limpiar_todo_y_reconstruir.bat` - Limpia y reconstruye todo
- `iniciar_simple.bat` - Inicia backend y frontend
- `run.py` - Script Python para iniciar todo

## 📋 Requisitos

- Python 3.8+
- Node.js 14+
- API Key de Google Maps

## 🛠️ Solución de Problemas

### Error "allowedHosts[0] should be a non-empty string"
Agregar `DANGEROUSLY_DISABLE_HOST_CHECK=true` en `frontend/.env`

### Puerto 3000 ocupado
Cerrar otros procesos o presionar 'Y' cuando React pregunte por otro puerto

### No carga desde teléfono
Verificar que `HOST=0.0.0.0` esté en `frontend/.env` 