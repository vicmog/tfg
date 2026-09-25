import { Sequelize } from "sequelize";
import config from "./../config/config.cjs";

const environment = process.env.NODE_ENV || "development";
const sequelizeConfig = config[environment] || config.development;

const options = {
  freezeTableName: true,
  dialect: sequelizeConfig.dialect
};

if (sequelizeConfig.host) {
  options.host = sequelizeConfig.host;
}

if (sequelizeConfig.port) {
  options.port = sequelizeConfig.port;
}

if (sequelizeConfig.dialectOptions) {
  options.dialectOptions = sequelizeConfig.dialectOptions;
}

export const sequelize = sequelizeConfig.use_env_variable
  ? new Sequelize(process.env[sequelizeConfig.use_env_variable], options)
  : new Sequelize(
      sequelizeConfig.database,
      sequelizeConfig.username,
      sequelizeConfig.password,
      options
    );
