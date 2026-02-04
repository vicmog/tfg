import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Reserva", {
    id_reserva: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_recurso: {
      type: DataTypes.INTEGER,
      references: { model: "Recurso", key: "id_recurso" },
      onDelete: "CASCADE",
      allowNull: false
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      references: { model: "Cliente", key: "id_cliente" },
      onDelete: "CASCADE",
      allowNull: false
    },
    fecha_hora_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_hora_fin: { type: DataTypes.DATE, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "pendiente" },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Reserva");
}
