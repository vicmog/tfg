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

## Configuracion de entorno

Crear el archivo backend/.env con variables como estas (ajustadas a tu entorno):

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=negocio360_dev
POSTGRES_DB_TEST=negocio360_test
POSTGRES_DB_PROD=negocio360_prod
BACKEND_PORT=3000
JWT_SECRET=tu_jwt_secret

Opcional para envio de correo:

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=
SMTP_ALLOW_SELF_SIGNED=false

## Puesta en marcha local

### 1) Backend

Desde la carpeta backend:

```bash
npm install
npm run migrate
npm start
```

API disponible en:

http://localhost:3000

### 2) App movil

Desde la carpeta AppMovil:

```bash
npm install
npm run start
```

Notas:

- La app usa por defecto la URL base http://localhost:3000.
- Si pruebas desde emulador o dispositivo fisico, ajusta la URL de API para que apunte a la IP de tu equipo.

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

## Docker

Existe un docker-compose.yml para levantar servicios. Antes de usarlo, revisa credenciales y variables de entorno para asegurar que backend y PostgreSQL queden alineados.

## Capturas

| ![Screen 1](https://github.com/user-attachments/assets/eeb5d64c-8a81-4070-811f-8b53cea15948) | ![Screen 2](https://github.com/user-attachments/assets/d3a89628-83c7-4c29-94dc-e3339be9b428) | ![Screen 3](https://github.com/user-attachments/assets/58527102-b8ea-41de-b031-074128ce8d7c) |
|:---:|:---:|:---:|
| Home | Login | Main Hub |







