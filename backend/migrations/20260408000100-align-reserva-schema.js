import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  const table = await queryInterface.describeTable("Reserva");

  if (!table.id_recurso) {
    await queryInterface.addColumn("Reserva", "id_recurso", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Recurso", key: "id_recurso" },
      onDelete: "CASCADE",
    });
  }

  if (!table.fecha_hora_inicio) {
    await queryInterface.addColumn("Reserva", "fecha_hora_inicio", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!table.fecha_hora_fin) {
    await queryInterface.addColumn("Reserva", "fecha_hora_fin", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  const updatedTable = await queryInterface.describeTable("Reserva");

  if (
    updatedTable.fecha
    && updatedTable.hora_inicio
    && updatedTable.hora_fin
    && updatedTable.fecha_hora_inicio
    && updatedTable.fecha_hora_fin
  ) {
    await queryInterface.sequelize.query(`
      UPDATE "Reserva"
      SET
        "fecha_hora_inicio" = COALESCE("fecha_hora_inicio", ("fecha"::timestamp + "hora_inicio")),
        "fecha_hora_fin" = COALESCE("fecha_hora_fin", ("fecha"::timestamp + "hora_fin"))
      WHERE "fecha" IS NOT NULL
    `);
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable("Reserva");

  if (table.fecha_hora_fin) {
    await queryInterface.removeColumn("Reserva", "fecha_hora_fin");
  }

  if (table.fecha_hora_inicio) {
    await queryInterface.removeColumn("Reserva", "fecha_hora_inicio");
  }

  if (table.id_recurso) {
    await queryInterface.removeColumn("Reserva", "id_recurso");
  }
}
