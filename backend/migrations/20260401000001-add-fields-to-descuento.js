import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("Descuento", "tipo_descuento", {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: "porcentaje",
  });

  await queryInterface.addColumn("Descuento", "fecha_inicio", {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
  });

  await queryInterface.addColumn("Descuento", "fecha_fin", {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Descuento", "tipo_descuento");
  await queryInterface.removeColumn("Descuento", "fecha_inicio");
  await queryInterface.removeColumn("Descuento", "fecha_fin");
}
