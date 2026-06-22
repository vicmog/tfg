import { sequelize } from "../../models/db.js";
import { ProductoServicio } from "../../models/ProductoServicio.js";
import { ProductoServicioVenta } from "../../models/ProductoServicioVenta.js";
import { Venta } from "../../models/Venta.js";
import { Producto } from "../../models/Producto.js";
import { Cliente } from "../../models/Cliente.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { sendClienteEmail } from "../../utils/mailer.js";
import { Op } from "sequelize";
import {
    VENTA_ERRORS,
    VENTA_MESSAGES,
    VENTA_ROLES,
} from "./constants.js";

const INTEGER_REGEX = /^\d+$/;

const includeVentaDetalles = [
    {
        association: "detalles",
        include: [
            {
                association: "productoServicio",
            },
        ],
    },
];

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

    return { usuarioNegocio };
};

const formatDateToString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const serializeVenta = (venta) => ({
    id_venta: venta.id_venta,
    id_cliente: venta.id_cliente,
    fecha: formatDateToString(venta.fecha),
    precio_total: venta.precio_total,
    tipo: venta.tipo,
    estado: venta.estado,
    createdAt: venta.createdAt,
    updatedAt: venta.updatedAt,
});

const serializeVentaWithItems = (venta, items) => ({
    id_venta: venta.id_venta,
    id_cliente: venta.id_cliente,
    id_negocio: venta.id_negocio,
    fecha: formatDateToString(venta.fecha),
    precio_total: venta.precio_total,
    tipo: venta.tipo,
    estado: venta.estado,
    items: items,
    createdAt: venta.createdAt,
    updatedAt: venta.updatedAt,
});

const normalizeItemQuantity = (value) => {
    const quantity = Number.parseInt(`${value ?? 1}`, 10);
    return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
};

const resolveVentaItem = async (item) => {
    const idPsValue = normalizeIntegerId(
        item?.id_ps ?? item?.id_producto ?? item?.id_servicio,
        VENTA_ERRORS.PRODUCTO_NOT_FOUND
    );

    if (idPsValue.error) {
        return { error: idPsValue.error };
    }

    const productoServicio = await ProductoServicio.findByPk(idPsValue.value, {
        include: [
            {
                association: "producto",
            },
            {
                association: "servicio",
            },
        ],
    });

    if (!productoServicio) {
        return { error: VENTA_ERRORS.PRODUCTO_NOT_FOUND };
    }

    if (productoServicio.tipo === "PRODUCTO" && !productoServicio.producto) {
        return { error: VENTA_ERRORS.PRODUCTO_NOT_FOUND };
    }

    if (productoServicio.tipo === "SERVICIO" && !productoServicio.servicio) {
        return { error: VENTA_ERRORS.SERVICIO_NOT_FOUND };
    }

    return { value: productoServicio };
};

const resolveVentaTipo = (items) => {
    const tipos = new Set(
        items
            .map((item) => `${item?.tipo ?? ""}`.trim().toUpperCase())
            .filter((tipo) => tipo === "PRODUCTO" || tipo === "SERVICIO")
    );

    if (tipos.has("PRODUCTO") && tipos.has("SERVICIO")) {
        return "mixta";
    }

    if (tipos.has("PRODUCTO")) {
        return "producto";
    }

    if (tipos.has("SERVICIO")) {
        return "servicio";
    }

    return "mixta";
};

export const createVenta = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocioResult = normalizeIntegerId(req.body?.id_negocio, VENTA_ERRORS.NEGOCIO_ID_REQUIRED);
    const idClienteResult = normalizeIntegerId(req.body?.id_cliente, VENTA_ERRORS.CLIENTE_ID_REQUIRED);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
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

    if (!items || items.length === 0) {
        return res.status(400).json({ message: VENTA_ERRORS.ITEMS_REQUIRED });
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

        const transaction = await sequelize.transaction();
        try {
            const ventaItems = [];

            for (const item of items) {
                const resolvedItem = await resolveVentaItem(item);

                if (resolvedItem.error) {
                    await transaction.rollback();
                    return res.status(400).json({ message: resolvedItem.error });
                }

                const productoServicio = resolvedItem.value;
                const quantity = normalizeItemQuantity(item?.cantidad);
                const unitPrice = Number(productoServicio.precio) || 0;

                if (productoServicio.tipo === "PRODUCTO") {
                    const producto = productoServicio.producto;

                    if (quantity > producto.stock) {
                        await transaction.rollback();
                        return res.status(400).json({ message: "Stock insuficiente para el producto seleccionado" });
                    }

                    ventaItems.push({
                        id_ps: productoServicio.id_ps,
                        tipo: "PRODUCTO",
                        cantidad: quantity,
                        precio_unitario: unitPrice,
                        subtotal: unitPrice * quantity,
                    });
                } else {
                    ventaItems.push({
                        id_ps: productoServicio.id_ps,
                        tipo: "SERVICIO",
                        cantidad: quantity,
                        precio_unitario: unitPrice,
                        subtotal: unitPrice * quantity,
                    });
                }
            }

            const precioTotal = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);
            const tipoVenta = resolveVentaTipo(ventaItems);

            const venta = await Venta.create(
                {
                    id_cliente: idClienteResult.value,
                    fecha: fechaResult.value,
                    precio_total: precioTotal,
                    tipo: tipoVenta,
                    estado: "completada",
                },
                { transaction }
            );

            for (const item of ventaItems) {
                if (item.tipo === "PRODUCTO") {
                    await Producto.update(
                        {
                            stock: sequelize.literal(`"stock" - ${item.cantidad}`),
                        },
                        {
                            where: { id_ps: item.id_ps },
                            transaction,
                        }
                    );
                }

                await ProductoServicioVenta.create(
                    {
                        id_venta: venta.id_venta,
                        id_ps: item.id_ps,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: item.subtotal,
                    },
                    { transaction }
                );
            }

            await transaction.commit();

            return res.status(201).json({
                message: VENTA_MESSAGES.VENTA_CREATED,
                venta: serializeVenta(venta),
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        if (error?.message === "Stock insuficiente para el producto seleccionado") {
            return res.status(400).json({ message: error.message });
        }

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

        if (tipo && ["producto", "servicio", "mixta"].includes(tipo)) {
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

export const getVentaById = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idVentaResult = normalizeIntegerId(req.params?.id_venta, VENTA_ERRORS.VENTA_ID_REQUIRED);

    if (!id_usuario) {
        return res.status(401).json({ message: VENTA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idVentaResult.error) {
        return res.status(400).json({ message: idVentaResult.error });
    }

    try {
        const venta = await Venta.findByPk(idVentaResult.value, {
            include: includeVentaDetalles,
        });

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

        const items = (venta.detalles ?? []).map((detalle) => ({
            id_ps: detalle.id_ps,
            tipo: `${detalle.productoServicio?.tipo ?? ""}`.toLowerCase(),
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            subtotal: detalle.subtotal,
        }));

        return res.status(200).json({
            message: VENTA_MESSAGES.VENTAS_RETRIEVED,
            venta: serializeVentaWithItems(venta, items),
        });
    } catch (error) {
        console.error("Error en getVentaById:", error);
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
        const venta = await Venta.findByPk(idVentaResult.value, {
            include: includeVentaDetalles,
        });

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

        const transaction = await sequelize.transaction();

        try {
            for (const detalle of venta.detalles ?? []) {
                if (detalle.productoServicio?.tipo === "PRODUCTO") {
                    await Producto.update(
                        {
                            stock: sequelize.literal(`"stock" + ${detalle.cantidad}`),
                        },
                        {
                            where: { id_ps: detalle.id_ps },
                            transaction,
                        }
                    );
                }
            }

            await ProductoServicioVenta.destroy({
                where: { id_venta: venta.id_venta },
                transaction,
            });

            await venta.destroy({ transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        return res.status(200).json({ message: VENTA_MESSAGES.VENTA_DELETED });
    } catch (error) {
        return res.status(500).json({ message: VENTA_ERRORS.SERVER_ERROR });
    }
};

export const updateVenta = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idVentaResult = normalizeIntegerId(req.params?.id_venta, VENTA_ERRORS.VENTA_ID_REQUIRED);
    const idClienteResult = req.body?.id_cliente ? normalizeIntegerId(req.body.id_cliente, VENTA_ERRORS.CLIENTE_ID_REQUIRED) : null;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const fechaResult = req.body?.fecha ? normalizeFecha(req.body.fecha) : null;

    if (!id_usuario) {
        return res.status(401).json({ message: VENTA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (idVentaResult.error) {
        return res.status(400).json({ message: idVentaResult.error });
    }

    try {
        const venta = await Venta.findByPk(idVentaResult.value, {
            include: includeVentaDetalles,
        });

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

        // Validar cliente si se proporciona
        if (idClienteResult) {
            if (idClienteResult.error) {
                return res.status(400).json({ message: idClienteResult.error });
            }

            const nuevoCliente = await Cliente.findByPk(idClienteResult.value);
            if (!nuevoCliente || nuevoCliente.id_negocio !== cliente.id_negocio) {
                return res.status(404).json({ message: VENTA_ERRORS.CLIENTE_NOT_FOUND });
            }

            venta.id_cliente = idClienteResult.value;
        }

        // Validar y actualizar fecha
        if (fechaResult) {
            if (fechaResult.error) {
                return res.status(400).json({ message: fechaResult.error });
            }
            venta.fecha = fechaResult.value;
        }

        const transaction = await sequelize.transaction();

        if (items && items.length > 0) {
            try {
                for (const detalle of venta.detalles ?? []) {
                    if (detalle.productoServicio?.tipo === "PRODUCTO") {
                        await Producto.update(
                            {
                                stock: sequelize.literal(`"stock" + ${detalle.cantidad}`),
                            },
                            {
                                where: { id_ps: detalle.id_ps },
                                transaction,
                            }
                        );
                    }
                }

                await ProductoServicioVenta.destroy({
                    where: { id_venta: venta.id_venta },
                    transaction,
                });

                const ventaItems = [];

                for (const item of items) {
                    const resolvedItem = await resolveVentaItem(item);

                    if (resolvedItem.error) {
                        await transaction.rollback();
                        return res.status(400).json({ message: resolvedItem.error });
                    }

                    const productoServicio = resolvedItem.value;
                    const quantity = normalizeItemQuantity(item?.cantidad);
                    const unitPrice = Number(productoServicio.precio) || 0;

                    if (productoServicio.tipo === "PRODUCTO") {
                        const producto = productoServicio.producto;

                        if (quantity > producto.stock) {
                            await transaction.rollback();
                            return res.status(400).json({ message: "Stock insuficiente para el producto seleccionado" });
                        }
                    }

                    ventaItems.push({
                        id_ps: productoServicio.id_ps,
                        tipo: productoServicio.tipo,
                        cantidad: quantity,
                        precio_unitario: unitPrice,
                        subtotal: unitPrice * quantity,
                    });
                }

                const precioTotal = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);
                const tipoVenta = resolveVentaTipo(ventaItems);

                venta.precio_total = precioTotal;
                venta.tipo = tipoVenta;

                for (const item of ventaItems) {
                    if (item.tipo === "PRODUCTO") {
                        await Producto.update(
                            {
                                stock: sequelize.literal(`"stock" - ${item.cantidad}`),
                            },
                            {
                                where: { id_ps: item.id_ps },
                                transaction,
                            }
                        );
                    }

                    await ProductoServicioVenta.create(
                        {
                            id_venta: venta.id_venta,
                            id_ps: item.id_ps,
                            cantidad: item.cantidad,
                            precio_unitario: item.precio_unitario,
                            subtotal: item.subtotal,
                        },
                        { transaction }
                    );
                }
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        }

        await venta.save({ transaction });
        await transaction.commit();

        return res.status(200).json({
            message: VENTA_MESSAGES.VENTA_CREATED,
            venta: serializeVenta(venta),
        });
    } catch (error) {
        if (error?.message === "Stock insuficiente para el producto seleccionado") {
            return res.status(400).json({ message: error.message });
        }

        console.error("Error en updateVenta:", error);
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
