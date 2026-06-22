# Negocio360

Aplicacion de gestion para pequenos negocios con arquitectura de dos capas:

- App movil en Expo React Native
- API REST en Node.js con Express
- Base de datos PostgreSQL

## Estado actual del proyecto

El proyecto ya no esta en fase inicial. Actualmente cuenta con backend y app movil funcionales para operaciones clave del negocio.

### Modulos implementados

- Autenticacion y usuarios
- Negocios y roles de usuarios en negocio
- Clientes
- Empleados
- Productos
- Proveedores
- Compras
- Ventas
- Servicios
- Reservas
- Recursos
- Gastos y tipos de gasto
- Descuentos
- Plantillas
- Estadisticas

## Estructura del repositorio

- AppMovil: aplicacion Expo
- backend: API REST, modelos Sequelize, migraciones y tests
- docker-compose.yml: orquestacion para servicios de backend y base de datos

## Stack tecnico

- Frontend movil: Expo 54, React Native 0.81, Expo Router
- Backend: Node.js, Express, Sequelize
- Base de datos: PostgreSQL
- Testing: Jest en backend y AppMovil

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- PostgreSQL 16 recomendado
- Docker y Docker Compose para levantar backend y base de datos

## Configuracion de entorno

### Backend

Crear el archivo [backend/.env](backend/.env) con estas variables, ajustadas a tu entorno:

```env
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=root
POSTGRES_PASSWORD=root
POSTGRES_DB=postgres
BACKEND_PORT=3000
JWT_SECRET=tu_jwt_secret
ADMIN_PASSWORD=tu_password_admin

# Opcionales
POSTGRES_DB_TEST=negocio360_test
POSTGRES_DB_PROD=negocio360_prod
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=victor.dilar@gmail.com
SMTP_PASS=lovm mgcd xotw mtsy
FROM_EMAIL=Negocio360 no-reply@miapp.com
SMTP_ALLOW_SELF_SIGNED=true
```

### AppMovil

La app movil no usa un archivo `.env` actualmente. La URL del backend esta definida en [AppMovil/app/constants/apiRoutes.ts](AppMovil/app/constants/apiRoutes.ts) como `http://localhost:3000`.

Si ejecutas la app en un emulador o dispositivo fisico, ajusta esa constante para que apunte a la IP de tu equipo o al backend que estes usando.

## Puesta en marcha local

### 1) Backend y PostgreSQL con Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d
```

Eso levanta PostgreSQL y el backend. El backend ejecuta las migraciones automaticamente al arrancar.

Para ver los logs:

```bash
docker compose logs -f backend
```

Para parar y borrar tambien los datos de PostgreSQL:

```bash
docker compose down -v
```

API disponible en:

http://localhost:3000

### 2) App movil

Desde la carpeta AppMovil:

```bash
npm install
npm run start
```

La app movil se arranca con `npm run start`.

Notas:

- Si el backend esta corriendo en Docker, la app puede seguir apuntando a `http://localhost:3000` desde el mismo equipo.
- Si usas un emulador o dispositivo fisico, revisa la constante de API para que apunte a la IP correcta.

## Scripts utiles

### Backend

```bash
npm start
npm run migrate
npm run migrate:undo
npm test
```

### AppMovil

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm test
```

## Capturas

| ![Screen 1](https://github.com/user-attachments/assets/eeb5d64c-8a81-4070-811f-8b53cea15948) | ![Screen 2](https://github.com/user-attachments/assets/d3a89628-83c7-4c29-94dc-e3339be9b428) | ![Screen 3](https://github.com/user-attachments/assets/58527102-b8ea-41de-b031-074128ce8d7c) |
|:---:|:---:|:---:|
| Home | Login | Main Hub |







