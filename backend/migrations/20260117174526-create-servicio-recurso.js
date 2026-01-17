import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("ServicioRecurso", {
    id_servicio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_negocio: {
      type: DataTypes.INTEGER,
      references: { model: "Negocio", key: "id_negocio" },
      onDelete: "CASCADE",
      allowNull: false
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    duracion: { type: DataTypes.INTEGER, allowNull: false },
    capacidad: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ServicioRecurso");
}
