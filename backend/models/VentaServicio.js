import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const VentaServicio = sequelize.define(
    "VentaServicio",
    {
        id_venta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Venta", key: "id_venta" },
            onDelete: "CASCADE",
        },
        id_servicio: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Servicio", key: "id_servicio" },
            onDelete: "CASCADE",
        },
    },
    {
        tableName: "VentaServicio",
        timestamps: true,
    }
);
