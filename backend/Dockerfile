FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD sh -c "NODE_ENV=development npm run migrate && NODE_ENV=production npm run start"
