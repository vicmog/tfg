import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("UsuarioNegocio", {
    id_usuario: {
      type: DataTypes.INTEGER,
      references: { model: "Usuario", key: "id_usuario" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    id_negocio: {
      type: DataTypes.INTEGER,
      references: { model: "Negocio", key: "id_negocio" },
      onDelete: "CASCADE",
      primaryKey: true
    },
    rol: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("UsuarioNegocio");
}
