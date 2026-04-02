import { Op } from "sequelize";
import { sequelize } from "../../models/db.js";
import { Compra } from "../../models/Compra.js";
import { CompraProducto } from "../../models/CompraProducto.js";
import { Producto } from "../../models/Producto.js";
import { Proveedor } from "../../models/Proveedor.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { COMPRA_ERRORS, COMPRA_MESSAGES, COMPRA_ROLES } from "./constants.js";

const INTEGER_REGEX = /^\d+$/;

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
    if (!fecha) {
        return new Date();
    }

    const parsedDate = new Date(fecha);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
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
    const descripcion = typeof req.body?.descripcion === "string"
        ? req.body.descripcion.trim() || null
        : null;

    if (!id_usuario) {
        return res.status(401).json({ message: COMPRA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!idNegocio || idNegocio <= 0) {
        return res.status(400).json({ message: COMPRA_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    const fecha = normalizeFecha(req.body?.fecha);

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
