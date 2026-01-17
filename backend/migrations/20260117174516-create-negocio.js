import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Negocio", {
    id_negocio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    CIF: { type: DataTypes.STRING, allowNull: false, unique: true },
    plantilla: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Negocio");
}
