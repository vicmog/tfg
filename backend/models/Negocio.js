import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const Negocio = sequelize.define(
  "Negocio",
  {
    id_negocio: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cif: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    plantilla: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "Negocio",
    timestamps: true,
  }
);
