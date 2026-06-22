import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Descuento = sequelize.define(
    "Descuento",
    {
        id_descuento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_ps: {
            type: DataTypes.INTEGER,
            references: { model: "Producto", key: "id_ps" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        porcentaje_descuento: { type: DataTypes.FLOAT, allowNull: false },
        fecha_inicio: { 
            type: DataTypes.DATE, 
            allowNull: true,
            defaultValue: sequelize.fn('NOW')
        },
        fecha_fin: { 
            type: DataTypes.DATE, 
            allowNull: true
        },
    },
    {
        tableName: "Descuento",
        timestamps: true,
    }
);
