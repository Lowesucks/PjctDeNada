@echo off
echo 🚀 Iniciando Barberias App con Diagnostico Completo
echo ================================================
echo.

echo 🔍 Ejecutando diagnostico de conectividad...
python diagnostico_conectividad.py
if %errorlevel% neq 0 (
    echo.
    echo ❌ Problemas detectados en el diagnostico
    echo    Verifica los errores arriba y ejecuta las soluciones sugeridas
    pause
    exit /b 1
)

echo.
echo ✅ Diagnostico completado exitosamente
echo.
echo 🚀 Iniciando aplicacion...
echo.

python run.py

pause 