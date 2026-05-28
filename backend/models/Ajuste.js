import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Ajuste = sequelize.define(
    "Ajuste",
    {
        id_ajuste: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
            type: DataTypes.INTEGER,
            references: { model: "Negocio", key: "id_negocio" },
            onDelete: "CASCADE",
            allowNull: false,
            unique: true,
        },
        modulo_gastos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_clientes: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_empleados: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_servicios: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_recursos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_productos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_proveedores: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_compras: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_descuentos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_ventas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_reservas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        modulo_estadisticas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
        tableName: "Ajuste",
        timestamps: true,
    }
);
