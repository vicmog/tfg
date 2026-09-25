require('dotenv').config();

function shouldUseSsl() {
  return Boolean(process.env.DATABASE_URL || process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production");
}

function buildPostgresConfig({ ssl = false } = {}) {
  if (process.env.DATABASE_URL) {
    const config = {
      use_env_variable: "DATABASE_URL",
      dialect: "postgres"
    };

    if (ssl || shouldUseSsl()) {
      config.dialectOptions = {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      };
    }

    return config;
  }

  const config = {
    username: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || 'root',
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'postgres',
    host: process.env.PGHOST || process.env.RAILWAY_PRIVATE_DOMAIN || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.PGPORT || process.env.POSTGRES_PORT || 5432,
    dialect: "postgres"
  };

  if (ssl || shouldUseSsl()) {
    config.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

  return config;
}

module.exports = {
  development: buildPostgresConfig(),
  test: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_TEST,
    host: process.env.POSTGRES_HOST,
    dialect: "postgres"
  },
  production: buildPostgresConfig({ ssl: true })
};
