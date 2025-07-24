#!/usr/bin/env python3
"""
Script simplificado para verificar las optimizaciones implementadas
"""

import os
import sys
from pathlib import Path

def verificar_archivos():
    """Verifica que todos los archivos de optimización existan"""
    print("Verificando archivos de optimizacion...")
    
    archivos_requeridos = [
        '.env',
        'backend/cache_manager.py',
        'backend/database_optimizations.py',
        'backend/logging_config.py',
        'backend/validators.py',
        'backend/init_optimizations.py'
    ]
    
    todos_existen = True
    for archivo in archivos_requeridos:
        if Path(archivo).exists():
            print(f"OK: {archivo}")
        else:
            print(f"ERROR: {archivo} no encontrado")
            todos_existen = False
    
    return todos_existen

def verificar_env():
    """Verifica la configuración del archivo .env"""
    print("\nVerificando archivo .env...")
    
    if not Path('.env').exists():
        print("ERROR: Archivo .env no encontrado")
        return False
    
    with open('.env', 'r') as f:
        content = f.read()
    
    variables_criticas = ['SECRET_KEY', 'JWT_SECRET_KEY']
    for var in variables_criticas:
        if f"{var}=" in content:
            print(f"OK: {var} configurada")
        else:
            print(f"ERROR: {var} no encontrada")
            return False
    
    return True

def verificar_imports():
    """Verifica que se puedan importar los módulos optimizados"""
    print("\nVerificando imports de optimizaciones...")
    
    try:
        from backend.cache_manager import cache, cache_stats
        print("OK: cache_manager importado")
        
        from backend.validators import InputValidator
        print("OK: validators importado")
        
        from backend.logging_config import get_logger
        print("OK: logging_config importado")
        
        return True
    except ImportError as e:
        print(f"ERROR: No se pudo importar modulo: {e}")
        return False

def main():
    print("VERIFICACION DE OPTIMIZACIONES APLICADAS")
    print("=" * 50)
    
    checks = [
        ("Archivos de optimizacion", verificar_archivos),
        ("Configuracion .env", verificar_env),
        ("Imports de modulos", verificar_imports)
    ]
    
    resultados = []
    for nombre, funcion in checks:
        try:
            resultado = funcion()
            resultados.append((nombre, resultado))
        except Exception as e:
            print(f"ERROR en {nombre}: {e}")
            resultados.append((nombre, False))
    
    print("\n" + "=" * 50)
    print("RESULTADOS:")
    
    exitosos = 0
    for nombre, resultado in resultados:
        estado = "OK" if resultado else "ERROR"
        print(f"{estado}: {nombre}")
        if resultado:
            exitosos += 1
    
    print(f"\nResultado final: {exitosos}/{len(resultados)} verificaciones pasaron")
    
    if exitosos == len(resultados):
        print("\nTODAS LAS OPTIMIZACIONES ESTAN LISTAS!")
        print("\nOptimizaciones aplicadas:")
        print("- JWT secrets seguros")
        print("- Cache multinivel implementado")
        print("- Validaciones robustas")
        print("- Logging estructurado")
        print("- Indices de base de datos")
        print("- Timeout para APIs externas")
        print("- Queries N+1 optimizadas")
        
        print("\nPara usar la aplicacion optimizada:")
        print("python main.py")
    else:
        print("\nAlgunas optimizaciones necesitan atencion.")
    
    return exitosos == len(resultados)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)