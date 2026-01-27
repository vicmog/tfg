import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("Usuario", "validacion", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn("Usuario", "codigo_validacion", {
    type: DataTypes.STRING,
    allowNull: true
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Usuario", "codigo_validacion");
  await queryInterface.removeColumn("Usuario", "validacion");
}
