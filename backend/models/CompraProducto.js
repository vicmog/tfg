import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const CompraProducto = sequelize.define(
    "CompraProducto",
    {
        id_compra: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Compra", key: "id_compra" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        id_producto: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Producto", key: "id_producto" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        cantidad_esperada: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        cantidad_llegada: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
        tableName: "CompraProducto",
        timestamps: true,
    }
);
