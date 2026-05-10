import { Venta } from "../../models/Venta.js";
import { VentaProducto } from "../../models/VentaProducto.js";
import { VentaServicio } from "../../models/VentaServicio.js";
import { Reserva } from "../../models/Reserva.js";
import { Producto } from "../../models/Producto.js";
import { Servicio } from "../../models/Servicio.js";
import { Gasto } from "../../models/Gasto.js";
import { Cliente } from "../../models/Cliente.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { sequelize } from "../../models/db.js";
import { Op } from "sequelize";
import {
    ESTADISTICAS_ERRORS,
    ESTADISTICAS_MESSAGES,
    FILTER_TYPES,
} from "./constants.js";

const INTEGER_REGEX = /^\d+$/;

const normalizeIntegerId = (value, errorMessage) => {
    const normalized = `${value ?? ""}`.trim();
    if (!normalized || !INTEGER_REGEX.test(normalized)) {
        return { error: errorMessage };
    }
    return { value: Number.parseInt(normalized, 10) };
};

const hasAccessToNegocio = async (id_usuario, id_negocio) => {
    const usuarioNegocio = await UsuarioNegocio.findOne({
        where: { id_usuario, id_negocio },
    });
    return !!usuarioNegocio;
};

const getDateRange = (filterType, startDate = null, endDate = null) => {
    const now = new Date();
    let dateRange = {};

    switch (filterType) {
        case FILTER_TYPES.TODAY:
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            dateRange = { [Op.between]: [todayStart, todayEnd] };
            break;

        case FILTER_TYPES.WEEK:
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            dateRange = { [Op.between]: [weekStart, weekEnd] };
            break;

        case FILTER_TYPES.MONTH:
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            dateRange = { [Op.between]: [monthStart, monthEnd] };
            break;

        case FILTER_TYPES.YEAR:
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
            dateRange = { [Op.between]: [yearStart, yearEnd] };
            break;

        case FILTER_TYPES.CUSTOM:
            if (startDate && endDate) {
                dateRange = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }
            break;

        default:
            dateRange = { [Op.between]: [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1)] };
    }

    return dateRange;
};

export const getDashboardStats = async (req, res) => {
    try {
        const id_usuario = req.user?.id_usuario;
        const idNegocioResult = normalizeIntegerId(
            req.params?.id_negocio,
            ESTADISTICAS_ERRORS.INVALID_NEGOCIO_ID
        );

        if (!id_usuario) {
            return res.status(401).json({ message: ESTADISTICAS_ERRORS.USER_NOT_AUTHENTICATED });
        }

        if (idNegocioResult.error) {
            return res.status(400).json({ message: idNegocioResult.error });
        }

        const hasAccess = await hasAccessToNegocio(id_usuario, idNegocioResult.value);
        if (!hasAccess) {
            return res.status(403).json({ message: ESTADISTICAS_ERRORS.NO_ACCESS });
        }

        const id_negocio = idNegocioResult.value;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        
        const ventasResultQuery = await sequelize.query(
            `SELECT SUM(v.precio_total) as total
             FROM "Venta" v
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate`,
            {
                replacements: { id_negocio, startDate: monthStart, endDate: monthEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );
        const ventasResult = (ventasResultQuery && ventasResultQuery[0] && ventasResultQuery[0].total) ? Number(ventasResultQuery[0].total) : 0;
        const ingresosTotales = ventasResult || 0;

        const gastosResultQuery = await sequelize.query(
            `SELECT COALESCE(SUM(g.importe), 0) as total
             FROM "Gasto" g
             JOIN "TipoGasto" tg ON g.id_tipo_gasto = tg.id_tipo_gasto
             WHERE tg.id_negocio = :id_negocio AND g.fecha BETWEEN :startDate AND :endDate`,
            {
                replacements: { id_negocio, startDate: monthStart, endDate: monthEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const gastosTotales = Number(gastosResultQuery?.[0]?.total) || 0;

        const numReservasQuery = await sequelize.query(
            `SELECT COUNT(*) as total
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND r.fecha_hora_inicio BETWEEN :startDate AND :endDate`,
            {
                replacements: { id_negocio, startDate: monthStart, endDate: monthEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const numReservas = Number(numReservasQuery?.[0]?.total) || 0;

        const numVentasQuery = await sequelize.query(
            `SELECT COUNT(*) as cantidad
             FROM "Venta" v
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate`,
            {
                replacements: { id_negocio, startDate: monthStart, endDate: monthEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );
        const numVentas = (numVentasQuery && numVentasQuery[0]) ? Number(numVentasQuery[0].cantidad) : 0;

        
        const numClientes = await Cliente.count({
            where: { id_negocio },
        });

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.DASHBOARD_RETRIEVED,
            dashboard: {
                ingresosTotales,
                gastosTotales,
                beneficioNeto: ingresosTotales - gastosTotales,
                numReservas,
                numVentas,
                numClientes
            },
        });
    } catch (error) {
        console.error("Error en getDashboardStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getSalesStats = async (req, res) => {
    try {
        const id_usuario = req.user?.id_usuario;
        const idNegocioResult = normalizeIntegerId(
            req.params?.id_negocio,
            ESTADISTICAS_ERRORS.INVALID_NEGOCIO_ID
        );
        const filterType = req.query?.filter || FILTER_TYPES.MONTH;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;

        if (!id_usuario) {
            return res.status(401).json({ message: ESTADISTICAS_ERRORS.USER_NOT_AUTHENTICATED });
        }

        if (idNegocioResult.error) {
            return res.status(400).json({ message: idNegocioResult.error });
        }

        const hasAccess = await hasAccessToNegocio(id_usuario, idNegocioResult.value);
        if (!hasAccess) {
            return res.status(403).json({ message: ESTADISTICAS_ERRORS.NO_ACCESS });
        }

        const id_negocio = idNegocioResult.value;
        const dateRange = getDateRange(filterType, startDate, endDate);

        // Ingresos por día
        const ventasPorDia = await sequelize.query(
            `SELECT DATE(v.fecha) as fecha, SUM(v.precio_total) as total, COUNT(*) as cantidad
             FROM "Venta" v
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate
             GROUP BY DATE(v.fecha)
             ORDER BY fecha ASC`,
            {
                replacements: {
                    id_negocio,
                    startDate: getDateRange(filterType, startDate, endDate)[Op.between][0],
                    endDate: getDateRange(filterType, startDate, endDate)[Op.between][1],
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        // Productos más vendidos
        const productosMasVendidos = await sequelize.query(
            `SELECT p.id_producto, p.nombre, COUNT(vp.id_producto) as cantidad, SUM(vp.cantidad) as total_cantidad, SUM(p.precio_venta * vp.cantidad) as ingresos
             FROM "VentaProducto" vp
             JOIN "Venta" v ON vp.id_venta = v.id_venta
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             JOIN "Producto" p ON vp.id_producto = p.id_producto
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate
             GROUP BY p.id_producto, p.nombre
             ORDER BY cantidad DESC
             LIMIT 10`,
            {
                replacements: {
                    id_negocio,
                    startDate: getDateRange(filterType, startDate, endDate)[Op.between][0],
                    endDate: getDateRange(filterType, startDate, endDate)[Op.between][1],
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        // Servicios más vendidos
        const serviciosMasVendidos = await sequelize.query(
            `SELECT s.id_servicio, s.nombre, COUNT(vs.id_servicio) as cantidad, SUM(s.precio) as ingresos
             FROM "VentaServicio" vs
             JOIN "Venta" v ON vs.id_venta = v.id_venta
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             JOIN "Servicio" s ON vs.id_servicio = s.id_servicio
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate
             GROUP BY s.id_servicio, s.nombre
             ORDER BY cantidad DESC
             LIMIT 10`,
            {
                replacements: {
                    id_negocio,
                    startDate: getDateRange(filterType, startDate, endDate)[Op.between][0],
                    endDate: getDateRange(filterType, startDate, endDate)[Op.between][1],
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.SALES_STATS_RETRIEVED,
            salesStats: {
                ventasPorDia,
                productosMasVendidos,
                serviciosMasVendidos,
            },
        });
    } catch (error) {
        console.error("Error en getSalesStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getReservaStats = async (req, res) => {
    try {
        const id_usuario = req.user?.id_usuario;
        const idNegocioResult = normalizeIntegerId(
            req.params?.id_negocio,
            ESTADISTICAS_ERRORS.INVALID_NEGOCIO_ID
        );
        const filterType = req.query?.filter || FILTER_TYPES.MONTH;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;

        if (!id_usuario) {
            return res.status(401).json({ message: ESTADISTICAS_ERRORS.USER_NOT_AUTHENTICATED });
        }

        if (idNegocioResult.error) {
            return res.status(400).json({ message: idNegocioResult.error });
        }

        const hasAccess = await hasAccessToNegocio(id_usuario, idNegocioResult.value);
        if (!hasAccess) {
            return res.status(403).json({ message: ESTADISTICAS_ERRORS.NO_ACCESS });
        }

        const id_negocio = idNegocioResult.value;
        const dateRange = getDateRange(filterType, startDate, endDate);
        const rangeStart = dateRange?.[Op.between]?.[0];
        const rangeEnd = dateRange?.[Op.between]?.[1];

        const reservasPorDia = await sequelize.query(
            `SELECT DATE(r.fecha_hora_inicio) as fecha, COUNT(*) as cantidad
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND r.fecha_hora_inicio BETWEEN :startDate AND :endDate
             GROUP BY DATE(r.fecha_hora_inicio)
             ORDER BY fecha ASC`,
            {
                replacements: {
                    id_negocio,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const reservasPorEstado = await sequelize.query(
            `SELECT r.estado, COUNT(r.id_reserva) as cantidad
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio
             GROUP BY r.estado
             ORDER BY cantidad DESC`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const horasConMasReservas = await sequelize.query(
            `SELECT EXTRACT(HOUR FROM r.fecha_hora_inicio) as hora, COUNT(*) as cantidad
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio
             GROUP BY EXTRACT(HOUR FROM r.fecha_hora_inicio)
             ORDER BY cantidad DESC`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const serviciosMasReservados = await sequelize.query(
            `SELECT s.id_servicio, s.nombre, COUNT(sr.id_servicio) as cantidad
             FROM "ServicioReserva" sr
             JOIN "Reserva" r ON sr.id_reserva = r.id_reserva
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             JOIN "Servicio" s ON sr.id_servicio = s.id_servicio
             WHERE c.id_negocio = :id_negocio
             GROUP BY s.id_servicio, s.nombre
             ORDER BY cantidad DESC
             LIMIT 10`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.RESERVA_STATS_RETRIEVED,
            reservaStats: {
                reservasPorDia,
                reservasPorEstado,
                horasConMasReservas,
                serviciosMasReservados,
            },
        });
    } catch (error) {
        console.error("Error en getReservaStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getProductStats = async (req, res) => {
    try {
        const id_usuario = req.user?.id_usuario;
        const idNegocioResult = normalizeIntegerId(
            req.params?.id_negocio,
            ESTADISTICAS_ERRORS.INVALID_NEGOCIO_ID
        );
        const filterType = req.query?.filter || FILTER_TYPES.MONTH;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;

        if (!id_usuario) {
            return res.status(401).json({ message: ESTADISTICAS_ERRORS.USER_NOT_AUTHENTICATED });
        }

        if (idNegocioResult.error) {
            return res.status(400).json({ message: idNegocioResult.error });
        }

        const hasAccess = await hasAccessToNegocio(id_usuario, idNegocioResult.value);
        if (!hasAccess) {
            return res.status(403).json({ message: ESTADISTICAS_ERRORS.NO_ACCESS });
        }

        const id_negocio = idNegocioResult.value;
        const dateRange = getDateRange(filterType, startDate, endDate);
        const rangeStart = dateRange?.[Op.between]?.[0];
        const rangeEnd = dateRange?.[Op.between]?.[1];

        const productosMasVendidos = await sequelize.query(
            `SELECT p.id_producto, p.nombre, SUM(vp.cantidad) as cantidad_vendida, SUM(p.precio_venta * vp.cantidad) as facturacion
             FROM "VentaProducto" vp
             JOIN "Venta" v ON vp.id_venta = v.id_venta
             JOIN "Producto" p ON vp.id_producto = p.id_producto
             JOIN "Proveedor" pr ON p.id_proveedor = pr.id_proveedor
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND pr.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate
             GROUP BY p.id_producto, p.nombre
             ORDER BY cantidad_vendida DESC
             LIMIT 15`,
            {
                replacements: {
                    id_negocio,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const productosConStockBajo = await sequelize.query(
            `SELECT p.id_producto, p.nombre, p.stock, p.stock_minimo, p.precio_venta
             FROM "Producto" p
             JOIN "Proveedor" pr ON p.id_proveedor = pr.id_proveedor
             WHERE pr.id_negocio = :id_negocio AND p.stock <= p.stock_minimo
             ORDER BY p.stock ASC
             LIMIT 15`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const productosConMayorFacturacion = await sequelize.query(
            `SELECT p.id_producto, p.nombre, SUM(p.precio_venta * vp.cantidad) as facturacion_total, SUM(vp.cantidad) as cantidad_vendida
             FROM "VentaProducto" vp
             JOIN "Venta" v ON vp.id_venta = v.id_venta
             JOIN "Producto" p ON vp.id_producto = p.id_producto
             JOIN "Proveedor" pr ON p.id_proveedor = pr.id_proveedor
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND pr.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate
             GROUP BY p.id_producto, p.nombre
             ORDER BY facturacion_total DESC
             LIMIT 15`,
            {
                replacements: {
                    id_negocio,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.PRODUCT_STATS_RETRIEVED,
            productStats: {
                productosMasVendidos,
                productosConStockBajo,
                productosConMayorFacturacion,
            },
        });
    } catch (error) {
        console.error("Error en getProductStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getServiceStats = async (req, res) => {
    try {
        const id_usuario = req.user?.id_usuario;
        const idNegocioResult = normalizeIntegerId(
            req.params?.id_negocio,
            ESTADISTICAS_ERRORS.INVALID_NEGOCIO_ID
        );
        const filterType = req.query?.filter || FILTER_TYPES.MONTH;
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;

        if (!id_usuario) {
            return res.status(401).json({ message: ESTADISTICAS_ERRORS.USER_NOT_AUTHENTICATED });
        }

        if (idNegocioResult.error) {
            return res.status(400).json({ message: idNegocioResult.error });
        }

        const hasAccess = await hasAccessToNegocio(id_usuario, idNegocioResult.value);
        if (!hasAccess) {
            return res.status(403).json({ message: ESTADISTICAS_ERRORS.NO_ACCESS });
        }

        const id_negocio = idNegocioResult.value;
        const dateRange = getDateRange(filterType, startDate, endDate);
        const rangeStart = dateRange?.[Op.between]?.[0];
        const rangeEnd = dateRange?.[Op.between]?.[1];

        const serviciosMasReservados = await sequelize.query(
            `SELECT s.id_servicio, s.nombre, COUNT(sr.id_servicio) as cantidad_reservas
             FROM "ServicioReserva" sr
             JOIN "Reserva" r ON sr.id_reserva = r.id_reserva
             JOIN "Servicio" s ON sr.id_servicio = s.id_servicio
             WHERE s.id_negocio = :id_negocio AND r.fecha_hora_inicio BETWEEN :startDate AND :endDate
             GROUP BY s.id_servicio, s.nombre
             ORDER BY cantidad_reservas DESC
             LIMIT 15`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const serviciosConMayorFacturacion = await sequelize.query(
            `SELECT s.id_servicio, s.nombre, COUNT(vs.id_servicio) as cantidad_ventas, SUM(s.precio) as facturacion_total
             FROM "VentaServicio" vs
             JOIN "Venta" v ON vs.id_venta = v.id_venta
             JOIN "Servicio" s ON vs.id_servicio = s.id_servicio
             WHERE s.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate
             GROUP BY s.id_servicio, s.nombre
             ORDER BY facturacion_total DESC
             LIMIT 15`,
            {
                replacements: {
                    id_negocio,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const duracionMediaServicios = await sequelize.query(
            `SELECT s.id_servicio, s.nombre, AVG(s.duracion) as duracion_promedio, COUNT(r.id_reserva) as total_reservas
             FROM "ServicioReserva" sr
             JOIN "Reserva" r ON sr.id_reserva = r.id_reserva
             JOIN "Servicio" s ON sr.id_servicio = s.id_servicio
             WHERE s.id_negocio = :id_negocio AND r.fecha_hora_inicio BETWEEN :startDate AND :endDate
             GROUP BY s.id_servicio, s.nombre
             LIMIT 15`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.SERVICE_STATS_RETRIEVED,
            serviceStats: {
                serviciosMasReservados,
                serviciosConMayorFacturacion,
                duracionMediaServicios,
            },
        });
    } catch (error) {
        console.error("Error en getServiceStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};
