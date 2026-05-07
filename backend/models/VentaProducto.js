import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const VentaProducto = sequelize.define(
    "VentaProducto",
    {
        id_venta: {
            type: DataTypes.INTEGER,
            references: { model: "Venta", key: "id_venta" },
            onDelete: "CASCADE",
            primaryKey: true,
        },
        id_producto: {
            type: DataTypes.INTEGER,
            references: { model: "Producto", key: "id_producto" },
            onDelete: "CASCADE",
            primaryKey: true,
        },
        cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    {
        tableName: "VentaProducto",
        timestamps: true,
    }
);
