#!/usr/bin/env python3
"""
Script original para iniciar la aplicación de Barberías
Versión simplificada y funcional
"""

import os
import sys
import subprocess
import platform
import time
import signal
import threading
from pathlib import Path

class BarberiasApp:
    def __init__(self):
        self.system = platform.system().lower()
        self.backend_process = None
        self.frontend_process = None
        self.running = True
        
    def print_header(self):
        """Imprime el encabezado de la aplicación"""
        print("=" * 50)
        print("   Barberias App - Iniciador Original")
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
            return False
            
    def check_node(self):
        """Verifica si Node.js está instalado"""
        try:
            if self.system == "windows":
                result = subprocess.run("node --version", 
                                      shell=True, capture_output=True, text=True, check=True)
                print(f"✓ Node.js detectado: {result.stdout.strip()}")
                
                try:
                    npm_result = subprocess.run("npm --version", 
                                               shell=True, capture_output=True, text=True, check=True)
                    print(f"✓ npm detectado: {npm_result.stdout.strip()}")
                except subprocess.CalledProcessError:
                    print("❌ ERROR: npm no está disponible")
                    return False
            else:
                result = subprocess.run(["node", "--version"], 
                                      capture_output=True, text=True, check=True)
                print(f"✓ Node.js detectado: {result.stdout.strip()}")
                
                try:
                    npm_result = subprocess.run(["npm", "--version"], 
                                               capture_output=True, text=True, check=True)
                    print(f"✓ npm detectado: {npm_result.stdout.strip()}")
                except (subprocess.CalledProcessError, FileNotFoundError):
                    print("❌ ERROR: npm no está disponible")
                    return False
            
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ ERROR: Node.js no está instalado o no está en el PATH")
            return False
            
    def setup_python_dependencies(self):
        """Configura las dependencias de Python"""
        venv_path = Path("venv")
        
        if not venv_path.exists():
            print("📦 Instalando dependencias de Python...")
            try:
                subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
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
                subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], check=True)
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
                subprocess.run(["npm", "install"], cwd=frontend_path, check=True)
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
        
        try:
            if self.system == "windows":
                venv_activate = Path("venv") / "Scripts" / "activate.bat"
                cmd = f'cmd /c "call {venv_activate} && python app.py"'
                self.backend_process = subprocess.Popen(cmd, shell=True)
            else:
                python_path = Path("venv") / "bin" / "python"
                self.backend_process = subprocess.Popen([str(python_path), "app.py"])
                
            print("✓ Backend iniciado")
            return True
        except Exception as e:
            print(f"❌ Error iniciando backend: {e}")
            return False
            
    def start_frontend(self):
        """Inicia el frontend"""
        print("🚀 Iniciando Frontend...")
        
        try:
            if self.system == "windows":
                # Iniciar frontend sin argumentos problemáticos
                shell_cmd = f'cd frontend && npm start'
                self.frontend_process = subprocess.Popen(shell_cmd, shell=True)
            else:
                self.frontend_process = subprocess.Popen(["npm", "start"], cwd="frontend")
            
            print("✓ Frontend iniciado")
            return True
            
        except Exception as e:
            print(f"❌ Error iniciando frontend: {e}")
            return False
            
    def cleanup(self, signum=None, frame=None):
        """Limpia los procesos al salir"""
        print("\n🛑 Deteniendo servicios...")
        self.running = False
        
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
            except:
                self.backend_process.kill()
                
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=5)
            except:
                self.frontend_process.kill()
                
        print("✓ Servicios detenidos")
        sys.exit(0)
        
    def open_browser(self):
        """Abre el navegador después de un delay"""
        time.sleep(3)
        
        try:
            if self.system == "windows":
                os.startfile("http://localhost:3000")
            elif self.system == "darwin":  # macOS
                subprocess.run(["open", "http://localhost:3000"])
            else:  # Linux
                subprocess.run(["xdg-open", "http://localhost:3000"])
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
        signal.signal(signal.SIGINT, self.cleanup)
        if self.system != "windows":
            signal.signal(signal.SIGTERM, self.cleanup)
            
        # Iniciar servicios
        if not self.start_backend():
            return False
            
        time.sleep(2)
        
        if not self.start_frontend():
            self.cleanup()
            return False
            
        # Abrir navegador en un hilo separado
        browser_thread = threading.Thread(target=self.open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        print("\n" + "=" * 50)
        print("   ¡Servicios iniciados!")
        print("=" * 50)
        print("Backend:  http://localhost:5000")
        print("Frontend: http://localhost:3000")
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
        input("Presiona Enter para salir...")
        sys.exit(1)

if __name__ == "__main__":
    main() 