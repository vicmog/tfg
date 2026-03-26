import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("Producto", "referencia", {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "",
  });

  await queryInterface.addColumn("Producto", "categoria", {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Producto", "categoria");
  await queryInterface.removeColumn("Producto", "referencia");
}
