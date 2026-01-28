import nodemailer from "nodemailer";

const allowSelfSigned = process.env.SMTP_ALLOW_SELF_SIGNED === "true";
const transportOptions = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

if (allowSelfSigned) {
  transportOptions.tls = { rejectUnauthorized: false };
}

const transporter = nodemailer.createTransport(transportOptions);

export async function sendValidationEmail(to, code, nombre_usuario) {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const subject = "Código de validación";
  const text = `Hola ${nombre_usuario || ""},\n\nTu código de validación es: ${code}\n\nSi no solicitaste esto, ignora este correo.`;
  return transporter.sendMail({ from, to, subject, text });
}

export async function sendNewPasswordEmail(to, newPassword, nombre_usuario) {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const subject = "Recuperación de contraseña";
  const text = `Hola ${nombre_usuario || ""},\n\nSe ha generado una nueva contraseña para tu cuenta: ${newPassword}\n\nPor favor inicia sesión y cambia la contraseña lo antes posible.`;
  return transporter.sendMail({ from, to, subject, text });
}
