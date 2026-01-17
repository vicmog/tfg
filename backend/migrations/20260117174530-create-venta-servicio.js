import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("VentaServicio", {
    id_venta: {
      type: DataTypes.INTEGER,
      references: { model: "Venta", key: "id_venta" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    id_servicio: {
      type: DataTypes.INTEGER,
      references: { model: "ServicioNormal", key: "id_servicio" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("VentaServicio");
}
