# Base Node.js LTS
FROM node:20-alpine

# Establecemos directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el código
COPY . .

# Exponemos el puerto
EXPOSE 3000

CMD sh -c "NODE_ENV=development npm run migrate && NODE_ENV=production npm run start"
