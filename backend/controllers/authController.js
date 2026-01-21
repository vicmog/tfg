import { Usuario } from "../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

        const user = await Usuario.create({
            nombre_usuario,
            nombre,
            dni,
            numero_telefono,
            email,
            contrasena: hashedPassword,
            consentimiento: consentimiento || false,
        });

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

        return res.status(200).json({ message: "Login exitoso", token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const getUserInfo = async (req, res) => {
    const { id_usuario } = req.body;
    if (!id_usuario) {
        return res.status(400).json({ message: "Falta el id del usuario" });
    }

    try {
        const existingUser = await Usuario.findOne({ where: { id_usuario } });
        if (!existingUser) {
            return res.status(404).json({ message: "El usuario no existe" });
        }

        return res.status(200).json({
            message: "Usuario encontrado",
            userId: existingUser.id_usuario,
            username: existingUser.nombre_usuario,
            name: existingUser.nombre,
            dni: existingUser.dni,
            contrasena: existingUser.contrasena,
            email: existingUser.email,
            phone: existingUser.numero_telefono,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const updateUser = async (req, res) => {
    const { id_usuario, nombre_usuario, nombre, dni, email, numero_telefono } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ message: "Falta el id del usuario" });
    }

    try {
        const existingUser = await Usuario.findOne({ where: { id_usuario } });

        if (!existingUser) {
            return res.status(404).json({ message: "El usuario no existe" });
        }

        const updatedUser = await existingUser.update({
            nombre_usuario: nombre_usuario ?? existingUser.nombre_usuario,
            nombre: nombre ?? existingUser.nombre,
            dni: dni ?? existingUser.dni,
            email: email ?? existingUser.email,
            numero_telefono: numero_telefono ?? existingUser.numero_telefono,
        });

        return res.status(200).json({
            message: "Usuario actualizado correctamente",
            user: {
                userId: updatedUser.id_usuario,
                username: updatedUser.nombre_usuario,
                name: updatedUser.nombre,
                dni: updatedUser.dni,
                email: updatedUser.email,
                phone: updatedUser.numero_telefono,
            },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};