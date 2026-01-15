import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import { Usuario } from "./Usuario.js";
import { Negocio } from "./Negocio.js";

export const UsuarioNegocio = sequelize.define(
  "UsuarioNegocio",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      references: {
        model: Usuario,
        key: "id_usuario",
      },
      allowNull: false,
    },
    id_negocio: {
      type: DataTypes.INTEGER,
      references: {
        model: Negocio,
        key: "id_negocio",
      },
      allowNull: false,
    },
    rol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "UsuarioNegocio",
    timestamps: true,
  }
);
