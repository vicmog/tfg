import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Gasto", {
    id_gasto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_tipo_gasto: {
      type: DataTypes.INTEGER,
      references: { model: "TipoGasto", key: "id_tipo_gasto" },
      onDelete: "CASCADE",
      allowNull: false
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    importe: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Gasto");
}
