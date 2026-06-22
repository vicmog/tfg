import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Servicio", {
    id_servicio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    duracion: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Servicio");
}
