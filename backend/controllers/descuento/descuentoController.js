import { Descuento } from "../../models/Descuento.js";
import { Producto } from "../../models/Producto.js";
import { Proveedor } from "../../models/Proveedor.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    DESCUENTO_ERRORS,
    DESCUENTO_MESSAGES,
    DESCUENTO_ROLES,
} from "./constants.js";

const canManageDescuentos = (rol) => [DESCUENTO_ROLES.ADMIN, DESCUENTO_ROLES.JEFE].includes(rol);
const PERCENTAGE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;
const INTEGER_REGEX = /^\d+$/;

const normalizePorcentaje = (value) => {
    const porcentajeValue = `${value ?? ""}`.trim();

    if (!porcentajeValue) {
        return { error: DESCUENTO_ERRORS.PORCENTAJE_REQUIRED };
    }

    if (!PERCENTAGE_REGEX.test(porcentajeValue)) {
        return { error: DESCUENTO_ERRORS.PORCENTAJE_INVALID };
    }

    const parsedPorcentaje = Number.parseFloat(porcentajeValue.replace(",", "."));

    if (!Number.isFinite(parsedPorcentaje) || parsedPorcentaje <= 0 || parsedPorcentaje > 100) {
        return { error: DESCUENTO_ERRORS.PORCENTAJE_INVALID };
    }

    return { value: parsedPorcentaje };
};

const normalizeProductoId = (value) => {
    const productoIdValue = `${value ?? ""}`.trim();

    if (!productoIdValue || !INTEGER_REGEX.test(productoIdValue)) {
        return { error: DESCUENTO_ERRORS.PRODUCTO_ID_REQUIRED };
    }

    return { value: Number.parseInt(productoIdValue, 10) };
};

export const createDescuento = async (req, res) => {
    const { id_producto, porcentaje_descuento } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: DESCUENTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    const productoIdResult = normalizeProductoId(id_producto);

    if (productoIdResult.error) {
        return res.status(400).json({ message: productoIdResult.error });
    }

    const porcentajeResult = normalizePorcentaje(porcentaje_descuento);

    if (porcentajeResult.error) {
        return res.status(400).json({ message: porcentajeResult.error });
    }

    try {
        const productoId = productoIdResult.value;
        const producto = await Producto.findByPk(productoId);

        if (!producto) {
            return res.status(404).json({ message: DESCUENTO_ERRORS.PRODUCTO_NOT_FOUND });
        }

        const proveedor = await Proveedor.findByPk(producto.id_proveedor);

        if (!proveedor) {
            return res.status(404).json({ message: DESCUENTO_ERRORS.PROVEEDOR_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: proveedor.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: DESCUENTO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageDescuentos(`${usuarioNegocio.rol ?? ""}`.toLowerCase())) {
            return res.status(403).json({ message: DESCUENTO_ERRORS.NO_MANAGE_PERMISSION });
        }

        const descuentoExistente = await Descuento.findOne({
            where: { id_producto: productoId },
        });

        const descuento = descuentoExistente
            ? await descuentoExistente.update({ porcentaje_descuento: porcentajeResult.value })
            : await Descuento.create({
                id_producto: productoId,
                porcentaje_descuento: porcentajeResult.value,
            });

        return res.status(descuentoExistente ? 200 : 201).json({
            message: DESCUENTO_MESSAGES.DESCUENTO_CREATED,
            descuento: {
                id_descuento: descuento.id_descuento,
                id_producto: descuento.id_producto,
                porcentaje_descuento: descuento.porcentaje_descuento,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: DESCUENTO_ERRORS.SERVER_ERROR });
    }
};
