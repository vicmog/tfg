import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Proveedor", {
    id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_negocio: {
      type: DataTypes.INTEGER,
      references: { model: "Negocio", key: "id_negocio" },
      onDelete: "CASCADE",
      allowNull: false
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    telefono: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    direccion: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Proveedor");
}
