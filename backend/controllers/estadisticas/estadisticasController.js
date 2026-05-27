import { Venta } from "../../models/Venta.js";
import { VentaProducto } from "../../models/VentaProducto.js";
import { VentaServicio } from "../../models/VentaServicio.js";
import { Reserva } from "../../models/Reserva.js";
import { Producto } from "../../models/Producto.js";
import { Servicio } from "../../models/Servicio.js";
import { Recurso } from "../../models/Recurso.js";
import { Compra } from "../../models/Compra.js";
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

const toNumberOrNull = (value) => {
    if (value === undefined || value === null || `${value}`.trim() === "") {
        return null;
    }
    const parsed = Number.parseInt(`${value}`.trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const parseDashboardFilters = (query) => {
    const now = new Date();
    const year = toNumberOrNull(query?.year) ?? now.getFullYear();
    const month = toNumberOrNull(query?.month);
    const day = toNumberOrNull(query?.day);

    if (year < 2000 || year > 2100) {
        return { error: "El año debe estar entre 2000 y 2100" };
    }

    if (month !== null && (month < 1 || month > 12)) {
        return { error: "El mes debe estar entre 1 y 12" };
    }

    if (day !== null && month === null) {
        return { error: "Para filtrar por día, también debes indicar un mes" };
    }

    if (day !== null) {
        const maxDay = new Date(year, month, 0).getDate();
        if (day < 1 || day > maxDay) {
            return { error: `El día debe estar entre 1 y ${maxDay} para ${month}/${year}` };
        }
    }

    return { year, month, day };
};

const getSummaryRangeFromFilter = ({ year, month, day }) => {
    if (day !== null && month !== null) {
        const start = new Date(year, month - 1, day);
        const end = new Date(year, month - 1, day + 1);
        return { start, end, mode: "day" };
    }

    if (month !== null) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        return { start, end, mode: "month" };
    }

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return { start, end, mode: "year" };
};

const getChartRangeFromFilter = ({ year, month }) => {
    if (month !== null) {
        const endDate = new Date(year, month, 1);
        const startDate = new Date(year, month - 5, 1);
        return { startDate, endDate, granularity: "month" };
    }

    const endDate = new Date(year + 1, 0, 1);
    const startDate = new Date(year - 4, 0, 1);
    return { startDate, endDate, granularity: "year" };
};

const buildChartPeriods = ({ year, month, granularity }) => {
    const periods = [];

    if (granularity === "year") {
        for (let i = 4; i >= 0; i -= 1) {
            periods.push(new Date(year - i, 0, 1));
        }
        return periods;
    }

    for (let i = 4; i >= 0; i -= 1) {
        periods.push(new Date(year, month - 1 - i, 1));
    }
    return periods;
};

const getPeriodKeyFromDate = (date, granularity) => {
    if (granularity === "year") {
        return `${date.getFullYear()}`;
    }
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
};

const getPeriodKeyFromRow = (periodValue, granularity) => {
    const raw = `${periodValue}`.slice(0, 10);
    return granularity === "year" ? raw.slice(0, 4) : raw.slice(0, 7);
};

const getPeriodLabel = (date, granularity) => {
    if (granularity === "year") {
        return `${date.getFullYear()}`;
    }
    return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
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

        const dashboardFilters = parseDashboardFilters(req.query);
        if (dashboardFilters.error) {
            return res.status(400).json({ message: dashboardFilters.error });
        }

        const id_negocio = idNegocioResult.value;
        const { year, month, day } = dashboardFilters;
        const summaryRange = getSummaryRangeFromFilter({ year, month, day });
        const chartRange = getChartRangeFromFilter({ year, month });
        const expectedPeriods = buildChartPeriods({
            year,
            month,
            granularity: chartRange.granularity,
        });

        const ventasResultQuery = await sequelize.query(
            `SELECT SUM(v.precio_total) as total
             FROM "Venta" v
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND v.fecha >= :startDate AND v.fecha < :endDate`,
            {
                replacements: {
                    id_negocio,
                    startDate: summaryRange.start,
                    endDate: summaryRange.end,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );
        const ventasResult = (ventasResultQuery && ventasResultQuery[0] && ventasResultQuery[0].total) ? Number(ventasResultQuery[0].total) : 0;
        const ingresosTotales = ventasResult || 0;

        const gastosResultQuery = await sequelize.query(
            `SELECT COALESCE(SUM(g.importe), 0) as total
             FROM "Gasto" g
             JOIN "TipoGasto" tg ON g.id_tipo_gasto = tg.id_tipo_gasto
             WHERE tg.id_negocio = :id_negocio AND g.fecha >= :startDate AND g.fecha < :endDate`,
            {
                replacements: {
                    id_negocio,
                    startDate: summaryRange.start,
                    endDate: summaryRange.end,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );
        
        const gastosTotales = Number(gastosResultQuery?.[0]?.total) || 0;

        const comprasResultQuery = await sequelize.query(
            `SELECT COALESCE(SUM(c.importe_total), 0) as total
             FROM "Compra" c
             WHERE c.id_negocio = :id_negocio
               AND c.estado = 'completada'
               AND c.fecha >= :startDate
               AND c.fecha < :endDate`,
            {
                replacements: {
                    id_negocio,
                    startDate: summaryRange.start,
                    endDate: summaryRange.end,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const comprasTotales = Number(comprasResultQuery?.[0]?.total) || 0;

        const numReservasQuery = await sequelize.query(
            `SELECT COUNT(*) as total
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio
               AND r.fecha_hora_inicio >= :startDate
               AND r.fecha_hora_inicio < :endDate`,
            {
                replacements: {
                    id_negocio,
                    startDate: summaryRange.start,
                    endDate: summaryRange.end,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const numReservas = Number(numReservasQuery?.[0]?.total) || 0;

        const numVentasQuery = await sequelize.query(
            `SELECT COUNT(*) as cantidad
             FROM "Venta" v
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND v.fecha >= :startDate AND v.fecha < :endDate`,
            {
                replacements: {
                    id_negocio,
                    startDate: summaryRange.start,
                    endDate: summaryRange.end,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );
        const numVentas = (numVentasQuery && numVentasQuery[0]) ? Number(numVentasQuery[0].cantidad) : 0;

        const truncateUnit = chartRange.granularity === "year" ? "year" : "month";

        const ingresosPorPeriodo = await sequelize.query(
            `SELECT DATE_TRUNC('${truncateUnit}', v.fecha)::DATE as periodo, COALESCE(SUM(v.precio_total), 0) as ingresos
             FROM "Venta" v
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio
               AND v.fecha >= :startDate
               AND v.fecha < :endDate
             GROUP BY DATE_TRUNC('${truncateUnit}', v.fecha)::DATE
             ORDER BY periodo ASC`,
            {
                replacements: {
                    id_negocio,
                    startDate: chartRange.startDate,
                    endDate: chartRange.endDate,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const gastosPorPeriodo = await sequelize.query(
            `SELECT DATE_TRUNC('${truncateUnit}', g.fecha)::DATE as periodo, COALESCE(SUM(g.importe), 0) as gastos
             FROM "Gasto" g
             JOIN "TipoGasto" tg ON g.id_tipo_gasto = tg.id_tipo_gasto
             WHERE tg.id_negocio = :id_negocio
               AND g.fecha >= :startDate
               AND g.fecha < :endDate
             GROUP BY DATE_TRUNC('${truncateUnit}', g.fecha)::DATE
             ORDER BY periodo ASC`,
            {
                replacements: {
                    id_negocio,
                    startDate: chartRange.startDate,
                    endDate: chartRange.endDate,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const comprasPorPeriodo = await sequelize.query(
            `SELECT DATE_TRUNC('${truncateUnit}', c.fecha)::DATE as periodo, COALESCE(SUM(c.importe_total), 0) as compras
             FROM "Compra" c
             WHERE c.id_negocio = :id_negocio
               AND c.estado = 'completada'
               AND c.fecha >= :startDate
               AND c.fecha < :endDate
             GROUP BY DATE_TRUNC('${truncateUnit}', c.fecha)::DATE
             ORDER BY periodo ASC`,
            {
                replacements: {
                    id_negocio,
                    startDate: chartRange.startDate,
                    endDate: chartRange.endDate,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const ingresosMap = new Map(
            ingresosPorPeriodo.map((row) => [
                getPeriodKeyFromRow(row.periodo, chartRange.granularity),
                Number(row.ingresos) || 0,
            ])
        );

        const gastosMap = new Map(
            gastosPorPeriodo.map((row) => [
                getPeriodKeyFromRow(row.periodo, chartRange.granularity),
                Number(row.gastos) || 0,
            ])
        );

        const comprasMap = new Map(
            comprasPorPeriodo.map((row) => [
                getPeriodKeyFromRow(row.periodo, chartRange.granularity),
                Number(row.compras) || 0,
            ])
        );

        const netProfitChart = expectedPeriods.map((periodDate) => {
            const periodKey = getPeriodKeyFromDate(periodDate, chartRange.granularity);
            const ingresos = ingresosMap.get(periodKey) || 0;
            const gastos = gastosMap.get(periodKey) || 0;
            const compras = comprasMap.get(periodKey) || 0;

            return {
                key: periodKey,
                label: getPeriodLabel(periodDate, chartRange.granularity),
                ingresos,
                gastos,
                compras,
                beneficio: ingresos - gastos - compras,
            };
        });

        
        const numClientes = await Cliente.count({
            where: { id_negocio },
        });

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.DASHBOARD_RETRIEVED,
            dashboard: {
                ingresosTotales,
                gastosTotales: gastosTotales + comprasTotales,
                comprasTotales,
                beneficioNeto: ingresosTotales - gastosTotales - comprasTotales,
                numReservas,
                numVentas,
                numClientes
            },
            chart: {
                mode: chartRange.granularity,
                netProfit: netProfitChart,
            },
            filter: {
                year,
                month,
                day,
                summaryMode: summaryRange.mode,
            }
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
            `SELECT ps.id_ps as id_producto, ps.nombre, COUNT(psv.id_ps) as cantidad, SUM(psv.cantidad) as total_cantidad, SUM(ps.precio * psv.cantidad) as ingresos
             FROM "ProductoServicioVenta" psv
             JOIN "Venta" v ON psv.id_venta = v.id_venta
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             JOIN "ProductoServicio" ps ON psv.id_ps = ps.id_ps
             JOIN "Producto" p ON psv.id_ps = p.id_ps
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate AND ps.tipo = 'PRODUCTO'
             GROUP BY ps.id_ps, ps.nombre
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
            `SELECT ps.id_ps as id_servicio, ps.nombre, COUNT(psv.id_ps) as cantidad, SUM(ps.precio) as ingresos
             FROM "ProductoServicioVenta" psv
             JOIN "Venta" v ON psv.id_venta = v.id_venta
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             JOIN "ProductoServicio" ps ON psv.id_ps = ps.id_ps
             JOIN "Servicio" s ON psv.id_ps = s.id_ps
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate AND ps.tipo = 'SERVICIO'
             GROUP BY ps.id_ps, ps.nombre
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

        const dashboardFilters = parseDashboardFilters(req.query);
        if (dashboardFilters.error) {
            return res.status(400).json({ message: dashboardFilters.error });
        }

        const id_negocio = idNegocioResult.value;
        const { year, month } = dashboardFilters;

        // Top 3 servicios más reservados (total del negocio)
        const serviciosMasReservados = await sequelize.query(
            `SELECT ps.id_ps as id_servicio, ps.nombre, COUNT(sr.id_servicio) as cantidad
             FROM "ServicioReserva" sr
             JOIN "Reserva" r ON sr.id_reserva = r.id_reserva
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             JOIN "Servicio" s ON sr.id_servicio = s.id_ps
             JOIN "ProductoServicio" ps ON s.id_ps = ps.id_ps
             WHERE c.id_negocio = :id_negocio
             GROUP BY ps.id_ps, ps.nombre
             ORDER BY cantidad DESC
             LIMIT 3`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        // Top 3 meses más reservados del año seleccionado
        const mesesMasReservados = await sequelize.query(
            `SELECT DATE_TRUNC('month', r.fecha_hora_inicio)::DATE as mes, 
                    TO_CHAR(DATE_TRUNC('month', r.fecha_hora_inicio), 'Mon') as label,
                    COUNT(r.id_reserva) as cantidad
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio
               AND EXTRACT(YEAR FROM r.fecha_hora_inicio) = :year
             GROUP BY DATE_TRUNC('month', r.fecha_hora_inicio)
             ORDER BY cantidad DESC
             LIMIT 3`,
            {
                replacements: { id_negocio, year },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        // Mapear meses a formato consistente
        const mesesFormateados = mesesMasReservados.map((row) => ({
            key: row.mes,
            label: row.label,
            cantidad: Number(row.cantidad),
        }));

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.RESERVA_STATS_RETRIEVED,
            reservaStats: {
                serviciosMasReservados,
                mesesMasReservados: mesesFormateados,
            },
            filter: {
                year,
                month,
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
                `SELECT ps.id_ps as id_producto, ps.nombre, SUM(psv.cantidad) as cantidad_vendida, SUM(ps.precio * psv.cantidad) as facturacion
                 FROM "ProductoServicioVenta" psv
                 JOIN "Venta" v ON psv.id_venta = v.id_venta
                 JOIN "Cliente" c ON v.id_cliente = c.id_cliente
                 JOIN "ProductoServicio" ps ON psv.id_ps = ps.id_ps
                 JOIN "Producto" p ON psv.id_ps = p.id_ps
                 JOIN "Proveedor" pr ON p.id_proveedor = pr.id_proveedor
                 WHERE c.id_negocio = :id_negocio AND pr.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate AND ps.tipo = 'PRODUCTO'
                 GROUP BY ps.id_ps, ps.nombre
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

            const productosMenosVendidos = await sequelize.query(
                `SELECT ps.id_ps as id_producto, ps.nombre, SUM(psv.cantidad) as cantidad_vendida, SUM(ps.precio * psv.cantidad) as facturacion
                 FROM "ProductoServicioVenta" psv
                 JOIN "Venta" v ON psv.id_venta = v.id_venta
                 JOIN "Cliente" c ON v.id_cliente = c.id_cliente
                 JOIN "ProductoServicio" ps ON psv.id_ps = ps.id_ps
                 JOIN "Producto" p ON psv.id_ps = p.id_ps
                 JOIN "Proveedor" pr ON p.id_proveedor = pr.id_proveedor
                 WHERE c.id_negocio = :id_negocio AND pr.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate AND ps.tipo = 'PRODUCTO'
                 GROUP BY ps.id_ps, ps.nombre
                 ORDER BY cantidad_vendida ASC
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
                productosMenosVendidos,
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

            const serviciosMasVendidos = await sequelize.query(
                `SELECT ps.id_ps as id_servicio, ps.nombre, COUNT(psv.id_ps) as cantidad_ventas, SUM(ps.precio) as facturacion_total
                 FROM "ProductoServicioVenta" psv
                 JOIN "Venta" v ON psv.id_venta = v.id_venta
                 JOIN "Cliente" c ON v.id_cliente = c.id_cliente
                 JOIN "Servicio" s ON psv.id_ps = s.id_ps
                 JOIN "ProductoServicio" ps ON s.id_ps = ps.id_ps
                 WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate AND ps.tipo = 'SERVICIO'
                    AND NOT EXISTS (
                        SELECT 1
                        FROM "ServicioReserva" sr
                        WHERE sr.id_servicio = s.id_ps
                    )
                 GROUP BY ps.id_ps, ps.nombre
             ORDER BY cantidad_ventas DESC
             LIMIT 15`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const serviciosMenosVendidos = await sequelize.query(
            `SELECT ps.id_ps as id_servicio, ps.nombre, COUNT(psv.id_ps) as cantidad_ventas, SUM(ps.precio) as facturacion_total
             FROM "ProductoServicioVenta" psv
             JOIN "Venta" v ON psv.id_venta = v.id_venta
             JOIN "Servicio" s ON psv.id_ps = s.id_ps
             JOIN "ProductoServicio" ps ON s.id_ps = ps.id_ps
             JOIN "Cliente" c ON v.id_cliente = c.id_cliente
             WHERE c.id_negocio = :id_negocio AND v.fecha BETWEEN :startDate AND :endDate AND ps.tipo = 'SERVICIO'
                AND NOT EXISTS (
                    SELECT 1
                    FROM "ServicioReserva" sr
                    WHERE sr.id_servicio = s.id_ps
                )
             GROUP BY ps.id_ps, ps.nombre
             ORDER BY cantidad_ventas ASC
             LIMIT 15`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.SERVICE_STATS_RETRIEVED,
            serviceStats: {
                serviciosMasVendidos,
                serviciosMenosVendidos,
            },
        });
    } catch (error) {
        console.error("Error en getServiceStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getGastoStats = async (req, res) => {
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

        const dashboardFilters = parseDashboardFilters(req.query);
        if (dashboardFilters.error) {
            return res.status(400).json({ message: dashboardFilters.error });
        }

        const id_negocio = idNegocioResult.value;
        const { year, month } = dashboardFilters;
        const chartRange = getChartRangeFromFilter({ year, month });
        const expectedPeriods = buildChartPeriods({ year, month, granularity: chartRange.granularity });

        const truncateUnit = chartRange.granularity === "year" ? "year" : "month";

        const gastosPorPeriodo = await sequelize.query(
            `SELECT DATE_TRUNC('${truncateUnit}', g.fecha)::DATE as periodo, COALESCE(SUM(g.importe), 0) as gastos
             FROM "Gasto" g
             JOIN "TipoGasto" tg ON g.id_tipo_gasto = tg.id_tipo_gasto
             WHERE tg.id_negocio = :id_negocio
               AND g.fecha >= :startDate
               AND g.fecha < :endDate
             GROUP BY DATE_TRUNC('${truncateUnit}', g.fecha)::DATE
             ORDER BY periodo ASC`,
            {
                replacements: {
                    id_negocio,
                    startDate: chartRange.startDate,
                    endDate: chartRange.endDate,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const gastosMap = new Map(
            gastosPorPeriodo.map((row) => [
                getPeriodKeyFromRow(row.periodo, chartRange.granularity),
                Number(row.gastos) || 0,
            ])
        );

        const gastosChart = expectedPeriods.map((periodDate) => {
            const periodKey = getPeriodKeyFromDate(periodDate, chartRange.granularity);
            const gastos = gastosMap.get(periodKey) || 0;
            return {
                key: periodKey,
                label: getPeriodLabel(periodDate, chartRange.granularity),
                gastos,
            };
        });

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.GASTO_STATS_RETRIEVED,
            gastoChart: {
                mode: chartRange.granularity,
                gastos: gastosChart,
            },
            filter: { year, month },
        });
    } catch (error) {
        console.error("Error en getGastoStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getResourceStats = async (req, res) => {
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

        const recursosMasUsados = await sequelize.query(
            `SELECT rc.id_recurso, rc.nombre, COUNT(r.id_reserva) as cantidad
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             JOIN "Recurso" rc ON r.id_recurso = rc.id_recurso
             WHERE c.id_negocio = :id_negocio AND rc.id_negocio = :id_negocio
               AND r.fecha_hora_inicio BETWEEN :startDate AND :endDate
             GROUP BY rc.id_recurso, rc.nombre
             ORDER BY cantidad DESC
             LIMIT 3`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const recursosMenosUsados = await sequelize.query(
            `SELECT rc.id_recurso, rc.nombre, COUNT(r.id_reserva) as cantidad
             FROM "Reserva" r
             JOIN "Cliente" c ON r.id_cliente = c.id_cliente
             JOIN "Recurso" rc ON r.id_recurso = rc.id_recurso
             WHERE c.id_negocio = :id_negocio AND rc.id_negocio = :id_negocio
               AND r.fecha_hora_inicio BETWEEN :startDate AND :endDate
             GROUP BY rc.id_recurso, rc.nombre
             ORDER BY cantidad ASC
             LIMIT 3`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return res.status(200).json({
            message: ESTADISTICAS_MESSAGES.RESOURCE_STATS_RETRIEVED,
            resourceStats: {
                recursosMasUsados,
                recursosMenosUsados,
            },
        });
    } catch (error) {
        console.error("Error en getResourceStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getCompraStats = async (req, res) => {
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

        const dashboardFilters = parseDashboardFilters(req.query);
        if (dashboardFilters.error) {
            return res.status(400).json({ message: dashboardFilters.error });
        }
        const { year, month } = dashboardFilters;
        const chartRange = getChartRangeFromFilter({ year, month });
        const expectedPeriods = buildChartPeriods({ year, month, granularity: chartRange.granularity });
        const truncateUnit = chartRange.granularity === "year" ? "year" : "month";

        const comprasPorDia = await sequelize.query(
            `SELECT DATE(c.fecha) as fecha, COUNT(*) as cantidad, COALESCE(SUM(c.importe_total), 0) as total
             FROM "Compra" c
             WHERE c.id_negocio = :id_negocio AND c.fecha BETWEEN :startDate AND :endDate
             GROUP BY DATE(c.fecha)
             ORDER BY fecha ASC`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const comprasPorEstado = await sequelize.query(
            `SELECT c.estado, COUNT(*) as cantidad, COALESCE(SUM(c.importe_total), 0) as total
             FROM "Compra" c
             WHERE c.id_negocio = :id_negocio AND c.fecha BETWEEN :startDate AND :endDate
             GROUP BY c.estado
             ORDER BY cantidad DESC`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const productosMasComprados = await sequelize.query(
            `SELECT ps.id_ps as id_producto, ps.nombre, SUM(cp.cantidad_esperada) as cantidad_esperada, SUM(cp.cantidad_llegada) as cantidad_llegada, SUM(c.importe_total) as importe_total
             FROM "CompraProducto" cp
             JOIN "Compra" c ON cp.id_compra = c.id_compra
             JOIN "Producto" p ON cp.id_producto = p.id_ps
             JOIN "ProductoServicio" ps ON p.id_ps = ps.id_ps
             WHERE c.id_negocio = :id_negocio AND c.fecha BETWEEN :startDate AND :endDate
             GROUP BY ps.id_ps, ps.nombre
             ORDER BY cantidad_esperada DESC
             LIMIT 15`,
            {
                replacements: { id_negocio, startDate: rangeStart, endDate: rangeEnd },
                type: sequelize.QueryTypes.SELECT,
            }
        );

            const comprasPorPeriodo = await sequelize.query(
                `SELECT DATE_TRUNC('${truncateUnit}', c.fecha)::DATE as periodo, COALESCE(SUM(c.importe_total), 0) as compras
                 FROM "Compra" c
                 WHERE c.id_negocio = :id_negocio
                   AND c.estado = 'completada'
                   AND c.fecha >= :startDate
                   AND c.fecha < :endDate
                 GROUP BY DATE_TRUNC('${truncateUnit}', c.fecha)::DATE
                 ORDER BY periodo ASC`,
                {
                    replacements: {
                        id_negocio,
                        startDate: chartRange.startDate,
                        endDate: chartRange.endDate,
                    },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const comprasMap = new Map(
                comprasPorPeriodo.map((row) => [
                    getPeriodKeyFromRow(row.periodo, chartRange.granularity),
                    Number(row.compras) || 0,
                ])
            );

            const compraChart = expectedPeriods.map((periodDate) => {
                const periodKey = getPeriodKeyFromDate(periodDate, chartRange.granularity);
                const compras = comprasMap.get(periodKey) || 0;
                return {
                    key: periodKey,
                    label: getPeriodLabel(periodDate, chartRange.granularity),
                    compras,
                };
            });

            const proveedoresTop = await sequelize.query(
                `SELECT p.id_proveedor, p.nombre, COUNT(DISTINCT c.id_compra) as cantidad, COALESCE(SUM(c.importe_total),0) as total
                 FROM "Compra" c
                 JOIN "CompraProducto" cp ON c.id_compra = cp.id_compra
                 JOIN "Producto" pr ON cp.id_producto = pr.id_ps
                 JOIN "Proveedor" p ON pr.id_proveedor = p.id_proveedor
                 WHERE c.id_negocio = :id_negocio
                   AND c.estado = 'completada'
                   AND c.fecha >= :startDate
                   AND c.fecha < :endDate
                 GROUP BY p.id_proveedor, p.nombre
                 ORDER BY cantidad DESC
                 LIMIT 3`,
                {
                    replacements: {
                        id_negocio,
                        startDate: chartRange.startDate,
                        endDate: chartRange.endDate,
                    },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            return res.status(200).json({
                message: ESTADISTICAS_MESSAGES.PURCHASE_STATS_RETRIEVED,
                purchaseStats: {
                    comprasPorDia,
                    comprasPorEstado,
                    productosMasComprados,
                },
                compraChart: {
                    mode: chartRange.granularity,
                    compras: compraChart,
                },
                proveedoresTop,
                filter: { year, month },
            });
    } catch (error) {
        console.error("Error en getCompraStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};

export const getClientStats = async (req, res) => {
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

        // Top 3 clientes por dinero gastado (ventas + reservas)
        const clientesPorGasto = await sequelize.query(
            `SELECT c.id_cliente, c.nombre, c.apellido1,
                    COALESCE(SUM(v.precio_total), 0) as ventas_total,
                          COALESCE(SUM(ps.precio), 0) as reservas_total,
                          COALESCE(SUM(v.precio_total), 0) + COALESCE(SUM(ps.precio), 0) as total_gastado
             FROM "Cliente" c
             LEFT JOIN "Venta" v ON c.id_cliente = v.id_cliente
             LEFT JOIN "Reserva" r ON c.id_cliente = r.id_cliente
             LEFT JOIN "ServicioReserva" sr ON r.id_reserva = sr.id_reserva
                      LEFT JOIN "Servicio" s ON sr.id_servicio = s.id_ps
                      LEFT JOIN "ProductoServicio" ps ON s.id_ps = ps.id_ps
             WHERE c.id_negocio = :id_negocio
             GROUP BY c.id_cliente, c.nombre, c.apellido1
             ORDER BY total_gastado DESC
             LIMIT 3`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const clientesPorReservas = await sequelize.query(
            `SELECT c.id_cliente, c.nombre, c.apellido1, COUNT(r.id_reserva) as num_reservas
             FROM "Cliente" c
             JOIN "Reserva" r ON c.id_cliente = r.id_cliente
             WHERE c.id_negocio = :id_negocio
             GROUP BY c.id_cliente, c.nombre, c.apellido1
             ORDER BY num_reservas DESC
             LIMIT 3`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const clientesPorVentas = await sequelize.query(
            `SELECT c.id_cliente, c.nombre, c.apellido1, COUNT(psv.id_ps) as num_productos_vendidos
             FROM "Cliente" c
             JOIN "Venta" v ON c.id_cliente = v.id_cliente
             JOIN "ProductoServicioVenta" psv ON v.id_venta = psv.id_venta
             JOIN "ProductoServicio" ps ON psv.id_ps = ps.id_ps
             WHERE c.id_negocio = :id_negocio AND ps.tipo = 'PRODUCTO'
             GROUP BY c.id_cliente, c.nombre, c.apellido1
             ORDER BY num_productos_vendidos DESC
             LIMIT 3`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const clientesPorCanceladas = await sequelize.query(
            `SELECT c.id_cliente, c.nombre, c.apellido1, COUNT(r.id_reserva) as num_canceladas
             FROM "Cliente" c
             JOIN "Reserva" r ON c.id_cliente = r.id_cliente
             WHERE c.id_negocio = :id_negocio AND r.estado = 'cancelada'
             GROUP BY c.id_cliente, c.nombre, c.apellido1
             ORDER BY num_canceladas DESC
             LIMIT 3`,
            {
                replacements: { id_negocio },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return res.status(200).json({
            message: "Client stats retrieved successfully",
            clientStats: {
                clientesPorGasto,
                clientesPorReservas,
                clientesPorVentas,
                clientesPorCanceladas,
            },
        });
    } catch (error) {
        console.error("Error en getClientStats:", error);
        return res.status(500).json({ message: ESTADISTICAS_ERRORS.SERVER_ERROR });
    }
};
