import { Negocio } from "../../models/Negocio.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { Usuario } from "../../models/Usuario.js";
import { Op, fn, col, where } from "sequelize";
import {
    DEFAULT_ADMIN_USER_ID,
    DEFAULT_PLANTILLA,
    NEGOCIO_ERRORS,
    NEGOCIO_MESSAGES,
    NEGOCIO_ROLES,
} from "./constants.js";

export const createNegocio = async (req, res) => {
    const { nombre, CIF } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: NEGOCIO_ERRORS.NOMBRE_REQUIRED });
    }

    if (!CIF || !CIF.trim()) {
        return res.status(400).json({ message: NEGOCIO_ERRORS.CIF_REQUIRED });
    }

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    try {
        const existingNegocio = await Negocio.findOne({ where: { CIF: CIF.trim() } });
        if (existingNegocio) {
            return res.status(400).json({ message: NEGOCIO_ERRORS.CIF_ALREADY_EXISTS });
        }

        const negocio = await Negocio.create({
            nombre: nombre.trim(),
            CIF: CIF.trim(),
            plantilla: DEFAULT_PLANTILLA
        });

        await UsuarioNegocio.create({
            id_usuario: id_usuario,
            id_negocio: negocio.id_negocio,
            rol: NEGOCIO_ROLES.JEFE
        });

        if (id_usuario !== DEFAULT_ADMIN_USER_ID) {
            await UsuarioNegocio.create({
                id_usuario: DEFAULT_ADMIN_USER_ID,
                id_negocio: negocio.id_negocio,
                rol: NEGOCIO_ROLES.ADMIN
            });
        }

        return res.status(201).json({
            message: NEGOCIO_MESSAGES.NEGOCIO_CREATED,
            negocio: {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla
            }
        });

    } catch (error) {
        console.error("Error al crear negocio:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};

export const getNegocios = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const search = typeof req.query?.search === "string" ? req.query.search.trim() : "";
    const searchLower = search.toLowerCase();

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    try {
        const usuarioNegocios = await UsuarioNegocio.findAll({
            where: { id_usuario }
        });

        if (!usuarioNegocios || usuarioNegocios.length === 0) {
            return res.status(200).json({ negocios: [] });
        }

        const negocioIds = usuarioNegocios.map(un => un.id_negocio);
        const whereClause = {
            id_negocio: negocioIds,
            ...(search
                ? {
                    [Op.or]: [
                        where(fn("lower", col("nombre")), { [Op.like]: `%${searchLower}%` }),
                        where(fn("lower", col("CIF")), { [Op.like]: `%${searchLower}%` })
                    ]
                }
                : {})
        };

        const negocios = await Negocio.findAll({
            where: whereClause
        });

        const negociosConRol = negocios.map(negocio => {
            const usuarioNegocio = usuarioNegocios.find(un => un.id_negocio === negocio.id_negocio);
            return {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla,
                rol: usuarioNegocio?.rol || NEGOCIO_ROLES.TRABAJADOR
            };
        });

        return res.status(200).json({ negocios: negociosConRol });

    } catch (error) {
        console.error("Error al obtener negocios:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};

export const updateNegocio = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: NEGOCIO_ERRORS.NOMBRE_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!usuarioNegocio || (usuarioNegocio.rol !== NEGOCIO_ROLES.JEFE && usuarioNegocio.rol !== NEGOCIO_ROLES.ADMIN)) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_EDIT_PERMISSION });
        }

        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            return res.status(404).json({ message: NEGOCIO_ERRORS.NEGOCIO_NOT_FOUND });
        }

        await negocio.update({ nombre: nombre.trim() });

        return res.status(200).json({
            message: NEGOCIO_MESSAGES.NEGOCIO_UPDATED,
            negocio: {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla
            }
        });

    } catch (error) {
        console.error("Error al actualizar negocio:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};

export const deleteNegocio = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!usuarioNegocio || (usuarioNegocio.rol !== NEGOCIO_ROLES.JEFE && usuarioNegocio.rol !== NEGOCIO_ROLES.ADMIN)) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_DELETE_PERMISSION });
        }

        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            return res.status(404).json({ message: NEGOCIO_ERRORS.NEGOCIO_NOT_FOUND });
        }

        await UsuarioNegocio.destroy({
            where: { id_negocio: id }
        });

        await negocio.destroy();

        return res.status(200).json({ message: NEGOCIO_MESSAGES.NEGOCIO_DELETED });

    } catch (error) {
        console.error("Error al eliminar negocio:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};

export const getNegocioById = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_ACCESS });
        }

        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            return res.status(404).json({ message: NEGOCIO_ERRORS.NEGOCIO_NOT_FOUND });
        }

        return res.status(200).json({
            negocio: {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla,
                rol: usuarioNegocio.rol
            }
        });

    } catch (error) {
        console.error("Error al obtener negocio:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};

export const getUsersByNegocioId = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    try {
        const currentUser = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!currentUser) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_ACCESS });
        }

        if (currentUser.rol !== NEGOCIO_ROLES.JEFE && currentUser.rol !== NEGOCIO_ROLES.ADMIN) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_VIEW_USERS_PERMISSION });
        }

        const userNegocioData = await UsuarioNegocio.findAll({
            where: { id_negocio: id }
        });

        const userIds = userNegocioData.map(un => un.id_usuario);
        if (userIds.length === 0) {
            return res.status(200).json({ usuarios: [] });
        }

        const usuarios = await Usuario.findAll({
            where: { id_usuario: userIds }
        });

        const usersWithAccess = usuarios.map((usuario) => {
            const userNegocio = userNegocioData.find(un => un.id_usuario === usuario.id_usuario);
            return {
                id_usuario: usuario.id_usuario,
                nombre_usuario: usuario.nombre_usuario,
                nombre: usuario.nombre,
                rol: userNegocio?.rol || NEGOCIO_ROLES.TRABAJADOR
            };
        });

        return res.status(200).json({ usuarios: usersWithAccess });

    } catch (error) {
        console.error("Error al verificar permisos:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};

export const addUserToNegocio = async (req, res) => {
    const { id } = req.params;
    const { id_usuario: targetUserId, rol } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!targetUserId) {
        return res.status(400).json({ message: NEGOCIO_ERRORS.USER_ID_REQUIRED });
    }

    if (rol !== NEGOCIO_ROLES.TRABAJADOR && rol !== NEGOCIO_ROLES.JEFE) {
        return res.status(400).json({ message: NEGOCIO_ERRORS.INVALID_ROLE });
    }

    try {
        const currentUser = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!currentUser) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_ACCESS });
        }

        if (currentUser.rol !== NEGOCIO_ROLES.JEFE && currentUser.rol !== NEGOCIO_ROLES.ADMIN) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_ASSIGN_PERMISSION });
        }

        const targetUser = await Usuario.findOne({
            where: { id_usuario: targetUserId }
        });

        if (!targetUser) {
            return res.status(404).json({ message: NEGOCIO_ERRORS.TARGET_USER_NOT_FOUND });
        }

        const existingAccess = await UsuarioNegocio.findOne({
            where: { id_usuario: targetUserId, id_negocio: id }
        });

        if (existingAccess) {
            return res.status(400).json({ message: NEGOCIO_ERRORS.USER_ALREADY_HAS_ACCESS });
        }

        await UsuarioNegocio.create({
            id_usuario: targetUserId,
            id_negocio: id,
            rol
        });

        return res.status(201).json({
            message: NEGOCIO_MESSAGES.USER_ADDED,
            usuario: {
                id_usuario: targetUser.id_usuario,
                nombre_usuario: targetUser.nombre_usuario,
                nombre: targetUser.nombre,
                rol
            }
        });
    } catch (error) {
        console.error("Error al asignar usuario:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};

export const updateUserRoleInNegocio = async (req, res) => {
    const { id } = req.params;
    const { id_usuario: targetUserId, rol } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: NEGOCIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!targetUserId) {
        return res.status(400).json({ message: NEGOCIO_ERRORS.USER_ID_REQUIRED });
    }

    if (rol !== NEGOCIO_ROLES.TRABAJADOR && rol !== NEGOCIO_ROLES.JEFE) {
        return res.status(400).json({ message: NEGOCIO_ERRORS.INVALID_ROLE });
    }

    try {
        const currentUser = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!currentUser) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_ACCESS });
        }

        if (currentUser.rol !== NEGOCIO_ROLES.JEFE && currentUser.rol !== NEGOCIO_ROLES.ADMIN) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.NO_EDIT_USER_ROLE_PERMISSION });
        }

        const targetAccess = await UsuarioNegocio.findOne({
            where: { id_usuario: targetUserId, id_negocio: id }
        });

        if (!targetAccess) {
            return res.status(404).json({ message: NEGOCIO_ERRORS.USER_ACCESS_NOT_FOUND });
        }

        if (targetAccess.rol === NEGOCIO_ROLES.ADMIN) {
            return res.status(403).json({ message: NEGOCIO_ERRORS.CANNOT_EDIT_ADMIN_ROLE });
        }

        await targetAccess.update({ rol });

        return res.status(200).json({
            message: NEGOCIO_MESSAGES.USER_ROLE_UPDATED,
            usuario: {
                id_usuario: targetUserId,
                nombre_usuario: targetAccess.nombre_usuario,
                nombre: targetAccess.nombre,
                rol,
            }
        });
    } catch (error) {
        console.error("Error al editar rol de usuario:", error);
        return res.status(500).json({ message: NEGOCIO_ERRORS.SERVER_ERROR });
    }
};
