import { Servicio } from "../../models/Servicio.js";
import { Recurso } from "../../models/Recurso.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    SERVICIO_ERRORS,
    SERVICIO_MESSAGES,
    SERVICIO_ROLES,
} from "./constants.js";

const canManageServicios = (rol) => [SERVICIO_ROLES.ADMIN, SERVICIO_ROLES.JEFE].includes(rol);
const PRICE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;
const INTEGER_REGEX = /^\d+$/;

const serializeServicio = (servicio) => ({
    id_servicio: servicio.id_servicio,
    id_negocio: servicio.id_negocio,
    id_recurso_favorito: servicio.id_recurso_favorito ?? null,
    nombre: servicio.nombre,
    precio: servicio.precio,
    duracion: servicio.duracion,
    descripcion: servicio.descripcion,
    requiere_capacidad: Boolean(servicio.requiere_capacidad),
});

const normalizePrecio = (precio) => {
    const precioValue = `${precio ?? ""}`.trim();

    if (!precioValue) {
        return { error: SERVICIO_ERRORS.PRECIO_REQUIRED };
    }

    if (!PRICE_REGEX.test(precioValue)) {
        return { error: SERVICIO_ERRORS.PRECIO_INVALID };
    }

    const parsedPrecio = Number.parseFloat(precioValue.replace(",", "."));

    if (!Number.isFinite(parsedPrecio) || parsedPrecio <= 0) {
        return { error: SERVICIO_ERRORS.PRECIO_INVALID };
    }

    return { value: parsedPrecio };
};

const normalizeDuracion = (duracion) => {
    const duracionValue = `${duracion ?? ""}`.trim();

    if (!duracionValue) {
        return { error: SERVICIO_ERRORS.DURACION_REQUIRED };
    }

    if (!INTEGER_REGEX.test(duracionValue)) {
        return { error: SERVICIO_ERRORS.DURACION_INVALID };
    }

    const parsedDuracion = Number.parseInt(duracionValue, 10);

    if (!Number.isInteger(parsedDuracion) || parsedDuracion <= 0) {
        return { error: SERVICIO_ERRORS.DURACION_INVALID };
    }

    return { value: parsedDuracion };
};

const normalizeRequiereCapacidad = (requiereCapacidad) => {
    if (requiereCapacidad === undefined || requiereCapacidad === null || requiereCapacidad === "") {
        return { value: false };
    }

    if (typeof requiereCapacidad === "boolean") {
        return { value: requiereCapacidad };
    }

    if (typeof requiereCapacidad === "number") {
        if (requiereCapacidad === 1) {
            return { value: true };
        }

        if (requiereCapacidad === 0) {
            return { value: false };
        }

        return { error: SERVICIO_ERRORS.REQUIERE_CAPACIDAD_INVALID };
    }

    if (typeof requiereCapacidad === "string") {
        const normalized = requiereCapacidad.trim().toLowerCase();

        if (normalized === "true" || normalized === "1") {
            return { value: true };
        }

        if (normalized === "false" || normalized === "0") {
            return { value: false };
        }

        return { error: SERVICIO_ERRORS.REQUIERE_CAPACIDAD_INVALID };
    }

    return { error: SERVICIO_ERRORS.REQUIERE_CAPACIDAD_INVALID };
};

const normalizeIdRecursoFavorito = (idRecursoFavorito) => {
    if (idRecursoFavorito === undefined || idRecursoFavorito === null || idRecursoFavorito === "") {
        return { value: null };
    }

    const idRecursoFavoritoValue = `${idRecursoFavorito}`.trim();

    if (!INTEGER_REGEX.test(idRecursoFavoritoValue)) {
        return { error: SERVICIO_ERRORS.RECURSO_FAVORITO_INVALID };
    }

    const parsedIdRecursoFavorito = Number.parseInt(idRecursoFavoritoValue, 10);

    if (!Number.isInteger(parsedIdRecursoFavorito) || parsedIdRecursoFavorito <= 0) {
        return { error: SERVICIO_ERRORS.RECURSO_FAVORITO_INVALID };
    }

    return { value: parsedIdRecursoFavorito };
};

const validateServicioFields = ({ nombre, precio, duracion, descripcion, requiere_capacidad, id_recurso_favorito }) => {
    if (!nombre || !nombre.trim()) {
        return { error: SERVICIO_ERRORS.NOMBRE_REQUIRED };
    }

    if (!descripcion || !descripcion.trim()) {
        return { error: SERVICIO_ERRORS.DESCRIPCION_REQUIRED };
    }

    const precioResult = normalizePrecio(precio);

    if (precioResult.error) {
        return { error: precioResult.error };
    }

    const duracionResult = normalizeDuracion(duracion);

    if (duracionResult.error) {
        return { error: duracionResult.error };
    }

    const requiereCapacidadResult = normalizeRequiereCapacidad(requiere_capacidad);

    if (requiereCapacidadResult.error) {
        return { error: requiereCapacidadResult.error };
    }

    const recursoFavoritoResult = normalizeIdRecursoFavorito(id_recurso_favorito);

    if (recursoFavoritoResult.error) {
        return { error: recursoFavoritoResult.error };
    }

    return {
        value: {
            nombre: nombre.trim(),
            precio: precioResult.value,
            duracion: duracionResult.value,
            descripcion: descripcion.trim(),
            requiere_capacidad: requiereCapacidadResult.value,
            id_recurso_favorito: recursoFavoritoResult.value,
        },
    };
};

export const createServicio = async (req, res) => {
    const {
        id_negocio,
        nombre,
        precio,
        duracion,
        descripcion,
        requiere_capacidad,
        id_recurso_favorito,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: SERVICIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: SERVICIO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    const servicioFieldsResult = validateServicioFields({
        nombre,
        precio,
        duracion,
        descripcion,
        requiere_capacidad,
        id_recurso_favorito,
    });

    if (servicioFieldsResult.error) {
        return res.status(400).json({ message: servicioFieldsResult.error });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageServicios(usuarioNegocio.rol)) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_MANAGE_PERMISSION });
        }

        if (servicioFieldsResult.value.id_recurso_favorito !== null) {
            const recursoFavorito = await Recurso.findOne({
                where: {
                    id_recurso: servicioFieldsResult.value.id_recurso_favorito,
                    id_negocio,
                },
            });

            if (!recursoFavorito) {
                return res.status(400).json({ message: SERVICIO_ERRORS.RECURSO_FAVORITO_NOT_FOUND });
            }
        }

        const servicio = await Servicio.create({
            id_negocio,
            ...servicioFieldsResult.value,
        });

        return res.status(201).json({
            message: SERVICIO_MESSAGES.SERVICIO_CREATED,
            servicio: serializeServicio(servicio),
        });
    } catch (error) {
        return res.status(500).json({ message: SERVICIO_ERRORS.SERVER_ERROR });
    }
};

export const getServiciosByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: SERVICIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: SERVICIO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const servicios = await Servicio.findAll({
            where: { id_negocio },
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({ servicios: servicios.map(serializeServicio) });
    } catch (error) {
        return res.status(500).json({ message: SERVICIO_ERRORS.SERVER_ERROR });
    }
};

export const updateServicio = async (req, res) => {
    const { id_servicio } = req.params;
    const {
        nombre,
        precio,
        duracion,
        descripcion,
        requiere_capacidad,
        id_recurso_favorito,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: SERVICIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_servicio) {
        return res.status(400).json({ message: SERVICIO_ERRORS.SERVICIO_ID_REQUIRED });
    }

    try {
        const servicio = await Servicio.findByPk(id_servicio);

        if (!servicio) {
            return res.status(404).json({ message: SERVICIO_ERRORS.SERVICIO_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: servicio.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageServicios(usuarioNegocio.rol)) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_MANAGE_PERMISSION });
        }

        const servicioFieldsResult = validateServicioFields({
            nombre,
            precio,
            duracion,
            descripcion,
            requiere_capacidad: requiere_capacidad ?? servicio.requiere_capacidad,
            id_recurso_favorito: id_recurso_favorito ?? servicio.id_recurso_favorito,
        });

        if (servicioFieldsResult.error) {
            return res.status(400).json({ message: servicioFieldsResult.error });
        }

        if (servicioFieldsResult.value.id_recurso_favorito !== null) {
            const recursoFavorito = await Recurso.findOne({
                where: {
                    id_recurso: servicioFieldsResult.value.id_recurso_favorito,
                    id_negocio: servicio.id_negocio,
                },
            });

            if (!recursoFavorito) {
                return res.status(400).json({ message: SERVICIO_ERRORS.RECURSO_FAVORITO_NOT_FOUND });
            }
        }

        await servicio.update(servicioFieldsResult.value);

        return res.status(200).json({
            message: SERVICIO_MESSAGES.SERVICIO_UPDATED,
            servicio: serializeServicio(servicio),
        });
    } catch (error) {
        return res.status(500).json({ message: SERVICIO_ERRORS.SERVER_ERROR });
    }
};

export const deleteServicio = async (req, res) => {
    const { id_servicio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: SERVICIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_servicio) {
        return res.status(400).json({ message: SERVICIO_ERRORS.SERVICIO_ID_REQUIRED });
    }

    try {
        const servicio = await Servicio.findByPk(id_servicio);

        if (!servicio) {
            return res.status(404).json({ message: SERVICIO_ERRORS.SERVICIO_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: servicio.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageServicios(usuarioNegocio.rol)) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_MANAGE_PERMISSION });
        }

        await servicio.destroy();

        return res.status(200).json({ message: SERVICIO_MESSAGES.SERVICIO_DELETED });
    } catch (error) {
        return res.status(500).json({ message: SERVICIO_ERRORS.SERVER_ERROR });
    }
};

export const getServicioById = async (req, res) => {
    const { id_servicio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: SERVICIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_servicio) {
        return res.status(400).json({ message: SERVICIO_ERRORS.SERVICIO_ID_REQUIRED });
    }

    try {
        const servicio = await Servicio.findByPk(id_servicio);

        if (!servicio) {
            return res.status(404).json({ message: SERVICIO_ERRORS.SERVICIO_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: servicio.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        return res.status(200).json({ servicio: serializeServicio(servicio) });
    } catch (error) {
        return res.status(500).json({ message: SERVICIO_ERRORS.SERVER_ERROR });
    }
};

export const searchServicios = async (req, res) => {
    const { id_negocio, q } = req.query;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: SERVICIO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: SERVICIO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: SERVICIO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const { Op } = await import("sequelize");
        const whereClause = { id_negocio };

        if (q) {
            whereClause[Op.or] = [
                { nombre: { [Op.iLike]: `%${q}%` } },
                { descripcion: { [Op.iLike]: `%${q}%` } },
            ];
        }

        const servicios = await Servicio.findAll({
            where: whereClause,
            order: [["nombre", "ASC"]],
        });

        return res.status(200).json({ servicios: servicios.map(serializeServicio) });
    } catch (error) {
        return res.status(500).json({ message: SERVICIO_ERRORS.SERVER_ERROR });
    }
};