import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("VentaServicio", {
    id_venta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "Venta", key: "id_venta" },
      onDelete: "CASCADE"
    },
    id_servicio: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "Servicio", key: "id_servicio" },
      onDelete: "CASCADE"
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("VentaServicio");
}
