# Etapa 1: Build del frontend
FROM node:22-alpine AS builder

# Crea el directorio de trabajo
WORKDIR /app

# Copia dependencias e instala
COPY package*.json ./
RUN npm install

# Copia el resto del código y compila
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Etapa 2: Servir archivos estáticos con Nginx
FROM nginx:alpine

# Elimina la configuración por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia el build desde el contenedor anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia la configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto del servidor
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]