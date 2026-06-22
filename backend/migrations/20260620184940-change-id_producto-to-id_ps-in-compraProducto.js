import { DataTypes } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      "CompraProducto",
      "id_producto",
      "id_ps"
    );

    await queryInterface.changeColumn("CompraProducto", "id_ps", {
      type: DataTypes.INTEGER,
      references: {
        model: "ProductoServicio",
        key: "id_ps"
      },
      onDelete: "CASCADE",
      primaryKey: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("CompraProducto", "id_ps", {
      type: DataTypes.INTEGER,
      references: {
        model: "Producto",
        key: "id_producto"
      },
      onDelete: "CASCADE",
      primaryKey: true
    });

    await queryInterface.renameColumn(
      "CompraProducto",
      "id_ps",
      "id_producto"
    );
  }
};