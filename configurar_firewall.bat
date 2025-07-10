@echo off
echo 🔧 Configurando Firewall de Windows para Barberias App...
echo.

echo 📋 Agregando reglas para puerto 3000 (Frontend)...
netsh advfirewall firewall add rule name="Barberias Frontend" dir=in action=allow protocol=TCP localport=3000
if %errorlevel% equ 0 (
    echo ✓ Regla agregada para puerto 3000
) else (
    echo ❌ Error agregando regla para puerto 3000
)

echo.
echo 📋 Agregando reglas para puerto 5000 (Backend)...
netsh advfirewall firewall add rule name="Barberias Backend" dir=in action=allow protocol=TCP localport=5000
if %errorlevel% equ 0 (
    echo ✓ Regla agregada para puerto 5000
) else (
    echo ❌ Error agregando regla para puerto 5000
)

echo.
echo 📋 Verificando reglas existentes...
netsh advfirewall firewall show rule name="Barberias Frontend"
netsh advfirewall firewall show rule name="Barberias Backend"

echo.
echo ✅ Configuracion del firewall completada!
echo.
echo 📱 Ahora deberias poder acceder desde tu telefono usando:
echo    Frontend: http://TU_IP_LOCAL:3000
echo    Backend:  http://TU_IP_LOCAL:5000
echo.
echo 🔍 Para encontrar tu IP local, ejecuta: python show_ip.py
echo.
pause 