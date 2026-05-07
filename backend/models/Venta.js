import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Venta = sequelize.define(
    "Venta",
    {
        id_venta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_cliente: {
            type: DataTypes.INTEGER,
            references: { model: "Cliente", key: "id_cliente" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        fecha: { type: DataTypes.DATE, allowNull: false },
        precio_total: { type: DataTypes.FLOAT, allowNull: false },
        tipo: { type: DataTypes.ENUM("producto", "servicio"), allowNull: false },
        estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "completada" },
    },
    {
        tableName: "Venta",
        timestamps: true,
    }
);
