import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const RecursoPlantilla = sequelize.define(
    "RecursoPlantilla",
    {
        id_recurso_plantilla: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_plantilla: {
            type: DataTypes.INTEGER,
            references: { model: "Plantilla", key: "id_plantilla" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        capacidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    {
        tableName: "RecursoPlantilla",
        timestamps: true,
    }
);
