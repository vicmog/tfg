import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Servicio = sequelize.define(
    "Servicio",
    {
        id_servicio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        precio: { type: DataTypes.FLOAT, allowNull: false },
        duracion: { type: DataTypes.INTEGER, allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    },
    {
        tableName: "Servicio",
        timestamps: true,
    }
);