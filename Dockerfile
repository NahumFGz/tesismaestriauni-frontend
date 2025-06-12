# Usar una imagen de Node 22 para el build
FROM node:22-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de paquetes
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el código fuente
COPY . .

# Ejecutar el build
RUN npm run build

# Imagen final ligera con Node para servir la aplicación
FROM node:22-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar serve globalmente para servir archivos estáticos
RUN npm install -g serve

# Copiar el build generado desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Exponer el puerto 80 (interno del contenedor)
EXPOSE 80

# Comando para servir la aplicación en el puerto 80
CMD ["serve", "-s", "dist", "-l", "80"]
