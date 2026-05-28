import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const ServicioReserva = sequelize.define(
    "ServicioReserva",
    {
        id_ps: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Servicio", key: "id_ps" },
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
