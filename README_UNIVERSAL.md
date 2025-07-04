# 🚀 Barberías App - Iniciador Universal

Este proyecto ahora incluye scripts universales que funcionan en **cualquier plataforma**: Windows, Linux y macOS.

## 📋 Requisitos Previos

- **Python 3.7+** - [Descargar aquí](https://python.org)
- **Node.js 14+** - [Descargar aquí](https://nodejs.org)

## 🎯 Opciones de Inicio

### 1. **Script Universal (Recomendado)**
```bash
# En cualquier sistema operativo
python run.py
```

### 2. **Script de Shell Universal**
```bash
# En Linux/macOS/Git Bash
./run

# O si no es ejecutable
bash run
```

### 3. **Scripts Específicos por Plataforma**

#### Windows
```cmd
run.bat
```

#### Linux/macOS
```bash
./run.sh
```

## 🔧 Características del Script Universal

### ✅ **Detección Automática**
- Detecta automáticamente el sistema operativo
- Configura las rutas y comandos apropiados
- Maneja las diferencias entre Windows y Unix

### ✅ **Verificación de Dependencias**
- Verifica que Python esté instalado
- Verifica que Node.js esté instalado
- Muestra versiones detectadas

### ✅ **Instalación Automática**
- Crea entorno virtual de Python si no existe
- Instala dependencias de Python automáticamente
- Instala dependencias de Node.js automáticamente

### ✅ **Gestión de Procesos**
- Inicia backend y frontend en paralelo
- Maneja señales de interrupción (Ctrl+C)
- Limpia procesos al salir
- Abre automáticamente el navegador

### ✅ **Interfaz Amigable**
- Mensajes claros con emojis
- Indicadores de progreso
- Manejo de errores detallado

## 🚀 Cómo Usar

### Opción 1: Python Universal (Más Confiable)
```bash
# Navega al directorio del proyecto
cd ruta/a/tu/proyecto

# Ejecuta el script universal
python run.py
```

### Opción 2: Shell Universal
```bash
# En Linux/macOS/Git Bash
./run

# En Windows con Git Bash
bash run
```

### Opción 3: Scripts Específicos
```bash
# Windows (CMD o PowerShell)
run.bat

# Linux/macOS
./run.sh
```

## 📱 Acceso a la Aplicación

Una vez iniciado, la aplicación estará disponible en:

### **Desde tu computadora:**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### **Desde teléfonos y otros dispositivos en la misma red:**
- **Frontend**: http://[TU_IP_LOCAL]:3000
- **Backend**: http://[TU_IP_LOCAL]:5000

El script mostrará automáticamente tu IP local para acceso desde teléfonos.

### **Para encontrar tu IP manualmente:**
```bash
python show_ip.py
```

### **Requisitos para acceso desde teléfonos:**
1. Tu teléfono debe estar conectado a la misma red WiFi
2. El firewall debe permitir conexiones en los puertos 3000 y 5000
3. La aplicación debe estar ejecutándose en tu computadora

El navegador se abrirá automáticamente después de unos segundos.

## 🛑 Detener la Aplicación

Presiona **Ctrl+C** en la terminal donde ejecutaste el script. Esto detendrá tanto el backend como el frontend de forma limpia.

## 🔍 Solución de Problemas

### Error: "Python no está instalado"
```bash
# Instala Python desde https://python.org
# Asegúrate de marcar "Add Python to PATH" durante la instalación
```

### Error: "Node.js no está instalado"
```bash
# Instala Node.js desde https://nodejs.org
# El instalador agregará Node.js al PATH automáticamente
```

### Error: "Puerto ya en uso"
```bash
# Detén otros procesos que usen los puertos 3000 o 5000
# O cambia los puertos en la configuración
```

### Error: "Permisos denegados" (Linux/macOS)
```bash
# Dale permisos de ejecución al script
chmod +x run
chmod +x run.sh
```

## 📁 Estructura de Archivos

```
proyecto/
├── run.py          # Script universal en Python
├── run             # Script de shell universal
├── run.bat         # Script específico para Windows
├── run.sh          # Script específico para Unix
├── app.py          # Backend Flask
├── frontend/       # Aplicación React
└── requirements.txt # Dependencias de Python
```

## 🎉 Ventajas del Script Universal

1. **Una sola línea de comando** para cualquier plataforma
2. **Detección automática** del sistema operativo
3. **Manejo robusto de errores** y dependencias
4. **Limpieza automática** de procesos
5. **Interfaz consistente** en todas las plataformas
6. **Fácil de mantener** y actualizar

## 🔄 Migración desde Scripts Anteriores

Si ya usabas `run.bat` o `run.sh`, simplemente reemplázalos con:

```bash
python run.py
```

El script universal hace exactamente lo mismo pero de forma más robusta y compatible con todas las plataformas.

---

**¡Disfruta usando la aplicación de Barberías en cualquier plataforma! 🎯** 