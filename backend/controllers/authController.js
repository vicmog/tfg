import { Usuario } from "../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function register(req, res) {
  try {
    const { nombre_usuario, nombre, dni, email, telefono, contrasena, consentimiento } = req.body;

    if (!nombre_usuario || !nombre || !dni || !email || !contrasena || consentimiento === undefined) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const existing = await Usuario.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email ya registrado" });

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const usuario = await Usuario.create({
      nombre_usuario,
      nombre,
      dni,
      email,
      telefono,
      contrasena: hashedPassword,
      consentimiento
    });

    return res.status(201).json({ message: "Usuario registrado", usuario_id: usuario.id_usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function login(req, res) {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) return res.status(401).json({ message: "Credenciales inválidas" });

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "8h" }
    );

    return res.status(200).json({ message: "Login exitoso", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
