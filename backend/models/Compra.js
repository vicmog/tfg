import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Compra = sequelize.define(
    "Compra",
    {
        id_compra: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        descripcion: { type: DataTypes.STRING, allowNull: true },
        fecha: { type: DataTypes.DATE, allowNull: false },
        importe_total: { type: DataTypes.FLOAT, allowNull: false },
        estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "pendiente" },
    },
    {
        tableName: "Compra",
        timestamps: true,
    }
);
