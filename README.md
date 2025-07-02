# ✂️ Barberías - Aplicación de Calificaciones

Una aplicación web moderna y minimalista para calificar barberías y lugares de corte de cabello. Diseñada con estilo iOS y completamente responsive para funcionar tanto en web como en dispositivos móviles.

## 🚀 Características

- **Diseño Minimalista**: Interfaz limpia y moderna inspirada en iOS
- **Responsive**: Funciona perfectamente en móviles, tablets y desktop
- **Calificaciones**: Sistema de 5 estrellas con comentarios
- **Búsqueda**: Busca barberías por nombre o dirección
- **API REST**: Backend robusto con Flask y SQLite
- **PWA Ready**: Preparada para convertirse en aplicación móvil

## 🛠️ Tecnologías Utilizadas

### Backend
- **Python 3.8+**
- **Flask** - Framework web
- **Flask-SQLAlchemy** - ORM para base de datos
- **SQLite** - Base de datos ligera
- **Flask-CORS** - Soporte para CORS

### Frontend
- **React 18** - Biblioteca de UI
- **Axios** - Cliente HTTP
- **CSS3** - Estilos personalizados estilo iOS

## 📦 Instalación y Ejecución

### 🚀 Forma Más Simple (Recomendada)

#### Windows
```bash
# Configuración inicial (solo la primera vez)
setup.bat

# Ejecutar la aplicación
run.bat
```

#### Linux/Mac
```bash
# Dar permisos de ejecución
chmod +x run.sh

# Configuración inicial (solo la primera vez)
./setup.sh

# Ejecutar la aplicación
./run.sh
```

### 📋 Instalación Manual

#### Prerrequisitos
- Python 3.8 o superior
- Node.js 14 o superior
- npm o yarn

#### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd barberias-app
```

#### 2. Configurar el Backend
```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor backend
python app.py
```

El backend estará disponible en `http://localhost:5000`

#### 3. Configurar el Frontend
```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Ejecutar el servidor de desarrollo
npm start
```

El frontend estará disponible en `http://localhost:3000`

## 🎯 Uso de la Aplicación

### Para Usuarios
1. **Explorar Barberías**: Ve la lista de barberías disponibles
2. **Buscar**: Usa la barra de búsqueda para encontrar barberías específicas
3. **Ver Detalles**: Toca una barbería para ver información completa
4. **Calificar**: Deja tu calificación y comentario sobre el servicio
5. **Leer Comentarios**: Revisa las opiniones de otros usuarios

### Para Desarrolladores
- **API Endpoints**: Documentación de la API en el código
- **Componentes React**: Estructura modular y reutilizable
- **Estilos CSS**: Sistema de diseño consistente

## 📱 Funcionalidades Móviles

La aplicación está optimizada para dispositivos móviles con:
- **Touch-friendly**: Botones y elementos táctiles
- **Responsive Design**: Se adapta a cualquier tamaño de pantalla
- **PWA Ready**: Puede instalarse como aplicación nativa
- **Offline Capable**: Preparada para funcionalidad offline

## 🗄️ Estructura de la Base de Datos

### Tabla: Barberia
- `id` - Identificador único
- `nombre` - Nombre de la barbería
- `direccion` - Dirección física
- `telefono` - Número de contacto
- `horario` - Horarios de atención
- `calificacion_promedio` - Promedio de calificaciones
- `total_calificaciones` - Número total de calificaciones
- `fecha_creacion` - Fecha de registro

### Tabla: Calificacion
- `id` - Identificador único
- `barberia_id` - Referencia a la barbería
- `nombre_usuario` - Nombre del usuario que califica
- `calificacion` - Puntuación de 1 a 5 estrellas
- `comentario` - Comentario opcional
- `fecha` - Fecha de la calificación

## 🔧 Configuración Avanzada

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///barberias.db
```

### Personalización de Estilos
Los estilos están en `frontend/src/index.css` y siguen el sistema de diseño iOS:
- Colores principales: `#007aff` (azul iOS)
- Fondo: `#f2f2f7` (gris claro iOS)
- Tipografía: San Francisco (sistema)

## 🚀 Despliegue

### Backend (Heroku/Vercel)
```bash
# Crear Procfile
echo "web: python app.py" > Procfile

# Configurar variables de entorno
heroku config:set FLASK_ENV=production
```

### Frontend (Netlify/Vercel)
```bash
# Construir para producción
npm run build

# Desplegar la carpeta build/
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes preguntas o problemas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación de la API

---

**¡Disfruta calificando las mejores barberías de tu ciudad! ✂️✨** 