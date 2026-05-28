import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Producto = sequelize.define(
    "Producto",
    {
        nombre: { type: DataTypes.STRING, allowNull: false },
        descripcion: { type: DataTypes.STRING, allowNull: true },
        id_ps: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "ProductoServicio", key: "id_ps" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        id_proveedor: {
            type: DataTypes.INTEGER,
            references: { model: "Proveedor", key: "id_proveedor" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        referencia: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
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
