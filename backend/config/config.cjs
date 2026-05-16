require('dotenv').config();

module.exports = {
  development: {
    // En development: intenta Railway primero, luego locales
    username: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'root',
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'postgres',
    host: process.env.RAILWAY_PRIVATE_DOMAIN || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.PGPORT || 5432,
    dialect: "postgres"
  },
  test: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_TEST,
    host: process.env.POSTGRES_HOST,
    dialect: "postgres"
  },
  production: {
    username: process.env.PGUSER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.RAILWAY_PRIVATE_DOMAIN,
    port: 5432,
    dialect: "postgres",
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
