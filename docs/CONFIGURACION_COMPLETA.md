# Configuración Completa - Barberías App

## 📁 Estructura de Archivos Necesaria

```
Code/
├── .env                          # Variables del backend
├── frontend/
│   └── .env                     # Variables del frontend
├── app.py                       # Backend Flask
├── requirements.txt             # Dependencias Python
├── frontend/
│   ├── package.json            # Dependencias Node.js
│   └── src/                    # Código React
└── venv/                       # Entorno virtual Python
```

## 🔧 Archivos de Configuración

### 1. `.env` (en la raíz del proyecto)
```env
# Google Maps API Key (OBLIGATORIO)
GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS

# Foursquare API Key (OPCIONAL)
FOURSQUARE_API_KEY=TU_API_KEY_DE_FOURSQUARE

# Configuración de la base de datos
DATABASE_URL=sqlite:///barberias.db

# Configuración del servidor
FLASK_ENV=development
FLASK_DEBUG=1
```

### 2. `frontend/.env`
```env
# Google Maps API Key (OBLIGATORIO)
REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS

# Configuración para acceso externo
HOST=0.0.0.0
PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true

# URL del backend (opcional)
REACT_APP_API_URL=http://localhost:5000
```

## 🚀 Pasos para Configurar

### Paso 1: Limpieza Completa
```bash
# Ejecutar el script de limpieza
limpiar_todo_y_reconstruir.bat
```

### Paso 2: Crear Archivos .env
1. Crear `.env` en la raíz con las variables del backend
2. Crear `frontend/.env` con las variables del frontend

### Paso 3: Obtener API Keys

#### Google Maps API Key:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Maps JavaScript
4. Crea credenciales (API Key)
5. Restringe la API Key a tu dominio (opcional pero recomendado)

### Paso 4: Iniciar la Aplicación
```bash
# Opción 1: Script simple
iniciar_simple.bat

# Opción 2: Script completo
python run.py
```

## 🔍 Verificación

### Backend funcionando:
- http://localhost:5000 debería responder
- http://localhost:5000/api/barberias debería devolver JSON

### Frontend funcionando:
- http://localhost:3000 debería mostrar la aplicación
- El mapa debería cargar sin errores

### Acceso desde teléfono:
- Frontend: http://TU_IP_LOCAL:3000
- Backend: http://TU_IP_LOCAL:5000

## 🛠️ Solución de Problemas

### Error "allowedHosts[0] should be a non-empty string":
- Agregar `DANGEROUSLY_DISABLE_HOST_CHECK=true` en `frontend/.env`

### Error "API Key no configurada":
- Verificar que las API keys estén en los archivos `.env`
- Verificar que los archivos `.env` estén en las ubicaciones correctas

### Puerto 3000 ocupado:
- Cerrar otros procesos que usen el puerto
- O presionar 'Y' cuando React pregunte por otro puerto

### Frontend no carga desde teléfono:
- Verificar que `HOST=0.0.0.0` esté en `frontend/.env`
- Verificar que el firewall permita conexiones al puerto 3000

## 📱 Configuración para Acceso Móvil

### Variables necesarias en `frontend/.env`:
```env
HOST=0.0.0.0
PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

### Variables necesarias en `.env` (backend):
```env
FLASK_ENV=development
FLASK_DEBUG=1
```

## 🔄 Sincronización entre Desarrolladores

1. **Compartir archivos de configuración**:
   - `requirements.txt`
   - `frontend/package.json`
   - `app.py`
   - Archivos de componentes React

2. **NO compartir**:
   - Archivos `.env` (contienen API keys personales)
   - `venv/` (entorno virtual)
   - `node_modules/` (dependencias)
   - `*.db` (base de datos local)

3. **Para sincronizar cambios**:
   - Cada desarrollador debe ejecutar `limpiar_todo_y_reconstruir.bat`
   - Recrear sus archivos `.env` con sus propias API keys
   - Ejecutar `iniciar_simple.bat`

## ✅ Checklist de Verificación

- [ ] Archivo `.env` en la raíz con `GOOGLE_MAPS_API_KEY`
- [ ] Archivo `frontend/.env` con `REACT_APP_GOOGLE_MAPS_API_KEY`
- [ ] `HOST=0.0.0.0` en `frontend/.env`
- [ ] `DANGEROUSLY_DISABLE_HOST_CHECK=true` en `frontend/.env`
- [ ] Backend responde en http://localhost:5000
- [ ] Frontend responde en http://localhost:3000
- [ ] Mapa carga sin errores
- [ ] Acceso desde teléfono funciona 