import { Venta } from "../../models/Venta.js";
import { VentaProducto } from "../../models/VentaProducto.js";
import { VentaServicio } from "../../models/VentaServicio.js";
import { Cliente } from "../../models/Cliente.js";
import { Producto } from "../../models/Producto.js";
import { Servicio } from "../../models/Servicio.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { sendClienteEmail } from "../../utils/mailer.js";
import { Op } from "sequelize";
import {
    VENTA_ERRORS,
    VENTA_MESSAGES,
    VENTA_ROLES,
} from "./constants.js";

const INTEGER_REGEX = /^\d+$/;

const canManageVentas = (rol) => [VENTA_ROLES.ADMIN, VENTA_ROLES.JEFE].includes(rol);

const normalizeIntegerId = (value, errorMessage) => {
    const normalized = `${value ?? ""}`.trim();

    if (!normalized || !INTEGER_REGEX.test(normalized)) {
        return { error: errorMessage };
    }

    return { value: Number.parseInt(normalized, 10) };
};

const normalizePrice = (value, requiredMsg, invalidMsg) => {
    const normalized = `${value ?? ""}`.trim().replace(",", ".");

    if (!normalized) {
        return { error: requiredMsg };
    }

    const parsed = Number.parseFloat(normalized);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return { error: invalidMsg };
    }

    return { value: parsed };
};

const normalizeFecha = (value) => {
    const normalized = `${value ?? ""}`.trim();

    if (!normalized) {
        return { error: VENTA_ERRORS.FECHA_REQUIRED };
    }

    const parsedDate = new Date(normalized);

    if (Number.isNaN(parsedDate.getTime())) {
        return { error: VENTA_ERRORS.FECHA_INVALID };
    }

    return { value: parsedDate };
};

const ensureNegocioAccess = async (id_usuario, id_negocio) => {
    const usuarioNegocio = await UsuarioNegocio.findOne({
        where: { id_usuario, id_negocio },
    });

    if (!usuarioNegocio) {
        return { status: 403, message: VENTA_ERRORS.NO_ACCESS_TO_NEGOCIO };
    }

    if (!canManageVentas(`${usuarioNegocio.rol ?? ""}`.toLowerCase())) {
        return { status: 403, message: VENTA_ERRORS.NO_MANAGE_PERMISSION };
    }

    return { usuarioNegocio };
};

const serializeVenta = (venta) => ({
    id_venta: venta.id_venta,
    id_cliente: venta.id_cliente,
    fecha: venta.fecha,
    precio_total: venta.precio_total,
    tipo: venta.tipo,
    estado: venta.estado,
    createdAt: venta.createdAt,
    updatedAt: venta.updatedAt,
});

export const createVenta = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocioResult = normalizeIntegerId(req.body?.id_negocio, VENTA_ERRORS.NEGOCIO_ID_REQUIRED);
    const idClienteResult = normalizeIntegerId(req.body?.id_cliente, VENTA_ERRORS.CLIENTE_ID_REQUIRED);
    const tipo = typeof req.body?.tipo === "string" ? req.body.tipo.toLowerCase().trim() : "";
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const precioTotalResult = normalizePrice(
        req.body?.precio_total,
        VENTA_ERRORS.PRECIO_TOTAL_REQUIRED,
        VENTA_ERRORS.PRECIO_TOTAL_INVALID
    );
    const fechaResult = normalizeFecha(req.body?.fecha);

    if (!id_usuario) {
        return res.status(401).json({ message: VENTA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idNegocioResult.error) {
        return res.status(400).json({ message: idNegocioResult.error });
    }

    if (idClienteResult.error) {
        return res.status(400).json({ message: idClienteResult.error });
    }

    if (!tipo || !["producto", "servicio"].includes(tipo)) {
        return res.status(400).json({ message: VENTA_ERRORS.TIPO_INVALID });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({ message: VENTA_ERRORS.ITEMS_REQUIRED });
    }

    if (precioTotalResult.error) {
        return res.status(400).json({ message: precioTotalResult.error });
    }

    if (fechaResult.error) {
        return res.status(400).json({ message: fechaResult.error });
    }

    try {
        const accessResult = await ensureNegocioAccess(id_usuario, idNegocioResult.value);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        const cliente = await Cliente.findByPk(idClienteResult.value);

        if (!cliente || cliente.id_negocio !== idNegocioResult.value) {
            return res.status(404).json({ message: VENTA_ERRORS.CLIENTE_NOT_FOUND });
        }

        const venta = await Venta.create({
            id_cliente: idClienteResult.value,
            fecha: fechaResult.value,
            precio_total: precioTotalResult.value,
            tipo,
            estado: "completada",
        });

        if (tipo === "producto") {
            for (const item of items) {
                const idProductoResult = normalizeIntegerId(item.id_producto, VENTA_ERRORS.PRODUCTO_NOT_FOUND);
                const cantidad = Number.parseInt(`${item.cantidad ?? 1}`, 10) || 1;

                if (idProductoResult.error) {
                    await venta.destroy();
                    return res.status(400).json({ message: idProductoResult.error });
                }

                const producto = await Producto.findByPk(idProductoResult.value);

                if (!producto) {
                    await venta.destroy();
                    return res.status(404).json({ message: VENTA_ERRORS.PRODUCTO_NOT_FOUND });
                }

                await VentaProducto.create({
                    id_venta: venta.id_venta,
                    id_producto: idProductoResult.value,
                    cantidad,
                });
            }
        } else if (tipo === "servicio") {
            for (const item of items) {
                const idServicioResult = normalizeIntegerId(item.id_servicio, VENTA_ERRORS.SERVICIO_NOT_FOUND);

                if (idServicioResult.error) {
                    await venta.destroy();
                    return res.status(400).json({ message: idServicioResult.error });
                }

                const servicio = await Servicio.findByPk(idServicioResult.value);

                if (!servicio || servicio.id_negocio !== idNegocioResult.value) {
                    await venta.destroy();
                    return res.status(404).json({ message: VENTA_ERRORS.SERVICIO_NOT_FOUND });
                }

                await VentaServicio.create({
                    id_venta: venta.id_venta,
                    id_servicio: idServicioResult.value,
                });
            }
        }

        return res.status(201).json({
            message: VENTA_MESSAGES.VENTA_CREATED,
            venta: serializeVenta(venta),
        });
    } catch (error) {
        return res.status(500).json({ message: VENTA_ERRORS.SERVER_ERROR });
    }
};

export const getVentasByNegocio = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocioResult = normalizeIntegerId(req.params?.id_negocio, VENTA_ERRORS.NEGOCIO_ID_REQUIRED);
    const tipo = typeof req.query?.tipo === "string" ? req.query.tipo.toLowerCase().trim() : "";

    if (!id_usuario) {
        return res.status(401).json({ message: VENTA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idNegocioResult.error) {
        return res.status(400).json({ message: idNegocioResult.error });
    }

    try {
        // Verificar que el usuario tiene acceso al negocio
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: idNegocioResult.value },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: VENTA_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const clientes = await Cliente.findAll({
            attributes: ["id_cliente"],
            where: { id_negocio: idNegocioResult.value },
        });

        const clienteIds = clientes.map((cliente) => cliente.id_cliente);

        if (clienteIds.length === 0) {
            return res.status(200).json({
                message: VENTA_MESSAGES.VENTAS_RETRIEVED,
                ventas: [],
            });
        }

        const where = {
            id_cliente: { [Op.in]: clienteIds },
        };

        if (tipo && ["producto", "servicio"].includes(tipo)) {
            where.tipo = tipo;
        }

        const ventas = await Venta.findAll({
            where,
            order: [["fecha", "DESC"], ["createdAt", "DESC"]],
        });

        return res.status(200).json({
            message: VENTA_MESSAGES.VENTAS_RETRIEVED,
            ventas: ventas.map(serializeVenta),
        });
    } catch (error) {
        console.error("Error en getVentasByNegocio:", error);
        return res.status(500).json({ message: VENTA_ERRORS.SERVER_ERROR });
    }
};

export const deleteVenta = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idVentaResult = normalizeIntegerId(req.params?.id_venta, VENTA_ERRORS.VENTA_ID_REQUIRED);

    if (!id_usuario) {
        return res.status(401).json({ message: VENTA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idVentaResult.error) {
        return res.status(400).json({ message: idVentaResult.error });
    }

    try {
        const venta = await Venta.findByPk(idVentaResult.value);

        if (!venta) {
            return res.status(404).json({ message: VENTA_ERRORS.VENTA_NOT_FOUND });
        }

        const cliente = await Cliente.findByPk(venta.id_cliente);

        if (!cliente) {
            return res.status(404).json({ message: VENTA_ERRORS.CLIENTE_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(id_usuario, cliente.id_negocio);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        await venta.destroy();

        return res.status(200).json({ message: VENTA_MESSAGES.VENTA_DELETED });
    } catch (error) {
        return res.status(500).json({ message: VENTA_ERRORS.SERVER_ERROR });
    }
};

export const sendVentaEmail = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idVentaResult = normalizeIntegerId(req.params?.id_venta, VENTA_ERRORS.VENTA_ID_REQUIRED);

    if (!id_usuario) {
        return res.status(401).json({ message: VENTA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idVentaResult.error) {
        return res.status(400).json({ message: idVentaResult.error });
    }

    try {
        const venta = await Venta.findByPk(idVentaResult.value);

        if (!venta) {
            return res.status(404).json({ message: VENTA_ERRORS.VENTA_NOT_FOUND });
        }

        const cliente = await Cliente.findByPk(venta.id_cliente);

        if (!cliente) {
            return res.status(404).json({ message: VENTA_ERRORS.CLIENTE_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(id_usuario, cliente.id_negocio);

        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        if (!cliente || !cliente.email) {
            return res.status(400).json({ message: VENTA_ERRORS.CLIENTE_EMAIL_REQUIRED });
        }

        const formatDate = (date) => {
            const d = new Date(date);
            return d.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        };

        const formatAmount = (value) => {
            return new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
            }).format(value);
        };

        const subject = `Ticket de venta #${venta.id_venta}`;
        const text = `Hola ${cliente.nombre || ""},\n\nAdjunto encontrarás el ticket de tu venta.\n\nDetalles:\n- Fecha: ${formatDate(venta.fecha)}\n- Tipo: ${venta.tipo}\n- Total: ${formatAmount(venta.precio_total)}\n\nGracias por tu compra.`;

        await sendClienteEmail(cliente.email, subject, text);

        return res.status(200).json({ message: VENTA_MESSAGES.EMAIL_SENT });
    } catch (error) {
        return res.status(500).json({ message: VENTA_ERRORS.SERVER_ERROR });
    }
};
