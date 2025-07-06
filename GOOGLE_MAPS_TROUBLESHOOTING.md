# 🔧 Solución de Problemas - Google Maps API

## 🚨 Error: ApiProjectMapError

### **Posibles causas:**

1. **API Key sin permisos**
2. **API no habilitada**
3. **Restricciones de dominio**
4. **Variable de entorno no cargada**

### **Pasos para verificar:**

#### **1. Verificar Google Cloud Console**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Enabled APIs**
4. Asegúrate de que **Maps JavaScript API** esté habilitada

#### **2. Verificar API Key**
1. Ve a **APIs & Services** → **Credentials**
2. Encuentra tu API Key (debería empezar con `AIzaSy...`)
3. Haz clic en la API Key
4. Verifica que tenga permisos para **Maps JavaScript API**

#### **3. Configurar restricciones (opcional)**
- **Application restrictions**: HTTP referrers
- **Website restrictions**: 
  - `http://localhost:3000/*`
  - `https://localhost:3000/*`
  - `http://TU_IP_LOCAL:3000/*` (reemplaza con tu IP local)

#### **4. Verificar variable de entorno**
```bash
# En frontend/.env
REACT_APP_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
```

### **Comandos de debug:**

```bash
# Verificar que la variable se carga
cd frontend
echo $env:REACT_APP_GOOGLE_MAPS_API_KEY

# Reiniciar completamente
taskkill /f /im node.exe
npm start
```

### **Verificar en el navegador:**
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Busca los logs de debug que agregamos
4. Deberías ver:
   ```
   API Key cargada: SÍ
   API Key valor: [tu-api-key-aqui]
   ```

### **Si el problema persiste:**
1. Crea una nueva API Key
2. Habilita solo Maps JavaScript API
3. Sin restricciones de dominio (solo para desarrollo)
4. Actualiza el archivo .env
5. Reinicia el servidor 