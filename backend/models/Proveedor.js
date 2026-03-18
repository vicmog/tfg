import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Proveedor = sequelize.define(
    "Proveedor",
    {
        id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        cif_nif: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
        contacto: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
        telefono: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        tipo_proveedor: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
        direccion: { type: DataTypes.STRING, allowNull: true },
    },
    {
        tableName: "Proveedor",
        timestamps: true,
    }
);
