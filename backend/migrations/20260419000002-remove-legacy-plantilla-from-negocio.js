import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  const negocioTable = await queryInterface.describeTable("Negocio");
  if (negocioTable.plantilla) {
    await queryInterface.removeColumn("Negocio", "plantilla");
  }
}

export async function down(queryInterface) {
  const negocioTable = await queryInterface.describeTable("Negocio");
  if (!negocioTable.plantilla) {
    await queryInterface.addColumn("Negocio", "plantilla", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
}
