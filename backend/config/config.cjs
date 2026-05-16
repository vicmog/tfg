require('dotenv').config();

// Para Railway: construir DATABASE_URL desde variables individuales
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Si existe DATABASE_URL, usarla
  if (databaseUrl) {
    return { url: databaseUrl };
  }
  
  // Railway proporciona estas variables
  if (process.env.PGUSER && process.env.POSTGRES_PASSWORD && process.env.RAILWAY_PRIVATE_DOMAIN && process.env.PGDATABASE) {
    return {
      username: process.env.PGUSER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.PGDATABASE,
      host: process.env.RAILWAY_PRIVATE_DOMAIN,
      port: 5432
    };
  }
  
  // Fallback a variables locales
  return {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST
  };
};

module.exports = {
  development: {
    ...getDatabaseConfig(),
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
    ...getDatabaseConfig(),
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
