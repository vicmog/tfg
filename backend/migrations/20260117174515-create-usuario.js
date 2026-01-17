import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Usuario", {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    dni: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    numero_telefono: { type: DataTypes.STRING },
    contrasena: { type: DataTypes.STRING, allowNull: false },
    consentimiento: { type: DataTypes.BOOLEAN, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Usuario");
}
