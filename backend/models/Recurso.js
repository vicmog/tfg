import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Recurso = sequelize.define(
    "Recurso",
    {
        id_recurso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        capacidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    {
        tableName: "Recurso",
        timestamps: true,
    }
);
