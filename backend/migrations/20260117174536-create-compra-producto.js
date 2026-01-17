import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("CompraProducto", {
    id_compra: {
      type: DataTypes.INTEGER,
      references: { model: "Compra", key: "id_compra" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    id_producto: {
      type: DataTypes.INTEGER,
      references: { model: "Producto", key: "id_producto" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("CompraProducto");
}
