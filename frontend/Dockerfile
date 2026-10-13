FROM node:24-alpine

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Omitimos las dependencias opcionales de otras plataformas
RUN npm install 

# Copiamos el código fuente
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Ejecutamos el servidor de desarrollo permitiendo conexiones externas (--host)
CMD ["npm", "run", "dev", "--", "--host"]