import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Gasto = sequelize.define(
    "Gasto",
    {
        id_gasto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_tipo_gasto: {
            type: DataTypes.INTEGER,
            references: { model: "TipoGasto", key: "id_tipo_gasto" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        fecha: { type: DataTypes.DATE, allowNull: false },
        importe: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
        tableName: "Gasto",
        timestamps: true,
    }
);