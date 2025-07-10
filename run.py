#!/usr/bin/env python3
"""
Script universal para iniciar la aplicación de Barberías
Funciona en Windows, Linux y macOS
"""

import os
import sys
import subprocess
import platform
import time
import signal
import threading
from pathlib import Path
import types
from typing import cast

class BarberiasApp:
    def __init__(self):
        self.system: str = platform.system().lower()
        self.backend_process: subprocess.Popen[bytes] | None = None
        self.frontend_process: subprocess.Popen[bytes] | None = None
        self.running: bool = True
        
    def print_header(self):
        """Imprime el encabezado de la aplicación"""
        print("=" * 50)
        print("   Barberias App - Iniciador Universal")
        print("=" * 50)
        print()
        
    def check_python(self):
        """Verifica si Python está instalado"""
        try:
            result = subprocess.run([sys.executable, "--version"], 
                                  capture_output=True, text=True, check=True)
            print(f"✓ Python detectado: {result.stdout.strip()}")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ ERROR: Python no está instalado o no está en el PATH")
            print("Por favor instala Python desde https://python.org")
            return False
            
    def check_node(self):
        """Verifica si Node.js está instalado"""
        try:
            # En Windows, usar shell=True para mejor compatibilidad
            if self.system == "windows":
                result = subprocess.run("node --version", 
                                      shell=True, capture_output=True, text=True, check=True)
                print(f"✓ Node.js detectado: {result.stdout.strip()}")
                
                # Verificar también npm
                try:
                    npm_result = subprocess.run("npm --version", 
                                               shell=True, capture_output=True, text=True, check=True)
                    print(f"✓ npm detectado: {npm_result.stdout.strip()}")
                except subprocess.CalledProcessError:
                    print("⚠️  npm no detectado, intentando con npx...")
                    try:
                        npx_result = subprocess.run("npx --version", 
                                                   shell=True, capture_output=True, text=True, check=True)
                        print(f"✓ npx detectado: {npx_result.stdout.strip()}")
                    except subprocess.CalledProcessError:
                        print("❌ ERROR: npm y npx no están disponibles")
                        print("Por favor instala Node.js desde https://nodejs.org")
                        return False
            else:
                # En Unix, usar subprocess normal
                result = subprocess.run(["node", "--version"], 
                                      capture_output=True, text=True, check=True)
                print(f"✓ Node.js detectado: {result.stdout.strip()}")
                
                try:
                    npm_result = subprocess.run(["npm", "--version"], 
                                               capture_output=True, text=True, check=True)
                    print(f"✓ npm detectado: {npm_result.stdout.strip()}")
                except (subprocess.CalledProcessError, FileNotFoundError):
                    print("⚠️  npm no detectado, intentando con npx...")
                    try:
                        npx_result = subprocess.run(["npx", "--version"], 
                                                   capture_output=True, text=True, check=True)
                        print(f"✓ npx detectado: {npx_result.stdout.strip()}")
                    except (subprocess.CalledProcessError, FileNotFoundError):
                        print("❌ ERROR: npm y npx no están disponibles")
                        print("Por favor instala Node.js desde https://nodejs.org")
                        return False
            
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ ERROR: Node.js no está instalado o no está en el PATH")
            print("Por favor instala Node.js desde https://nodejs.org")
            return False
            
    def setup_python_dependencies(self):
        """Configura las dependencias de Python"""
        venv_path = Path("venv")
        
        if not venv_path.exists():
            print("📦 Instalando dependencias de Python...")
            try:
                _ = subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
                print("✓ Entorno virtual creado")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error creando entorno virtual: {e}")
                return False
                
        # Activar entorno virtual
        if self.system == "windows":
            pip_path = venv_path / "Scripts" / "pip.exe"
        else:
            pip_path = venv_path / "bin" / "pip"
            
        # Instalar dependencias
        if Path("requirements.txt").exists():
            try:
                _ = subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], check=True)
                print("✓ Dependencias de Python instaladas")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error instalando dependencias: {e}")
                return False
                
        return True
        
    def setup_node_dependencies(self):
        """Configura las dependencias de Node.js"""
        frontend_path = Path("frontend")
        node_modules_path = frontend_path / "node_modules"
        
        if not node_modules_path.exists():
            print("📦 Instalando dependencias de Node.js...")
            try:
                _ = subprocess.run(["npm", "install"], cwd=frontend_path, check=True)
                print("✓ Dependencias de Node.js instaladas")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error instalando dependencias de Node.js: {e}")
                return False
        else:
            print("✓ Dependencias de Node.js ya instaladas")
            
        return True
        
    def start_backend(self):
        """Inicia el backend"""
        print("🚀 Iniciando Backend...")
        
        # Configurar el entorno para el backend
        env = os.environ.copy()
        if self.system == "windows":
            venv_activate = Path("venv") / "Scripts" / "activate.bat"
            python_path = Path("venv") / "Scripts" / "python.exe"
        else:
            venv_activate = Path("venv") / "bin" / "activate"
            python_path = Path("venv") / "bin" / "python"
        
        # Detectar si hay certificados SSL
        cert_file = Path("frontend") / "cert.pem"
        key_file = Path("frontend") / "key.pem"
        use_https = cert_file.exists() and key_file.exists()
        self.backend_https = use_https
        
        # Iniciar backend
        try:
            if self.system == "windows":
                if use_https:
                    cmd = f'cmd /c "call {venv_activate} && python main.py --https"'
                else:
                    cmd = f'cmd /c "call {venv_activate} && python main.py"'
                self.backend_process = subprocess.Popen(cmd, shell=True)
            else:
                env["VIRTUAL_ENV"] = str(Path("venv").absolute())
                env["PATH"] = f"{Path('venv') / 'bin'}:{env.get('PATH', '')}"
                if use_https:
                    self.backend_process = subprocess.Popen([str(python_path), "main.py", "--https"], env=env)
                else:
                    self.backend_process = subprocess.Popen([str(python_path), "main.py"], env=env)
            print(f"✓ Backend iniciado en {'HTTPS' if use_https else 'HTTP'}")
            return True
        except Exception as e:
            print(f"❌ Error iniciando backend: {e}")
            return False
            
    def start_frontend(self):
        """Inicia el frontend"""
        print("🚀 Iniciando Frontend...")
        
        try:
            # Intentar diferentes comandos para iniciar el frontend
            commands_to_try = [
                ["npm", "start", "--", "--host", "0.0.0.0"],
                ["npx", "react-scripts", "start", "--", "--host", "0.0.0.0"]
            ]
            
            frontend_started = False
            
            for cmd in commands_to_try:
                try:
                    print(f"Intentando con: {' '.join(cmd)}")
                    
                    if self.system == "windows":
                        # En Windows, usar cwd para que el working directory sea 'frontend'
                        self.frontend_process = subprocess.Popen('npm start -- --host 0.0.0.0', shell=True, cwd='frontend')
                    else:
                        # En Unix, usar cwd para que el working directory sea 'frontend'
                        self.frontend_process = subprocess.Popen(cmd, cwd="frontend")
                    
                    print("✓ Frontend iniciado")
                    frontend_started = True
                    break
                    
                except (subprocess.CalledProcessError, FileNotFoundError) as e:
                    print(f"❌ Falló con {' '.join(cmd)}: {e}")
                    continue
                except Exception as e:
                    print(f"❌ Error inesperado con {' '.join(cmd)}: {e}")
                    continue
            
            if not frontend_started:
                print("❌ No se pudo iniciar el frontend con ningún comando disponible")
                print("Verifica que npm/npx esté instalado y en el PATH")
                return False
                
            return True
            
        except Exception as e:
            print(f"❌ Error general iniciando frontend: {e}")
            return False
            
    def cleanup(self, _signum: int | None = None, _frame: types.FrameType | None = None):
        """Limpia los procesos al salir"""
        print("\n🛑 Deteniendo servicios...")
        self.running = False
        
        if self.backend_process:
            try:
                self.backend_process.terminate()
                _ = self.backend_process.wait(timeout=5)
            except:
                self.backend_process.kill()
                
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                _ = self.frontend_process.wait(timeout=5)
            except:
                self.frontend_process.kill()
                
        print("✓ Servicios detenidos")
        
    def open_browser(self):
        """Abre el navegador después de un delay"""
        time.sleep(3)  # Esperar a que los servicios estén listos
        
        url = f"{'https' if getattr(self, 'frontend_https', False) else 'http'}://localhost:3000"
        try:
            if self.system == "windows":
                _ = os.startfile(url)
            elif self.system == "darwin":  # macOS
                _ = subprocess.run(["open", url])
            else:  # Linux
                _ = subprocess.run(["xdg-open", url])
        except:
            print("⚠️  No se pudo abrir el navegador automáticamente")
            
    def run(self):
        """Ejecuta la aplicación principal"""
        self.print_header()
        
        # Verificar dependencias
        if not self.check_python():
            return False
        if not self.check_node():
            return False
        
        # Configurar dependencias
        if not self.setup_python_dependencies():
            return False
        if not self.setup_node_dependencies():
            return False
        
        print("\n🚀 Iniciando servicios...\n")
        
        # Configurar manejo de señales para limpieza
        _ = signal.signal(signal.SIGINT, self.cleanup)
        if self.system != "windows":
            _ = signal.signal(signal.SIGTERM, self.cleanup)
        
        # Iniciar servicios
        if not self.start_backend():
            return False
        
        time.sleep(2)  # Esperar a que el backend se inicie
        
        # Detectar si el frontend usará HTTPS
        frontend_env = Path("frontend") / ".env"
        self.frontend_https = False
        if frontend_env.exists():
            with open(frontend_env, "r", encoding="utf-8") as f:
                env_lines = f.readlines()
            env_dict = dict(
                line.strip().split("=", 1) for line in env_lines if "=" in line and not line.strip().startswith("#")
            )
            if env_dict.get("HTTPS", "false").lower() == "true":
                self.frontend_https = True
        
        if not self.start_frontend():
            self.cleanup()
            return False
        
        # Abrir navegador en un hilo separado
        browser_thread = threading.Thread(target=self.open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Mostrar información de red para acceso desde teléfonos
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = cast(str, s.getsockname()[0])
            s.close()
            
            print("\n" + "=" * 50)
            print("   ¡Servicios iniciados!")
            print("=" * 50)
            print(f"Backend:  {'https' if self.backend_https else 'http'}://localhost:5000")
            print(f"Frontend: {'https' if self.frontend_https else 'http'}://localhost:3000")
            print()
            print("📱 Acceso desde teléfonos:")
            print(f"Frontend: {'https' if self.frontend_https else 'http'}://{local_ip}:3000")
            print(f"Backend:  {'https' if self.backend_https else 'http'}://{local_ip}:5000")
            print()
            print("💡 Asegúrate de que tu teléfono esté en la misma red WiFi")
            print("Las aplicaciones se abrirán automáticamente en tu navegador.")
            print("Presiona Ctrl+C para detener todos los servicios.")
            print()
        except:
            print("\n" + "=" * 50)
            print("   ¡Servicios iniciados!")
            print("=" * 50)
            print(f"Backend:  {'https' if self.backend_https else 'http'}://localhost:5000")
            print(f"Frontend: {'https' if self.frontend_https else 'http'}://localhost:3000")
            print()
            print("Las aplicaciones se abrirán automáticamente en tu navegador.")
            print("Presiona Ctrl+C para detener todos los servicios.")
            print()
        
        # Mantener el script ejecutándose
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.cleanup()
        
        return True

def main():
    """Función principal"""
    app = BarberiasApp()
    success = app.run()
    if not success:
        print("\n❌ Error al iniciar la aplicación")
        _ = input("Presiona Enter para salir...")
        sys.exit(1)

if __name__ == "__main__":
    main() 