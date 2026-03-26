import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Producto = sequelize.define(
    "Producto",
    {
        id_producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_proveedor: {
            type: DataTypes.INTEGER,
            references: { model: "Proveedor", key: "id_proveedor" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        referencia: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
        descripcion: { type: DataTypes.STRING, allowNull: true },
        categoria: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
        precio_compra: { type: DataTypes.FLOAT, allowNull: false },
        precio_venta: { type: DataTypes.FLOAT, allowNull: false },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
        tableName: "Producto",
        timestamps: true,
    }
);
