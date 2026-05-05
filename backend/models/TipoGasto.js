import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const TipoGasto = sequelize.define(
    "TipoGasto",
    {
        id_tipo_gasto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre_tipo: { type: DataTypes.STRING, allowNull: false },
    },
    {
        tableName: "TipoGasto",
        timestamps: true,
    }
);