import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Servicio = sequelize.define(
    "Servicio",
    {
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        precio: { type: DataTypes.FLOAT, allowNull: false },
        id_ps: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "ProductoServicio", key: "id_ps" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        id_recurso_favorito: {
            type: DataTypes.INTEGER,
            references: { model: "Recurso", key: "id_recurso" },
            onDelete: "SET NULL",
            allowNull: true,
        },
        duracion: { type: DataTypes.INTEGER, allowNull: false },
        requiere_capacidad: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
        tableName: "Servicio",
        timestamps: true,
    }
);