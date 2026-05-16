require('dotenv').config();

const commonConfig = {
  dialect: "postgres"
};

module.exports = {
  development: {
    ...(process.env.DATABASE_URL 
      ? { use_env_variable: "DATABASE_URL" }
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
    use_env_variable: "DATABASE_URL",
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
