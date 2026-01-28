import { Usuario } from "../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendValidationEmail, sendNewPasswordEmail } from "../utils/mailer.js";

export const register = async (req, res) => {
    const { nombre_usuario, nombre, dni, numero_telefono, email, contrasena, consentimiento } = req.body;
    if (!dni) {
        return res.status(400).json({
            message: "El DNI es obligatorio",
        });
    }
    if (!nombre_usuario || !nombre || !email || !contrasena) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    try {
        const existingUser = await Usuario.findOne({ where: { nombre_usuario } });
        if (existingUser) {
            return res.status(400).json({ message: "Usuario ya registrado con este nombre de usuario" });
        }
        const seed = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, seed);
        const codigo_validacion = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await Usuario.create({
            nombre_usuario,
            nombre,
            dni,
            numero_telefono,
            email,
            contrasena: hashedPassword,
            consentimiento: consentimiento || false,
            codigo_validacion: codigo_validacion,
        });

        try {
            await sendValidationEmail(email, codigo_validacion, nombre_usuario);
        } catch (mailErr) {
            console.error("Error sending validation email:", mailErr);
        }

        return res.status(201).json({ message: "Usuario registrado correctamente", userId: user.id_usuario });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en el servidor" });
    }
}

export const login = async (req, res) => {
    const { nombre_usuario, contrasena } = req.body;
    if (!nombre_usuario || !contrasena) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    try {
        const user = await Usuario.findOne({ where: { nombre_usuario } });
        if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

       

        const token = jwt.sign({ id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        
         if (!user.validacion) {
            return res.status(200).json({ id_usuario: user.id_usuario, token, message: "UsuarioNoValidado"});
        }

        return res.status(200).json({ id_usuario: user.id_usuario, token});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const validateCode = async (req, res) => {
    const { id_usuario, codigo_validacion } = req.body;
    if (!id_usuario || !codigo_validacion) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    try {
        const user = await Usuario.findOne({ where: { id_usuario } });
        if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

        if (user.codigo_validacion !== codigo_validacion) {
            return res.status(400).json({ message: "Código inválido" });
        }

        user.validacion = true;
        user.codigo_validacion = null;
        await user.save();

        const token = jwt.sign({ id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        return res.status(200).json({ id_usuario: user.id_usuario, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const resetPassword = async (req, res) => {
    const { nombre_usuario } = req.body;
    if (!nombre_usuario) {
        return res.status(400).json({ message: "Falta el nombre de usuario" });
    }

    try {
        const user = await Usuario.findOne({ where: { nombre_usuario } });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        // Generar contraseña aleatoria sencilla
        const generateRandomPassword = (len = 10) => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
            let pw = "";
            for (let i = 0; i < len; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
            return pw;
        };

        const newPassword = generateRandomPassword(12);
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        user.contrasena = hashed;
        await user.save();

        try {
            await sendNewPasswordEmail(user.email, newPassword, user.nombre_usuario);
        } catch (mailErr) {
            console.error("Error sending new password email:", mailErr);
        }

        return res.status(200).json({ message: "Nueva contraseña generada y enviada al email asociado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};
