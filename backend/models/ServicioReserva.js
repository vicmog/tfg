import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const ServicioReserva = sequelize.define(
    "ServicioReserva",
    {
        id_servicio: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Servicio", key: "id_servicio" },
            onDelete: "CASCADE",
        },
        id_reserva: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Reserva", key: "id_reserva" },
            onDelete: "CASCADE",
        },
    },
    {
        tableName: "ServicioReserva",
        timestamps: true,
    }
);
