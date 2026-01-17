import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Cliente", {
    id_cliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_negocio: {
      type: DataTypes.INTEGER,
      references: { model: "Negocio", key: "id_negocio" },
      onDelete: "CASCADE",
      allowNull: false
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido1: { type: DataTypes.STRING, allowNull: false },
    apellido2: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    numero_telefono: { type: DataTypes.STRING },
    bloqueado: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Cliente");
}
