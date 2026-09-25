FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD sh -c 'if [ -n "$DATABASE_URL" ]; then export NODE_ENV=production; else export NODE_ENV=development; fi && npm run migrate && npm run start'
