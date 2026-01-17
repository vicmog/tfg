import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("ServicioReserva", {
    id_servicio: {
      type: DataTypes.INTEGER,
      references: { model: "ServicioNormal", key: "id_servicio" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    id_reserva: {
      type: DataTypes.INTEGER,
      references: { model: "Reserva", key: "id_reserva" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ServicioReserva");
}
