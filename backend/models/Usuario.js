import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
export const Usuario = sequelize.define("Usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  dni: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  telefono: { type: DataTypes.STRING },
  contrasena: { type: DataTypes.STRING, allowNull: false },
  consentimiento: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: "Usuario",
  timestamps: true,
});
