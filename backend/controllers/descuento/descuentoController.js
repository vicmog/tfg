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

const normalizeDescuentoId = (value) => {
    const descuentoIdValue = `${value ?? ""}`.trim();

    if (!descuentoIdValue || !INTEGER_REGEX.test(descuentoIdValue)) {
        return { error: DESCUENTO_ERRORS.DESCUENTO_ID_REQUIRED };
    }

    return { value: Number.parseInt(descuentoIdValue, 10) };
};

const normalizeNegocioId = (value) => {
    const negocioIdValue = `${value ?? ""}`.trim();

    if (!negocioIdValue || !INTEGER_REGEX.test(negocioIdValue)) {
        return { error: "ID de negocio requerido" };
    }

    return { value: Number.parseInt(negocioIdValue, 10) };
};

export const getDescuentosByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: DESCUENTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    const negocioIdResult = normalizeNegocioId(id_negocio);

    if (negocioIdResult.error) {
        return res.status(400).json({ message: negocioIdResult.error });
    }

    try {
        const negocioId = negocioIdResult.value;

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: negocioId },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: DESCUENTO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageDescuentos(`${usuarioNegocio.rol ?? ""}`.toLowerCase())) {
            return res.status(403).json({ message: DESCUENTO_ERRORS.NO_VIEW_PERMISSION });
        }

        const proveedores = await Proveedor.findAll({
            where: { id_negocio: negocioId },
            attributes: ['id_proveedor'],
        });

        const proveedorIds = proveedores.map(p => p.id_proveedor);

        if (proveedorIds.length === 0) {
            return res.status(200).json({
                message: DESCUENTO_MESSAGES.DESCUENTOS_RETRIEVED,
                descuentos: [],
            });
        }

        const productos = await Producto.findAll({
            where: { id_proveedor: proveedorIds },
            attributes: ['id_producto', 'nombre', 'referencia'],
        });

        const productoIds = productos.map(p => p.id_producto);
        const productoMap = {};
        productos.forEach(p => {
            productoMap[p.id_producto] = {
                nombre: p.nombre,
                referencia: p.referencia,
            };
        });

        const descuentos = await Descuento.findAll({
            where: { id_producto: productoIds },
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            message: DESCUENTO_MESSAGES.DESCUENTOS_RETRIEVED,
            descuentos: descuentos.map(d => ({
                id_descuento: d.id_descuento,
                id_producto: d.id_producto,
                producto_nombre: productoMap[d.id_producto]?.nombre || 'Producto no encontrado',
                producto_referencia: productoMap[d.id_producto]?.referencia || '',
                porcentaje_descuento: d.porcentaje_descuento,
                tipo_descuento: d.tipo_descuento,
                fecha_inicio: d.fecha_inicio,
                fecha_fin: d.fecha_fin,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt,
            })),
        });
    } catch (error) {
        return res.status(500).json({ message: DESCUENTO_ERRORS.SERVER_ERROR });
    }
};

export const getDescuentosByProducto = async (req, res) => {
    const { id_producto } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: DESCUENTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    const productoIdResult = normalizeProductoId(id_producto);

    if (productoIdResult.error) {
        return res.status(400).json({ message: productoIdResult.error });
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
            return res.status(403).json({ message: DESCUENTO_ERRORS.NO_VIEW_PERMISSION });
        }

        const descuentos = await Descuento.findAll({
            where: { id_producto: productoId },
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            message: DESCUENTO_MESSAGES.DESCUENTOS_RETRIEVED,
            descuentos: descuentos.map(d => ({
                id_descuento: d.id_descuento,
                id_producto: d.id_producto,
                porcentaje_descuento: d.porcentaje_descuento,
                tipo_descuento: d.tipo_descuento,
                fecha_inicio: d.fecha_inicio,
                fecha_fin: d.fecha_fin,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt,
            })),
        });
    } catch (error) {
        return res.status(500).json({ message: DESCUENTO_ERRORS.SERVER_ERROR });
    }
};

export const createDescuento = async (req, res) => {
    const { id_producto, porcentaje_descuento, tipo_descuento, fecha_inicio, fecha_fin } = req.body;
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

        const descuentoData = {
            porcentaje_descuento: porcentajeResult.value,
        };

        if (tipo_descuento !== undefined) {
            descuentoData.tipo_descuento = tipo_descuento || "porcentaje";
        }

        if (fecha_inicio !== undefined) {
            descuentoData.fecha_inicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
        }

        if (fecha_fin !== undefined) {
            descuentoData.fecha_fin = fecha_fin ? new Date(fecha_fin) : null;
        }

        const descuento = descuentoExistente
            ? await descuentoExistente.update(descuentoData)
            : await Descuento.create({
                id_producto: productoId,
                ...descuentoData,
            });

        return res.status(descuentoExistente ? 200 : 201).json({
            message: DESCUENTO_MESSAGES.DESCUENTO_CREATED,
            descuento: {
                id_descuento: descuento.id_descuento,
                id_producto: descuento.id_producto,
                porcentaje_descuento: descuento.porcentaje_descuento,
                tipo_descuento: descuento.tipo_descuento,
                fecha_inicio: descuento.fecha_inicio,
                fecha_fin: descuento.fecha_fin,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: DESCUENTO_ERRORS.SERVER_ERROR });
    }
};

export const deleteDescuento = async (req, res) => {
    const { id_descuento } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: DESCUENTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    const descuentoIdResult = normalizeDescuentoId(id_descuento);

    if (descuentoIdResult.error) {
        return res.status(400).json({ message: descuentoIdResult.error });
    }

    try {
        const descuento = await Descuento.findByPk(descuentoIdResult.value);

        if (!descuento) {
            return res.status(404).json({ message: DESCUENTO_ERRORS.DESCUENTO_NOT_FOUND });
        }

        const producto = await Producto.findByPk(descuento.id_producto);

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

        await descuento.destroy();

        return res.status(200).json({ message: DESCUENTO_MESSAGES.DESCUENTO_DELETED });
    } catch (error) {
        return res.status(500).json({ message: DESCUENTO_ERRORS.SERVER_ERROR });
    }
};
