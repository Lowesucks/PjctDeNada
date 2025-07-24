"""
Optimizaciones de base de datos para mejorar el rendimiento de consultas
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, Index
from .models import db, Barberia, Calificacion, Favorito, Usuario

def crear_indices_optimizados():
    """Crea índices optimizados para mejorar el rendimiento de consultas"""
    try:
        # Índices para búsquedas geográficas (latitud, longitud)
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_barberia_geo 
            ON barberia (latitud, longitud)
        """))
        
        # Índice para búsquedas por google_place_id
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_barberia_google_place_id 
            ON barberia (google_place_id)
        """))
        
        # Índice para búsquedas de texto en nombre y dirección
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_barberia_nombre_lower 
            ON barberia (LOWER(nombre))
        """))
        
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_barberia_direccion_lower 
            ON barberia (LOWER(direccion))
        """))
        
        # Índices para calificaciones ordenadas por fecha
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_calificacion_barberia_fecha 
            ON calificacion (barberia_id, fecha DESC)
        """))
        
        # Índice para calificaciones por usuario
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_calificacion_usuario_fecha 
            ON calificacion (usuario_id, fecha DESC)
        """))
        
        # Índice compuesto para favoritos (ya existe constraint único, pero mejoramos performance)
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_favorito_usuario_barberia 
            ON favorito (usuario_id, barberia_id)
        """))
        
        # Índice para favoritos por fecha
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_favorito_fecha 
            ON favorito (fecha_agregado DESC)
        """))
        
        # Índice para usuarios activos
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_usuario_activo 
            ON usuario (activo, ultimo_acceso DESC)
        """))
        
        # Índice para búsqueda por email (ya existe UNIQUE, pero optimizamos)
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_usuario_email_lower 
            ON usuario (LOWER(email))
        """))
        
        db.session.commit()
        print("✅ Índices de base de datos creados exitosamente")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al crear índices: {str(e)}")
        return False

def optimizar_configuracion_sqlite():
    """Optimiza la configuración de SQLite para mejor rendimiento"""
    try:
        # Configuraciones de rendimiento para SQLite
        optimizaciones = [
            "PRAGMA journal_mode=WAL",  # Write-Ahead Logging para mejor concurrencia
            "PRAGMA synchronous=NORMAL",  # Balance entre seguridad y velocidad
            "PRAGMA cache_size=10000",  # Aumentar caché (10MB aprox)
            "PRAGMA temp_store=memory",  # Tablas temporales en memoria
            "PRAGMA mmap_size=268435456",  # Memory mapping de 256MB
            "PRAGMA optimize"  # Optimizar estadísticas
        ]
        
        for pragma in optimizaciones:
            db.session.execute(text(pragma))
        
        db.session.commit()
        print("✅ Configuración de SQLite optimizada")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al optimizar SQLite: {str(e)}")
        return False

def analizar_performance_queries():
    """Analiza el performance de queries comunes"""
    try:
        # Análisis de queries más comunes
        queries_analisis = [
            {
                'descripcion': 'Búsqueda geográfica de barberías',
                'query': """
                    EXPLAIN QUERY PLAN 
                    SELECT * FROM barberia 
                    WHERE latitud BETWEEN 19.4 AND 19.5 
                    AND longitud BETWEEN -99.2 AND -99.1
                """
            },
            {
                'descripcion': 'Calificaciones por barbería ordenadas por fecha',
                'query': """
                    EXPLAIN QUERY PLAN 
                    SELECT * FROM calificacion 
                    WHERE barberia_id = 1 
                    ORDER BY fecha DESC 
                    LIMIT 10
                """
            },
            {
                'descripcion': 'Favoritos de usuario',
                'query': """
                    EXPLAIN QUERY PLAN 
                    SELECT * FROM favorito 
                    WHERE usuario_id = 1 
                    ORDER BY fecha_agregado DESC
                """
            }
        ]
        
        print("📊 Análisis de rendimiento de queries:")
        for consulta in queries_analisis:
            print(f"\n🔍 {consulta['descripcion']}:")
            resultado = db.session.execute(text(consulta['query'])).fetchall()
            for fila in resultado:
                print(f"   {fila}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en análisis de performance: {str(e)}")
        return False

def obtener_estadisticas_db():
    """Obtiene estadísticas de la base de datos"""
    try:
        estadisticas = {}
        
        # Contar registros por tabla
        tablas = ['usuario', 'barberia', 'calificacion', 'favorito']
        for tabla in tablas:
            resultado = db.session.execute(text(f"SELECT COUNT(*) FROM {tabla}")).scalar()
            estadisticas[tabla] = resultado
        
        # Tamaño de la base de datos
        resultado = db.session.execute(text("PRAGMA page_count")).scalar()
        page_size = db.session.execute(text("PRAGMA page_size")).scalar()
        tamaño_kb = (resultado * page_size) / 1024
        estadisticas['tamaño_kb'] = round(tamaño_kb, 2)
        
        # Información de índices
        indices = db.session.execute(text("""
            SELECT name, tbl_name 
            FROM sqlite_master 
            WHERE type='index' AND name NOT LIKE 'sqlite_%'
        """)).fetchall()
        estadisticas['indices'] = [{'nombre': idx[0], 'tabla': idx[1]} for idx in indices]
        
        print("📈 Estadísticas de la base de datos:")
        print(f"   • Usuarios: {estadisticas['usuario']}")
        print(f"   • Barberías: {estadisticas['barberia']}")
        print(f"   • Calificaciones: {estadisticas['calificacion']}")
        print(f"   • Favoritos: {estadisticas['favorito']}")
        print(f"   • Tamaño: {estadisticas['tamaño_kb']} KB")
        print(f"   • Índices: {len(estadisticas['indices'])}")
        
        return estadisticas
        
    except Exception as e:
        print(f"❌ Error al obtener estadísticas: {str(e)}")
        return {}