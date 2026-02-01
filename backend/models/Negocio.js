import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Negocio = sequelize.define("Negocio", {
    id_negocio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    CIF: { type: DataTypes.STRING, allowNull: false, unique: true },
    plantilla: { type: DataTypes.INTEGER, defaultValue: 0 },
},
{
    tableName: "Negocio",
    timestamps: true,
});
