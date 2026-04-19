import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Negocio = sequelize.define("Negocio", {
    id_negocio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    CIF: { type: DataTypes.STRING, allowNull: false, unique: true },
    id_plantilla: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Plantilla", key: "id_plantilla" },
        onDelete: "SET NULL",
    },
},
{
    tableName: "Negocio",
    timestamps: true,
});
