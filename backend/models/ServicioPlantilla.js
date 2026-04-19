import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const ServicioPlantilla = sequelize.define(
    "ServicioPlantilla",
    {
        id_servicio_plantilla: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_plantilla: {
            type: DataTypes.INTEGER,
            references: { model: "Plantilla", key: "id_plantilla" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        precio: { type: DataTypes.FLOAT, allowNull: false },
        duracion: { type: DataTypes.INTEGER, allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    },
    {
        tableName: "ServicioPlantilla",
        timestamps: true,
    }
);
