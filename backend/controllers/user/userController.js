import { Usuario } from "../../models/Usuario.js";
import { Op, fn, col, where } from "sequelize";
import bcrypt from "bcrypt";
import { PASSWORD_SALT_ROUNDS, USER_ERRORS, USER_MESSAGES } from "./constants.js";

export const getUserInfo = async (req, res) => {
    const { id_usuario } = req.params;
    if (!id_usuario) {
        return res.status(400).json({ message: USER_ERRORS.USER_ID_REQUIRED });
    }

    try {
        const existingUser = await Usuario.findOne({ where: { id_usuario } });
        if (!existingUser) {
            return res.status(404).json({ message: USER_ERRORS.USER_NOT_FOUND });
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
        return res.status(500).json({ message: USER_ERRORS.SERVER_ERROR });
    }
};

export const updateUser = async (req, res) => {
    const { id_usuario } = req.params;
    const { nombre_usuario, nombre, dni, email, numero_telefono, contrasena, nuevacontrasena } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ message: USER_ERRORS.USER_ID_REQUIRED });
    }

    try {
        const existingUser = await Usuario.findOne({ where: { id_usuario } });

        if (!existingUser) {
            return res.status(404).json({ message: USER_ERRORS.USER_NOT_FOUND });
        }

        if (email && email !== existingUser.email) {
            const emailTaken = await Usuario.findOne({ where: { email } });
            if (emailTaken) {
                return res.status(400).json({ message: USER_ERRORS.EMAIL_ALREADY_USED });
            }
        }

        if (contrasena && nuevacontrasena) {
            const isMatch = await bcrypt.compare(contrasena, existingUser.contrasena);
            if (!isMatch) {
                return res.status(400).json({ message: USER_ERRORS.CURRENT_PASSWORD_MISMATCH });
            }
            existingUser.contrasena = await bcrypt.hash(nuevacontrasena, PASSWORD_SALT_ROUNDS);
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
            message: USER_MESSAGES.USER_UPDATED,
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
        return res.status(500).json({ message: USER_ERRORS.SERVER_ERROR });
    }
};

export const searchUsers = async (req, res) => {
    const search = typeof req.query?.search === "string" ? req.query.search.trim() : "";
    const searchLower = search.toLowerCase();

    if (!search) {
        return res.status(200).json({ usuarios: [] });
    }

    try {
        const usuarios = await Usuario.findAll({
            where: {
                [Op.or]: [
                    where(fn("lower", col("nombre")), { [Op.like]: `%${searchLower}%` }),
                    where(fn("lower", col("nombre_usuario")), { [Op.like]: `%${searchLower}%` })
                ]
            }
        });

        const usuariosCompact = usuarios.map((usuario) => ({
            id_usuario: usuario.id_usuario,
            nombre_usuario: usuario.nombre_usuario,
            nombre: usuario.nombre,
        }));

        return res.status(200).json({ usuarios: usuariosCompact });
    } catch (error) {
        return res.status(500).json({ message: USER_ERRORS.SERVER_ERROR });
    }
};