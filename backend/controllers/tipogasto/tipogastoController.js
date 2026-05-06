import { Gasto } from "../../models/Gasto.js";
import { TipoGasto } from "../../models/TipoGasto.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    TIPOGASTO_ERRORS,
    TIPOGASTO_MESSAGES,
    TIPOGASTO_ROLES,
} from "./constants.js";

const INTEGER_REGEX = /^\d+$/;

const canManageTiposGasto = (rol) => [TIPOGASTO_ROLES.ADMIN, TIPOGASTO_ROLES.JEFE].includes(rol);

const normalizeIntegerId = (value, errorMessage) => {
    const normalized = `${value ?? ""}`.trim();

    if (!normalized || !INTEGER_REGEX.test(normalized)) {
        return { error: errorMessage };
    }

    return { value: Number.parseInt(normalized, 10) };
};

const serializeTipoGasto = (tipoGasto) => ({
    id_tipo_gasto: tipoGasto.id_tipo_gasto,
    id_negocio: tipoGasto.id_negocio,
    nombre_tipo: tipoGasto.nombre_tipo,
    createdAt: tipoGasto.createdAt,
    updatedAt: tipoGasto.updatedAt,
});

const ensureNegocioAccess = async (id_usuario, id_negocio) => {
    const usuarioNegocio = await UsuarioNegocio.findOne({
        where: { id_usuario, id_negocio },
    });

    if (!usuarioNegocio) {
        return { status: 403, message: TIPOGASTO_ERRORS.NO_ACCESS_TO_NEGOCIO };
    }

    if (!canManageTiposGasto(`${usuarioNegocio.rol ?? ""}`.toLowerCase())) {
        return { status: 403, message: TIPOGASTO_ERRORS.NO_MANAGE_PERMISSION };
    }

    return { usuarioNegocio };
};

export const createTipoGasto = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocioResult = normalizeIntegerId(req.body?.id_negocio, TIPOGASTO_ERRORS.NEGOCIO_ID_REQUIRED);
    const nombreTipo = typeof req.body?.nombre_tipo === "string" ? req.body.nombre_tipo.trim() : "";

    if (!id_usuario) {
        return res.status(401).json({ message: TIPOGASTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idNegocioResult.error) {
        return res.status(400).json({ message: idNegocioResult.error });
    }

    if (!nombreTipo) {
        return res.status(400).json({ message: TIPOGASTO_ERRORS.NOMBRE_REQUIRED });
    }

    try {
        const accessResult = await ensureNegocioAccess(id_usuario, idNegocioResult.value);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        const tipoGasto = await TipoGasto.create({
            id_negocio: idNegocioResult.value,
            nombre_tipo: nombreTipo,
        });

        return res.status(201).json({
            message: TIPOGASTO_MESSAGES.TIPO_GASTO_CREATED,
            tipo_gasto: serializeTipoGasto(tipoGasto),
        });
    } catch (error) {
        return res.status(500).json({ message: TIPOGASTO_ERRORS.SERVER_ERROR });
    }
};

export const getTiposGastoByNegocio = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocioResult = normalizeIntegerId(req.params?.id_negocio, TIPOGASTO_ERRORS.NEGOCIO_ID_REQUIRED);

    if (!id_usuario) {
        return res.status(401).json({ message: TIPOGASTO_ERRORS.USER_NOT_AUTHENTICATED });
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
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            message: TIPOGASTO_MESSAGES.TIPOS_GASTO_RETRIEVED,
            tipos_gasto: tiposGasto.map(serializeTipoGasto),
        });
    } catch (error) {
        return res.status(500).json({ message: TIPOGASTO_ERRORS.SERVER_ERROR });
    }
};

export const deleteTipoGasto = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idTipoGastoResult = normalizeIntegerId(req.params?.id_tipo_gasto, TIPOGASTO_ERRORS.TIPO_GASTO_ID_REQUIRED);

    if (!id_usuario) {
        return res.status(401).json({ message: TIPOGASTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idTipoGastoResult.error) {
        return res.status(400).json({ message: idTipoGastoResult.error });
    }

    try {
        const tipoGasto = await TipoGasto.findByPk(idTipoGastoResult.value);

        if (!tipoGasto) {
            return res.status(404).json({ message: TIPOGASTO_ERRORS.TIPO_GASTO_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(id_usuario, tipoGasto.id_negocio);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        await Gasto.destroy({
            where: { id_tipo_gasto: tipoGasto.id_tipo_gasto },
        });
        await tipoGasto.destroy();

        return res.status(200).json({ message: TIPOGASTO_MESSAGES.TIPO_GASTO_DELETED });
    } catch (error) {
        return res.status(500).json({ message: TIPOGASTO_ERRORS.SERVER_ERROR });
    }
};