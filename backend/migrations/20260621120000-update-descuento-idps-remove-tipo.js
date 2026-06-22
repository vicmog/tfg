import { DataTypes } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const table = await queryInterface.describeTable("Descuento");

    if (table.id_producto && !table.id_ps) {
      await queryInterface.renameColumn("Descuento", "id_producto", "id_ps");
    }

    await queryInterface.changeColumn("Descuento", "id_ps", {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Producto",
        key: "id_ps",
      },
      onDelete: "CASCADE",
    });

    if (table.tipo_descuento) {
      await queryInterface.removeColumn("Descuento", "tipo_descuento");
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Descuento");

    if (!table.tipo_descuento) {
      await queryInterface.addColumn("Descuento", "tipo_descuento", {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "porcentaje",
      });
    }

    if (table.id_ps && !table.id_producto) {
      await queryInterface.renameColumn("Descuento", "id_ps", "id_producto");
    }

    await queryInterface.changeColumn("Descuento", "id_producto", {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Producto",
        key: "id_ps",
      },
      onDelete: "CASCADE",
    });
  },
};
