import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Plantilla = sequelize.define(
    "Plantilla",
    {
        id_plantilla: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
        descripcion: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    },
    {
        tableName: "Plantilla",
        timestamps: true,
    }
);
