import bcrypt from "bcrypt";
import { QueryTypes } from "sequelize";

const ADMIN_USERNAME = "admin";
const ADMIN_NAME = "Administrador";
const ADMIN_DNI = "00000000T";
const ADMIN_EMAIL = "admin@miapp.com";
const ADMIN_PASSWORD = "Admin1234!";

export async function up(queryInterface) {
  const [existingUsers] = await queryInterface.sequelize.query(
    `SELECT id_usuario FROM "Usuario" WHERE nombre_usuario = :username LIMIT 1`,
    {
      replacements: { username: ADMIN_USERNAME },
      type: QueryTypes.SELECT,
    }
  );

  if (existingUsers) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await queryInterface.bulkInsert("Usuario", [
    {
      nombre_usuario: ADMIN_USERNAME,
      nombre: ADMIN_NAME,
      dni: ADMIN_DNI,
      email: ADMIN_EMAIL,
      numero_telefono: null,
      contrasena: passwordHash,
      consentimiento: true,
      validacion: true,
      codigo_validacion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("Usuario", { nombre_usuario: ADMIN_USERNAME });
}