import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Empleado = sequelize.define(
    "Empleado",
    {
        id_empleado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        apellido1: { type: DataTypes.STRING, allowNull: false },
        apellido2: { type: DataTypes.STRING },
        numero_telefono: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
    },
    {
        tableName: "Empleado",
        timestamps: true,
    }
);
