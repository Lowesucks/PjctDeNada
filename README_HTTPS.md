# 🔒 Configuración HTTPS para Barberías App

## 📋 Opciones disponibles

### **1. Desarrollo Local (localhost)**

#### **Frontend (React)**
```bash
# En PowerShell
cd frontend
npm run start-https
```

#### **Backend (Flask)**
```bash
# Generar certificados SSL de desarrollo
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Ejecutar con HTTPS
python run_https.py
```

### **2. Producción con Servicios Cloud**

#### **Opción A: Vercel (Frontend) + Railway (Backend)**
- **Vercel**: Despliegue automático con HTTPS
- **Railway**: Backend con SSL automático

#### **Opción B: Netlify (Frontend) + Heroku (Backend)**
- **Netlify**: HTTPS automático
- **Heroku**: SSL automático en planes pagos

#### **Opción C: AWS/GCP/Azure**
- **CloudFront** + **EC2/App Engine**
- **Load Balancer** con certificados SSL

### **3. Servidor Propio**

#### **Con Nginx como Proxy Inverso**
```nginx
server {
    listen 443 ssl;
    server_name tu-dominio.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### **Con Let's Encrypt (Certificados Gratuitos)**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com
```

## 🚀 Pasos para Desarrollo Local

### **1. Generar Certificados SSL**
```bash
# En PowerShell (requiere OpenSSL instalado)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

### **2. Iniciar Backend HTTPS**
```bash
cd backend
python run_https.py
```

### **3. Iniciar Frontend HTTPS**
```bash
cd frontend
npm run start-https
```

### **4. Acceder a la aplicación**
- Frontend: `https://localhost:3000`
- Backend: `https://localhost:5000`

## ⚠️ Notas Importantes

### **Certificados de Desarrollo**
- Los certificados autofirmados mostrarán advertencias en el navegador
- Es normal en desarrollo local
- Para producción, usar certificados de autoridades certificadoras

### **Variables de Entorno**
```bash
# Frontend (.env)
HTTPS=true
SSL_CRT_FILE=cert.pem
SSL_KEY_FILE=key.pem

# Backend (.env)
FLASK_ENV=production
SSL_CERT_FILE=cert.pem
SSL_KEY_FILE=key.pem
```

### **CORS con HTTPS**
```python
# En app.py
CORS(app, origins=['https://localhost:3000', 'https://tu-dominio.com'])
```

## 🔧 Troubleshooting

### **Error: "SSL certificate verify failed"**
- En desarrollo: ignorar advertencias del navegador
- En producción: verificar certificados válidos

### **Error: "Mixed content"**
- Asegurar que todas las URLs usen HTTPS
- Verificar APIs externas (Google Maps, etc.)

### **Error: "CORS"**
- Configurar CORS para incluir URLs HTTPS
- Verificar headers de seguridad

## 📚 Recursos Adicionales

- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Config Generator](https://ssl-config.mozilla.org/) 