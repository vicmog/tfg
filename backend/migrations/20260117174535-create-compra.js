import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Compra", {
    id_compra: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion: { type: DataTypes.STRING },
    fecha: { type: DataTypes.DATE, allowNull: false },
    importe_total: { type: DataTypes.FLOAT, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "pendiente" },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Compra");
}
