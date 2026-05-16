require('dotenv').config();

const commonConfig = {
  dialect: "postgres"
};

// Para Railway: construir DATABASE_URL desde variables individuales
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Railway proporciona estas variables
  if (process.env.PGUSER && process.env.POSTGRES_PASSWORD && process.env.RAILWAY_PRIVATE_DOMAIN && process.env.PGDATABASE) {
    return `postgresql://${process.env.PGUSER}:${process.env.POSTGRES_PASSWORD}@${process.env.RAILWAY_PRIVATE_DOMAIN}:5432/${process.env.PGDATABASE}`;
  }
  
  return undefined;
};

module.exports = {
  development: {
    ...(getDatabaseUrl() 
      ? { url: getDatabaseUrl() }
      : {
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          host: process.env.POSTGRES_HOST
        }
    ),
    ...commonConfig
  },
  test: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_TEST,
    host: process.env.POSTGRES_HOST,
    ...commonConfig
  },
  production: {
    ...(getDatabaseUrl() 
      ? { url: getDatabaseUrl() }
      : {
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          host: process.env.POSTGRES_HOST
        }
    ),
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    ...commonConfig
  }
};
