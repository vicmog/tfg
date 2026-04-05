import { Op } from "sequelize";
import { sequelize } from "../../models/db.js";
import { Compra } from "../../models/Compra.js";
import { CompraProducto } from "../../models/CompraProducto.js";
import { Producto } from "../../models/Producto.js";
import { Proveedor } from "../../models/Proveedor.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { COMPRA_ERRORS, COMPRA_MESSAGES, COMPRA_ROLES } from "./constants.js";

const INTEGER_REGEX = /^\d+$/;
const VALID_SORT_BY = ["fecha", "importe_total", "estado", "proveedor"];
const VALID_SORT_ORDER = ["asc", "desc"];

const canManageCompras = (rol) => [COMPRA_ROLES.ADMIN, COMPRA_ROLES.JEFE].includes(rol);

const serializeCompra = (compra, productos) => ({
    id_compra: compra.id_compra,
    id_negocio: compra.id_negocio,
    descripcion: compra.descripcion,
    fecha: compra.fecha,
    importe_total: compra.importe_total,
    estado: compra.estado,
    productos,
});

const parseInteger = (value) => {
    const normalized = `${value ?? ""}`.trim();

    if (!INTEGER_REGEX.test(normalized)) {
        return null;
    }

    const parsed = Number.parseInt(normalized, 10);

    return Number.isInteger(parsed) ? parsed : null;
};

const normalizeFecha = (fecha) => {
    const parsedDate = new Date(fecha);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};

const normalizeDateFilter = (fecha) => {
    const normalized = `${fecha ?? ""}`.trim();

    if (!normalized) {
        return null;
    }

    const parsed = normalizeFecha(normalized);

    if (!parsed) {
        return { error: COMPRA_ERRORS.FECHA_FILTER_INVALID };
    }

    const dateOnly = parsed.toISOString().slice(0, 10);
    const start = new Date(`${dateOnly}T00:00:00.000Z`);
    const end = new Date(`${dateOnly}T23:59:59.999Z`);

    return { value: { start, end } };
};

const normalizePositiveInteger = (value, errorMessage) => {
    const parsed = parseInteger(value);

    if (!parsed || parsed <= 0) {
        return { error: errorMessage };
    }

    return { value: parsed };
};

const buildCompraRelations = async (compraIds) => {
    if (!compraIds.length) {
        return {
            productosByCompra: new Map(),
            proveedoresByCompra: new Map(),
            proveedorPrincipalByCompra: new Map(),
        };
    }

    const compraProductos = await CompraProducto.findAll({
        where: {
            id_compra: {
                [Op.in]: compraIds,
            },
        },
    });

    const productoIds = [...new Set(compraProductos.map((item) => item.id_producto))];
    const productos = productoIds.length
        ? await Producto.findAll({
            where: {
                id_producto: {
                    [Op.in]: productoIds,
                },
            },
            attributes: ["id_producto", "id_proveedor", "nombre"],
        })
        : [];

    const providerIds = [...new Set(productos.map((producto) => producto.id_proveedor))];
    const proveedores = providerIds.length
        ? await Proveedor.findAll({
            where: {
                id_proveedor: {
                    [Op.in]: providerIds,
                },
            },
            attributes: ["id_proveedor", "nombre"],
        })
        : [];

    const productoMap = new Map(productos.map((producto) => [producto.id_producto, producto]));
    const proveedorMap = new Map(proveedores.map((proveedor) => [proveedor.id_proveedor, proveedor]));

    const productosByCompra = new Map();
    const proveedoresByCompra = new Map();
    const proveedorPrincipalByCompra = new Map();

    for (const item of compraProductos) {
        if (!productosByCompra.has(item.id_compra)) {
            productosByCompra.set(item.id_compra, []);
        }

        const producto = productoMap.get(item.id_producto);
        const proveedor = producto ? proveedorMap.get(producto.id_proveedor) : null;

        productosByCompra.get(item.id_compra).push({
            id_producto: item.id_producto,
            nombre: producto?.nombre || null,
            id_proveedor: producto?.id_proveedor || null,
            proveedor_nombre: proveedor?.nombre || null,
            cantidad_esperada: item.cantidad_esperada,
            cantidad_llegada: item.cantidad_llegada,
        });

        if (!proveedoresByCompra.has(item.id_compra)) {
            proveedoresByCompra.set(item.id_compra, new Set());
        }

        if (proveedor?.nombre) {
            proveedoresByCompra.get(item.id_compra).add(proveedor.nombre);
        }
    }

    for (const [idCompra, providerSet] of proveedoresByCompra.entries()) {
        const providerNames = [...providerSet];
        let proveedorPrincipal = null;

        if (providerNames.length === 1) {
            [proveedorPrincipal] = providerNames;
        } else if (providerNames.length > 1) {
            proveedorPrincipal = "Varios proveedores";
        }

        proveedoresByCompra.set(idCompra, providerNames);
        proveedorPrincipalByCompra.set(idCompra, proveedorPrincipal);
    }

    return {
        productosByCompra,
        proveedoresByCompra,
        proveedorPrincipalByCompra,
    };
};

const ensureNegocioAccess = async (idUsuario, idNegocio) => {
    if (!idUsuario) {
        return { status: 401, message: COMPRA_ERRORS.USER_NOT_AUTHENTICATED };
    }

    if (!idNegocio || idNegocio <= 0) {
        return { status: 400, message: COMPRA_ERRORS.NEGOCIO_ID_REQUIRED };
    }

    const usuarioNegocio = await UsuarioNegocio.findOne({
        where: { id_usuario: idUsuario, id_negocio: idNegocio },
    });

    if (!usuarioNegocio) {
        return { status: 403, message: COMPRA_ERRORS.NO_ACCESS_TO_NEGOCIO };
    }

    return { usuarioNegocio };
};

const normalizeProductos = (productos) => {
    if (!Array.isArray(productos) || !productos.length) {
        return { error: COMPRA_ERRORS.PRODUCTOS_REQUIRED };
    }

    const normalizedProductos = [];
    const duplicatedGuard = new Set();

    for (const producto of productos) {
        const idProducto = parseInteger(producto?.id_producto);

        if (!idProducto || idProducto <= 0) {
            return { error: COMPRA_ERRORS.PRODUCTO_ID_REQUIRED };
        }

        if (duplicatedGuard.has(idProducto)) {
            return { error: COMPRA_ERRORS.PRODUCTOS_DUPLICATED };
        }

        const cantidadEsperada = parseInteger(producto?.cantidad_esperada);

        if (!cantidadEsperada || cantidadEsperada <= 0) {
            return { error: COMPRA_ERRORS.CANTIDAD_ESPERADA_REQUIRED };
        }

        const cantidadLlegadaRaw = producto?.cantidad_llegada ?? 0;
        const cantidadLlegada = parseInteger(cantidadLlegadaRaw);

        if (cantidadLlegada === null || cantidadLlegada < 0) {
            return { error: COMPRA_ERRORS.CANTIDAD_LLEGADA_INVALID };
        }

        if (cantidadLlegada > cantidadEsperada) {
            return { error: COMPRA_ERRORS.CANTIDAD_LLEGADA_EXCEEDS };
        }

        duplicatedGuard.add(idProducto);
        normalizedProductos.push({
            id_producto: idProducto,
            cantidad_esperada: cantidadEsperada,
            cantidad_llegada: cantidadLlegada,
        });
    }

    return { value: normalizedProductos };
};

export const createCompra = async (req, res) => {
    const id_usuario = req.user?.id_usuario;
    const idNegocio = parseInteger(req.body?.id_negocio);
    const fechaRaw = typeof req.body?.fecha === "string" ? req.body.fecha.trim() : "";
    const descripcion = typeof req.body?.descripcion === "string"
        ? req.body.descripcion.trim() || null
        : null;

    if (!id_usuario) {
        return res.status(401).json({ message: COMPRA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!idNegocio || idNegocio <= 0) {
        return res.status(400).json({ message: COMPRA_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    if (!fechaRaw) {
        return res.status(400).json({ message: COMPRA_ERRORS.FECHA_REQUIRED });
    }

    const fecha = normalizeFecha(fechaRaw);

    if (!fecha) {
        return res.status(400).json({ message: COMPRA_ERRORS.FECHA_INVALID });
    }

    const productosResult = normalizeProductos(req.body?.productos);

    if (productosResult.error) {
        return res.status(400).json({ message: productosResult.error });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: idNegocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: COMPRA_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageCompras(usuarioNegocio.rol)) {
            return res.status(403).json({ message: COMPRA_ERRORS.NO_MANAGE_PERMISSION });
        }

        const productIds = productosResult.value.map((producto) => producto.id_producto);
        const productos = await Producto.findAll({
            where: {
                id_producto: {
                    [Op.in]: productIds,
                },
            },
        });

        if (productos.length !== productIds.length) {
            return res.status(400).json({ message: COMPRA_ERRORS.PRODUCTOS_NOT_FOUND });
        }

        const providerIds = [...new Set(productos.map((producto) => producto.id_proveedor))];
        const proveedores = await Proveedor.findAll({
            where: {
                id_proveedor: {
                    [Op.in]: providerIds,
                },
            },
            attributes: ["id_proveedor", "id_negocio"],
        });

        const providerMap = new Map(proveedores.map((proveedor) => [proveedor.id_proveedor, proveedor.id_negocio]));

        for (const producto of productos) {
            const providerBusinessId = providerMap.get(producto.id_proveedor);

            if (!providerBusinessId) {
                return res.status(400).json({ message: COMPRA_ERRORS.PRODUCTOS_WITHOUT_PROVIDER });
            }

            if (providerBusinessId !== idNegocio) {
                return res.status(400).json({ message: COMPRA_ERRORS.PRODUCTOS_NOT_IN_NEGOCIO });
            }
        }

        const cantidadMap = new Map(
            productosResult.value.map((producto) => [producto.id_producto, producto])
        );

        const importeTotal = productos.reduce((acc, producto) => {
            const productoCompra = cantidadMap.get(producto.id_producto);
            return acc + (producto.precio_compra * productoCompra.cantidad_esperada);
        }, 0);

        const compra = await sequelize.transaction(async (transaction) => {
            const createdCompra = await Compra.create(
                {
                    id_negocio: idNegocio,
                    descripcion,
                    fecha,
                    importe_total: Number(importeTotal.toFixed(2)),
                    estado: "pendiente",
                },
                { transaction }
            );

            await CompraProducto.bulkCreate(
                productosResult.value.map((producto) => ({
                    id_compra: createdCompra.id_compra,
                    id_producto: producto.id_producto,
                    cantidad_esperada: producto.cantidad_esperada,
                    cantidad_llegada: producto.cantidad_llegada,
                })),
                { transaction }
            );

            return createdCompra;
        });

        const productosSerialized = productos.map((producto) => {
            const productoCompra = cantidadMap.get(producto.id_producto);

            return {
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                cantidad_esperada: productoCompra.cantidad_esperada,
                cantidad_llegada: productoCompra.cantidad_llegada,
            };
        });

        return res.status(201).json({
            message: COMPRA_MESSAGES.COMPRA_CREATED,
            compra: serializeCompra(compra, productosSerialized),
        });
    } catch (error) {
        return res.status(500).json({ message: COMPRA_ERRORS.SERVER_ERROR });
    }
};

export const getCompras = async (req, res) => {
    const idUsuario = req.user?.id_usuario;
    const idNegocio = parseInteger(req.query?.id_negocio);
    const pageRaw = req.query?.page ?? "1";
    const limitRaw = req.query?.limit ?? "20";
    const sortBy = `${req.query?.sort_by ?? "fecha"}`.trim().toLowerCase();
    const sortOrder = `${req.query?.sort_order ?? "desc"}`.trim().toLowerCase();
    const proveedorFilter = `${req.query?.proveedor ?? ""}`.trim().toLowerCase();

    const accessResult = await ensureNegocioAccess(idUsuario, idNegocio);

    if (accessResult.status) {
        return res.status(accessResult.status).json({ message: accessResult.message });
    }

    const pageResult = normalizePositiveInteger(pageRaw, COMPRA_ERRORS.PAGE_INVALID);
    if (pageResult.error) {
        return res.status(400).json({ message: pageResult.error });
    }

    const limitResult = normalizePositiveInteger(limitRaw, COMPRA_ERRORS.LIMIT_INVALID);
    if (limitResult.error || limitResult.value > 100) {
        return res.status(400).json({ message: COMPRA_ERRORS.LIMIT_INVALID });
    }

    if (!VALID_SORT_BY.includes(sortBy)) {
        return res.status(400).json({ message: COMPRA_ERRORS.SORT_BY_INVALID });
    }

    if (!VALID_SORT_ORDER.includes(sortOrder)) {
        return res.status(400).json({ message: COMPRA_ERRORS.SORT_ORDER_INVALID });
    }

    const fechaFilterResult = normalizeDateFilter(req.query?.fecha);
    if (fechaFilterResult?.error) {
        return res.status(400).json({ message: fechaFilterResult.error });
    }

    const page = pageResult.value;
    const limit = limitResult.value;
    const offset = (page - 1) * limit;

    const where = {
        id_negocio: idNegocio,
    };

    if (fechaFilterResult?.value) {
        where.fecha = {
            [Op.between]: [fechaFilterResult.value.start, fechaFilterResult.value.end],
        };
    }

    try {
        if (sortBy !== "proveedor" && !proveedorFilter) {
            const dbSortField = sortBy === "fecha" ? "fecha" : sortBy;
            const { rows, count } = await Compra.findAndCountAll({
                where,
                order: [
                    [dbSortField, sortOrder.toUpperCase()],
                    ["id_compra", "DESC"],
                ],
                offset,
                limit,
            });

            const compraIds = rows.map((compra) => compra.id_compra);
            const relations = await buildCompraRelations(compraIds);

            const compras = rows.map((compra) => {
                const proveedorPrincipal = relations.proveedorPrincipalByCompra.get(compra.id_compra) || null;
                const proveedores = relations.proveedoresByCompra.get(compra.id_compra) || [];

                return {
                    id_compra: compra.id_compra,
                    id_negocio: compra.id_negocio,
                    descripcion: compra.descripcion,
                    fecha: compra.fecha,
                    importe_total: compra.importe_total,
                    estado: compra.estado,
                    proveedor: proveedorPrincipal,
                    proveedores,
                };
            });

            return res.status(200).json({
                message: COMPRA_MESSAGES.COMPRAS_LISTED,
                compras,
                pagination: {
                    page,
                    limit,
                    total: count,
                    has_more: offset + compras.length < count,
                },
            });
        }

        const allCompras = await Compra.findAll({
            where,
            order: [["fecha", "DESC"], ["id_compra", "DESC"]],
        });

        const relations = await buildCompraRelations(allCompras.map((compra) => compra.id_compra));

        const enrichedCompras = allCompras
            .map((compra) => {
                const proveedorPrincipal = relations.proveedorPrincipalByCompra.get(compra.id_compra) || "";
                const proveedores = relations.proveedoresByCompra.get(compra.id_compra) || [];

                if (proveedorFilter && !proveedores.some((providerName) => providerName.toLowerCase().includes(proveedorFilter))) {
                    return null;
                }

                return {
                    id_compra: compra.id_compra,
                    id_negocio: compra.id_negocio,
                    descripcion: compra.descripcion,
                    fecha: compra.fecha,
                    importe_total: compra.importe_total,
                    estado: compra.estado,
                    proveedor: proveedorPrincipal || null,
                    proveedores,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const byName = a.proveedor.localeCompare(b.proveedor, "es", { sensitivity: "base" });
                return sortOrder === "asc" ? byName : -byName;
            });

        const paginatedCompras = enrichedCompras.slice(offset, offset + limit);

        return res.status(200).json({
            message: COMPRA_MESSAGES.COMPRAS_LISTED,
            compras: paginatedCompras,
            pagination: {
                page,
                limit,
                total: enrichedCompras.length,
                has_more: offset + paginatedCompras.length < enrichedCompras.length,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: COMPRA_ERRORS.SERVER_ERROR });
    }
};

export const getCompraById = async (req, res) => {
    const idUsuario = req.user?.id_usuario;
    const idCompraResult = normalizePositiveInteger(req.params?.id_compra, COMPRA_ERRORS.COMPRA_ID_REQUIRED);

    if (idCompraResult.error) {
        return res.status(400).json({ message: idCompraResult.error });
    }

    try {
        const compra = await Compra.findOne({
            where: {
                id_compra: idCompraResult.value,
            },
        });

        if (!compra) {
            return res.status(404).json({ message: COMPRA_ERRORS.COMPRA_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(idUsuario, compra.id_negocio);
        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        const relations = await buildCompraRelations([compra.id_compra]);
        const productos = relations.productosByCompra.get(compra.id_compra) || [];
        const proveedores = relations.proveedoresByCompra.get(compra.id_compra) || [];

        return res.status(200).json({
            message: COMPRA_MESSAGES.COMPRA_FOUND,
            compra: {
                id_compra: compra.id_compra,
                id_negocio: compra.id_negocio,
                descripcion: compra.descripcion,
                fecha: compra.fecha,
                importe_total: compra.importe_total,
                estado: compra.estado,
                proveedor: relations.proveedorPrincipalByCompra.get(compra.id_compra) || null,
                proveedores,
                productos,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: COMPRA_ERRORS.SERVER_ERROR });
    }
};

export const deleteCompra = async (req, res) => {
    const idUsuario = req.user?.id_usuario;
    const idCompraResult = normalizePositiveInteger(req.params?.id_compra, COMPRA_ERRORS.COMPRA_ID_REQUIRED);

    if (idCompraResult.error) {
        return res.status(400).json({ message: idCompraResult.error });
    }

    try {
        const compra = await Compra.findOne({
            where: {
                id_compra: idCompraResult.value,
            },
        });

        if (!compra) {
            return res.status(404).json({ message: COMPRA_ERRORS.COMPRA_NOT_FOUND });
        }

        const accessResult = await ensureNegocioAccess(idUsuario, compra.id_negocio);
        if (accessResult.status) {
            return res.status(accessResult.status).json({ message: accessResult.message });
        }

        if (!canManageCompras(accessResult.usuarioNegocio.rol)) {
            return res.status(403).json({ message: COMPRA_ERRORS.NO_MANAGE_PERMISSION });
        }

        await compra.destroy();

        return res.status(200).json({ message: COMPRA_MESSAGES.COMPRA_DELETED });
    } catch (error) {
        return res.status(500).json({ message: COMPRA_ERRORS.SERVER_ERROR });
    }
};
