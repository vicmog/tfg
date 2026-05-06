import { Op } from "sequelize";
import { Gasto } from "../../models/Gasto.js";
import { TipoGasto } from "../../models/TipoGasto.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    GASTO_ERRORS,
    GASTO_MESSAGES,
    GASTO_ROLES,
} from "./constants.js";

const INTEGER_REGEX = /^\d+$/;

const canManageGastos = (rol) => [GASTO_ROLES.ADMIN, GASTO_ROLES.JEFE].includes(rol);

const normalizeIntegerId = (value, errorMessage) => {
    const normalized = `${value ?? ""}`.trim();

    if (!normalized || !INTEGER_REGEX.test(normalized)) {
        return { error: errorMessage };
    }

    return { value: Number.parseInt(normalized, 10) };
};

const normalizeImporte = (value) => {
    const normalized = `${value ?? ""}`.trim().replace(",", ".");

    if (!normalized) {
        return { error: GASTO_ERRORS.IMPORTE_REQUIRED };
    }

    const parsed = Number.parseFloat(normalized);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return { error: GASTO_ERRORS.IMPORTE_INVALID };
    }

    return { value: parsed };
};

const normalizeFecha = (value) => {
    const normalized = `${value ?? ""}`.trim();

    if (!normalized) {
        return { error: GASTO_ERRORS.FECHA_REQUIRED };
    }

    const parsedDate = new Date(normalized);

    if (Number.isNaN(parsedDate.getTime())) {
        return { error: GASTO_ERRORS.FECHA_INVALID };
    }

    return { value: parsedDate };
};

const ensureNegocioAccess = async (id_usuario, id_negocio) => {
    const usuarioNegocio = await UsuarioNegocio.findOne({
        where: { id_usuario, id_negocio },
    });

    if (!usuarioNegocio) {
        return { status: 403, message: GASTO_ERRORS.NO_ACCESS_TO_NEGOCIO };
    }

    if (!canManageGastos(`${usuarioNegocio.rol ?? ""}`.toLowerCase())) {
        return { status: 403, message: GASTO_ERRORS.NO_MANAGE_PERMISSION };
    }

    return { usuarioNegocio };
};

const serializeGasto = (gasto, tipoGasto) => ({
    id_gasto: gasto.id_gasto,
    id_tipo_gasto: gasto.id_tipo_gasto,
    tipo_gasto_nombre: tipoGasto?.nombre_tipo ?? null,
    nombre: gasto.nombre,
    fecha: gasto.fecha,
    importe: gasto.importe,
    createdAt: gasto.createdAt,
    updatedAt: gasto.updatedAt,
});

export const createGasto = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocioResult = normalizeIntegerId(req.body?.id_negocio, GASTO_ERRORS.NEGOCIO_ID_REQUIRED);
    const idTipoGastoResult = normalizeIntegerId(req.body?.id_tipo_gasto, GASTO_ERRORS.TIPO_GASTO_ID_REQUIRED);
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const fechaResult = normalizeFecha(req.body?.fecha);
    const importeResult = normalizeImporte(req.body?.importe);

    if (!id_usuario) {
        return res.status(401).json({ message: GASTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idNegocioResult.error) {
        return res.status(400).json({ message: idNegocioResult.error });
    }

    if (idTipoGastoResult.error) {
        return res.status(400).json({ message: idTipoGastoResult.error });
    }

    if (!nombre) {
        return res.status(400).json({ message: GASTO_ERRORS.NOMBRE_REQUIRED });
    }

    if (fechaResult.error) {
        return res.status(400).json({ message: fechaResult.error });
    }

    if (importeResult.error) {
        return res.status(400).json({ message: importeResult.error });
    }

    try {
        const tipoGasto = await TipoGasto.findByPk(idTipoGastoResult.value);

        if (!tipoGasto) {
            return res.status(404).json({ message: GASTO_ERRORS.TIPO_GASTO_NOT_FOUND });
        }

        if (tipoGasto.id_negocio !== idNegocioResult.value) {
            return res.status(400).json({ message: GASTO_ERRORS.TIPO_GASTO_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(id_usuario, idNegocioResult.value);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        const gasto = await Gasto.create({
            id_tipo_gasto: idTipoGastoResult.value,
            nombre,
            fecha: fechaResult.value,
            importe: importeResult.value,
        });

        return res.status(201).json({
            message: GASTO_MESSAGES.GASTO_CREATED,
            gasto: serializeGasto(gasto, tipoGasto),
        });
    } catch (error) {
        return res.status(500).json({ message: GASTO_ERRORS.SERVER_ERROR });
    }
};

export const getGastosByNegocio = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocioResult = normalizeIntegerId(req.params?.id_negocio, GASTO_ERRORS.NEGOCIO_ID_REQUIRED);

    if (!id_usuario) {
        return res.status(401).json({ message: GASTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idNegocioResult.error) {
        return res.status(400).json({ message: idNegocioResult.error });
    }

    try {
        const accessResult = await ensureNegocioAccess(id_usuario, idNegocioResult.value);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        const tiposGasto = await TipoGasto.findAll({
            where: { id_negocio: idNegocioResult.value },
            attributes: ["id_tipo_gasto", "nombre_tipo"],
        });

        const tipoIds = tiposGasto.map((tipo) => tipo.id_tipo_gasto);

        if (tipoIds.length === 0) {
            return res.status(200).json({
                message: GASTO_MESSAGES.GASTOS_RETRIEVED,
                gastos: [],
            });
        }

        const gastos = await Gasto.findAll({
            where: {
                id_tipo_gasto: {
                    [Op.in]: tipoIds,
                },
            },
            order: [["fecha", "DESC"], ["createdAt", "DESC"]],
        });

        const tipoMap = new Map(tiposGasto.map((tipo) => [tipo.id_tipo_gasto, tipo]));

        return res.status(200).json({
            message: GASTO_MESSAGES.GASTOS_RETRIEVED,
            gastos: gastos.map((gasto) => serializeGasto(gasto, tipoMap.get(gasto.id_tipo_gasto))),
        });
    } catch (error) {
        return res.status(500).json({ message: GASTO_ERRORS.SERVER_ERROR });
    }
};

export const deleteGasto = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idGastoResult = normalizeIntegerId(req.params?.id_gasto, GASTO_ERRORS.GASTO_ID_REQUIRED);

    if (!id_usuario) {
        return res.status(401).json({ message: GASTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idGastoResult.error) {
        return res.status(400).json({ message: idGastoResult.error });
    }

    try {
        const gasto = await Gasto.findByPk(idGastoResult.value);

        if (!gasto) {
            return res.status(404).json({ message: GASTO_ERRORS.GASTO_NOT_FOUND });
        }

        const tipoGasto = await TipoGasto.findByPk(gasto.id_tipo_gasto);

        if (!tipoGasto) {
            return res.status(404).json({ message: GASTO_ERRORS.TIPO_GASTO_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(id_usuario, tipoGasto.id_negocio);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        await gasto.destroy();

        return res.status(200).json({ message: GASTO_MESSAGES.GASTO_DELETED });
    } catch (error) {
        return res.status(500).json({ message: GASTO_ERRORS.SERVER_ERROR });
    }
};

export const updateGasto = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idGastoResult = normalizeIntegerId(req.params?.id_gasto, GASTO_ERRORS.GASTO_ID_REQUIRED);
    const idTipoGastoResult = normalizeIntegerId(req.body?.id_tipo_gasto, GASTO_ERRORS.TIPO_GASTO_ID_REQUIRED);
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const fechaResult = normalizeFecha(req.body?.fecha);
    const importeResult = normalizeImporte(req.body?.importe);

    if (!id_usuario) {
        return res.status(401).json({ message: GASTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idGastoResult.error) {
        return res.status(400).json({ message: idGastoResult.error });
    }

    if (idTipoGastoResult.error) {
        return res.status(400).json({ message: idTipoGastoResult.error });
    }

    if (!nombre) {
        return res.status(400).json({ message: GASTO_ERRORS.NOMBRE_REQUIRED });
    }

    if (fechaResult.error) {
        return res.status(400).json({ message: fechaResult.error });
    }

    if (importeResult.error) {
        return res.status(400).json({ message: importeResult.error });
    }

    try {
        const gasto = await Gasto.findByPk(idGastoResult.value);

        if (!gasto) {
            return res.status(404).json({ message: GASTO_ERRORS.GASTO_NOT_FOUND });
        }

        const currentTipoGasto = await TipoGasto.findByPk(gasto.id_tipo_gasto);

        if (!currentTipoGasto) {
            return res.status(404).json({ message: GASTO_ERRORS.TIPO_GASTO_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(id_usuario, currentTipoGasto.id_negocio);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        const newTipoGasto = await TipoGasto.findByPk(idTipoGastoResult.value);

        if (!newTipoGasto || newTipoGasto.id_negocio !== currentTipoGasto.id_negocio) {
            return res.status(404).json({ message: GASTO_ERRORS.TIPO_GASTO_NOT_FOUND });
        }

        gasto.id_tipo_gasto = idTipoGastoResult.value;
        gasto.nombre = nombre;
        gasto.fecha = fechaResult.value;
        gasto.importe = importeResult.value;
        await gasto.save();

        return res.status(200).json({
            message: GASTO_MESSAGES.GASTO_UPDATED,
            gasto: serializeGasto(gasto, newTipoGasto),
        });
    } catch (error) {
        return res.status(500).json({ message: GASTO_ERRORS.SERVER_ERROR });
    }
};