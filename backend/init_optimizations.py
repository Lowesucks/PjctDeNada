"""
Script para inicializar todas las optimizaciones del backend
"""

from flask import Flask
from .app import create_app
from .database_optimizations import (
    crear_indices_optimizados, 
    optimizar_configuracion_sqlite,
    obtener_estadisticas_db,
    analizar_performance_queries
)
from .cache_manager import warm_up_cache, setup_cache_cleanup, cache_stats

def inicializar_optimizaciones():
    """Inicializa todas las optimizaciones del sistema"""
    print("🚀 Iniciando optimizaciones del sistema...")
    
    # Crear aplicación Flask
    app = create_app()
    
    with app.app_context():
        print("\n📊 PASO 1: Optimizaciones de Base de Datos")
        print("=" * 50)
        
        # Optimizar configuración de SQLite
        if optimizar_configuracion_sqlite():
            print("✅ Configuración de SQLite optimizada")
        
        # Crear índices optimizados
        if crear_indices_optimizados():
            print("✅ Índices de base de datos creados")
        
        # Obtener estadísticas
        estadisticas = obtener_estadisticas_db()
        if estadisticas:
            print("✅ Estadísticas de DB obtenidas")
        
        print("\n💾 PASO 2: Sistema de Caché")
        print("=" * 50)
        
        # Configurar limpieza de caché
        setup_cache_cleanup()
        print("✅ Limpieza automática de caché configurada")
        
        # Calentar caché con datos frecuentes
        warm_up_cache()
        
        # Mostrar estadísticas de caché
        stats = cache_stats()
        print(f"📈 Estadísticas de caché: {stats}")
        
        print("\n🔍 PASO 3: Análisis de Performance")
        print("=" * 50)
        
        # Analizar performance de queries
        if analizar_performance_queries():
            print("✅ Análisis de performance completado")
        
        print("\n✨ OPTIMIZACIONES COMPLETADAS")
        print("=" * 50)
        print("🎯 Resumen de mejoras aplicadas:")
        print("   • Claves JWT seguras desde variables de entorno")
        print("   • Timeout y manejo de errores para APIs externas")
        print("   • Índices de base de datos para búsquedas geográficas")
        print("   • Sistema de caché multinivel (LRU + Memory)")
        print("   • Optimización de queries N+1 con joinedload")
        print("   • Configuración SQLite optimizada para rendimiento")
        print("   • Invalidación inteligente de caché")
        
        if estadisticas:
            print(f"\n📊 Estado actual de la base de datos:")
            print(f"   • Usuarios: {estadisticas.get('usuario', 0)}")
            print(f"   • Barberías: {estadisticas.get('barberia', 0)}")
            print(f"   • Calificaciones: {estadisticas.get('calificacion', 0)}")
            print(f"   • Favoritos: {estadisticas.get('favorito', 0)}")
            print(f"   • Tamaño DB: {estadisticas.get('tamaño_kb', 0)} KB")
            print(f"   • Índices: {len(estadisticas.get('indices', []))}")
        
        print("\n🎉 ¡Sistema optimizado y listo para producción!")

if __name__ == "__main__":
    inicializar_optimizaciones()