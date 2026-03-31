import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Descuento", {
    id_descuento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_producto: {
      type: DataTypes.INTEGER,
      references: { model: "Producto", key: "id_producto" },
      onDelete: "CASCADE",
      allowNull: false,
    },
    porcentaje_descuento: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Descuento");
}
