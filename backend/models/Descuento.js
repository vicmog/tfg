import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Descuento = sequelize.define(
    "Descuento",
    {
        id_descuento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_producto: {
            type: DataTypes.INTEGER,
            references: { model: "Producto", key: "id_producto" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        porcentaje_descuento: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
        tableName: "Descuento",
        timestamps: true,
    }
);
