import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const ProductoServicioVenta = sequelize.define(
    "ProductoServicioVenta",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_venta: {
            type: DataTypes.INTEGER,
            references: { model: "Venta", key: "id_venta" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        id_ps: {
            type: DataTypes.INTEGER,
            references: { model: "ProductoServicio", key: "id_ps" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        precio_unitario: { type: DataTypes.FLOAT, allowNull: false },
        subtotal: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
        tableName: "ProductoServicioVenta",
        timestamps: true,
    }
);