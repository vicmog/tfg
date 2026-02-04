import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("ServicioReserva", {
    id_servicio: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "Servicio", key: "id_servicio" },
      onDelete: "CASCADE"
    },
    id_reserva: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "Reserva", key: "id_reserva" },
      onDelete: "CASCADE"
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ServicioReserva");
}
