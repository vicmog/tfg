import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const UsuarioNegocio = sequelize.define("UsuarioNegocio", {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: "Usuario", key: "id_usuario" },
        onDelete: "CASCADE"
    },
    id_negocio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: "Negocio", key: "id_negocio" },
        onDelete: "CASCADE"
    },
    rol: { type: DataTypes.STRING, allowNull: false },
},
{
    tableName: "UsuarioNegocio",
    timestamps: true,
});
