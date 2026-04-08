import { Recurso } from "../../models/Recurso.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    RECURSO_ERRORS,
    RECURSO_MESSAGES,
    RECURSO_ROLES,
} from "./constants.js";

const canManageRecursos = (rol) => [RECURSO_ROLES.ADMIN, RECURSO_ROLES.JEFE].includes(rol);
const INTEGER_REGEX = /^\d+$/;

const serializeRecurso = (recurso) => ({
    id_recurso: recurso.id_recurso,
    id_negocio: recurso.id_negocio,
    nombre: recurso.nombre,
    capacidad: recurso.capacidad,
});

const normalizeCapacidad = (capacidad) => {
    const capacidadValue = `${capacidad ?? ""}`.trim();

    if (!capacidadValue) {
        return { error: RECURSO_ERRORS.CAPACIDAD_REQUIRED };
    }

    if (!INTEGER_REGEX.test(capacidadValue)) {
        return { error: RECURSO_ERRORS.CAPACIDAD_INVALID };
    }

    const parsedCapacidad = Number.parseInt(capacidadValue, 10);

    if (!Number.isInteger(parsedCapacidad) || parsedCapacidad <= 0) {
        return { error: RECURSO_ERRORS.CAPACIDAD_INVALID };
    }

    return { value: parsedCapacidad };
};

const validateRecursoFields = ({ nombre, capacidad }) => {
    if (!nombre || !nombre.trim()) {
        return { error: RECURSO_ERRORS.NOMBRE_REQUIRED };
    }

    const capacidadResult = normalizeCapacidad(capacidad);

    if (capacidadResult.error) {
        return { error: capacidadResult.error };
    }

    return {
        value: {
            nombre: nombre.trim(),
            capacidad: capacidadResult.value,
        },
    };
};

export const createRecurso = async (req, res) => {
    const {
        id_negocio,
        nombre,
        capacidad,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RECURSO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: RECURSO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    const recursoFieldsResult = validateRecursoFields({
        nombre,
        capacidad,
    });

    if (recursoFieldsResult.error) {
        return res.status(400).json({ message: recursoFieldsResult.error });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageRecursos(usuarioNegocio.rol)) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_MANAGE_PERMISSION });
        }

        const recurso = await Recurso.create({
            id_negocio,
            ...recursoFieldsResult.value,
        });

        return res.status(201).json({
            message: RECURSO_MESSAGES.RECURSO_CREATED,
            recurso: serializeRecurso(recurso),
        });
    } catch (error) {
        return res.status(500).json({ message: RECURSO_ERRORS.SERVER_ERROR });
    }
};

export const getRecursosByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RECURSO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: RECURSO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const recursos = await Recurso.findAll({
            where: { id_negocio },
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({ recursos: recursos.map(serializeRecurso) });
    } catch (error) {
        return res.status(500).json({ message: RECURSO_ERRORS.SERVER_ERROR });
    }
};

export const updateRecurso = async (req, res) => {
    const { id_recurso } = req.params;
    const {
        nombre,
        capacidad,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RECURSO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_recurso) {
        return res.status(400).json({ message: RECURSO_ERRORS.RECURSO_ID_REQUIRED });
    }

    try {
        const recurso = await Recurso.findByPk(id_recurso);

        if (!recurso) {
            return res.status(404).json({ message: RECURSO_ERRORS.RECURSO_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: recurso.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageRecursos(usuarioNegocio.rol)) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_MANAGE_PERMISSION });
        }

        const recursoFieldsResult = validateRecursoFields({
            nombre,
            capacidad,
        });

        if (recursoFieldsResult.error) {
            return res.status(400).json({ message: recursoFieldsResult.error });
        }

        await recurso.update(recursoFieldsResult.value);

        return res.status(200).json({
            message: RECURSO_MESSAGES.RECURSO_UPDATED,
            recurso: serializeRecurso(recurso),
        });
    } catch (error) {
        return res.status(500).json({ message: RECURSO_ERRORS.SERVER_ERROR });
    }
};

export const deleteRecurso = async (req, res) => {
    const { id_recurso } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RECURSO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_recurso) {
        return res.status(400).json({ message: RECURSO_ERRORS.RECURSO_ID_REQUIRED });
    }

    try {
        const recurso = await Recurso.findByPk(id_recurso);

        if (!recurso) {
            return res.status(404).json({ message: RECURSO_ERRORS.RECURSO_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: recurso.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageRecursos(usuarioNegocio.rol)) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_MANAGE_PERMISSION });
        }

        await recurso.destroy();

        return res.status(200).json({ message: RECURSO_MESSAGES.RECURSO_DELETED });
    } catch (error) {
        return res.status(500).json({ message: RECURSO_ERRORS.SERVER_ERROR });
    }
};

export const getRecursoById = async (req, res) => {
    const { id_recurso } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RECURSO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_recurso) {
        return res.status(400).json({ message: RECURSO_ERRORS.RECURSO_ID_REQUIRED });
    }

    try {
        const recurso = await Recurso.findByPk(id_recurso);

        if (!recurso) {
            return res.status(404).json({ message: RECURSO_ERRORS.RECURSO_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: recurso.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RECURSO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        return res.status(200).json({ recurso: serializeRecurso(recurso) });
    } catch (error) {
        return res.status(500).json({ message: RECURSO_ERRORS.SERVER_ERROR });
    }
};
