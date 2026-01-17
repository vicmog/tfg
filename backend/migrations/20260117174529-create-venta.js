import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Venta", {
    id_venta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_cliente: {
      type: DataTypes.INTEGER,
      references: { model: "Cliente", key: "id_cliente" },
      onDelete: "CASCADE",
      allowNull: false
    },
    fecha: { type: DataTypes.DATE, allowNull: false },
    precio_total: { type: DataTypes.FLOAT, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "pendiente" },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Venta");
}
