import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  const table = await queryInterface.describeTable("ServicioReserva");

  if (table.id_servicio && !table.id_ps) {
    await queryInterface.renameColumn("ServicioReserva", "id_servicio", "id_ps");
  }

  const updatedTable = await queryInterface.describeTable("ServicioReserva");

  if (updatedTable.id_ps) {
    await queryInterface.changeColumn("ServicioReserva", "id_ps", {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "Servicio", key: "id_ps" },
      onDelete: "CASCADE",
      allowNull: false,
    });
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable("ServicioReserva");

  if (table.id_ps && !table.id_servicio) {
    await queryInterface.renameColumn("ServicioReserva", "id_ps", "id_servicio");
  }

  const updatedTable = await queryInterface.describeTable("ServicioReserva");

  if (updatedTable.id_servicio) {
    await queryInterface.changeColumn("ServicioReserva", "id_servicio", {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "Servicio", key: "id_servicio" },
      onDelete: "CASCADE",
      allowNull: false,
    });
  }
}