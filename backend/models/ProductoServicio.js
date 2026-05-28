import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const ProductoServicio = sequelize.define(
    "ProductoServicio",
    {
        id_ps: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
        precio: { type: DataTypes.FLOAT, allowNull: false },
        tipo: {
            type: DataTypes.ENUM("PRODUCTO", "SERVICIO"),
            allowNull: false,
        },
    },
    {
        tableName: "ProductoServicio",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);