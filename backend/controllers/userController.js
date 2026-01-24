import { Usuario } from "../models/Usuario.js";
import bcrypt from "bcrypt";

export const getUserInfo = async (req, res) => {
    const { id_usuario } = req.params;
    if (!id_usuario) {
        return res.status(400).json({ message: "Falta el id del usuario" });
    }

    try {
        const existingUser = await Usuario.findOne({ where: { id_usuario } });
        if (!existingUser) {
            return res.status(404).json({ message: "El usuario no existe" });
        }

        return res.status(200).json({
            id_usuario: existingUser.id_usuario,
            nombre_usuario: existingUser.nombre_usuario,
            nombre: existingUser.nombre,
            dni: existingUser.dni,
            email: existingUser.email,
            numero_telefono: existingUser.numero_telefono,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const updateUser = async (req, res) => {
    const { id_usuario } = req.params;
    const { nombre_usuario, nombre, dni, email, numero_telefono, contrasena, nuevacontrasena } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ message: "Falta el id del usuario" });
    }

    try {
        const existingUser = await Usuario.findOne({ where: { id_usuario } });

        if (!existingUser) {
            return res.status(404).json({ message: "El usuario no existe" });
        }

        if (email && email !== existingUser.email) {
            const emailTaken = await Usuario.findOne({ where: { email } });
            if (emailTaken) {
                return res.status(400).json({ message: "El email ya está en uso por otro usuario" });
            }
        }

        if (contrasena && nuevacontrasena) {
            const isMatch = await bcrypt.compare(contrasena, existingUser.contrasena);
            if (!isMatch) {
                return res.status(400).json({ message: "La contraseña actual no coincide" });
            }
            existingUser.contrasena = await bcrypt.hash(nuevacontrasena, 10);
        }

        const updatedUser = await existingUser.update({
            nombre_usuario: nombre_usuario ?? existingUser.nombre_usuario,
            nombre: nombre ?? existingUser.nombre,
            dni: dni ?? existingUser.dni,
            email: email ?? existingUser.email,
            numero_telefono: numero_telefono ?? existingUser.numero_telefono,
            contrasena: existingUser.contrasena,
        });

        return res.status(200).json({
            message: "Usuario actualizado correctamente",
            user: {
                id_usuario: updatedUser.id_usuario,
                nombre_usuario: updatedUser.nombre_usuario,
                nombre: updatedUser.nombre,
                dni: updatedUser.dni,
                email: updatedUser.email,
                numero_telefono: updatedUser.numero_telefono,
            },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};