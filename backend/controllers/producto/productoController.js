import { Producto } from "../../models/Producto.js";
import { Proveedor } from "../../models/Proveedor.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { Op } from "sequelize";
import {
    PRODUCTO_ERRORS,
    PRODUCTO_MESSAGES,
    PRODUCTO_ROLES,
} from "./constants.js";

const canManageProductos = (rol) => [PRODUCTO_ROLES.ADMIN, PRODUCTO_ROLES.JEFE].includes(rol);
const PRICE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;
const INTEGER_REGEX = /^\d+$/;

const normalizePrice = (value, requiredError, invalidError) => {
    const priceValue = `${value ?? ""}`.trim();

    if (!priceValue) {
        return { error: requiredError };
    }

    if (!PRICE_REGEX.test(priceValue)) {
        return { error: invalidError };
    }

    const parsedPrice = Number.parseFloat(priceValue.replace(",", "."));

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return { error: invalidError };
    }

    return { value: parsedPrice };
};

const normalizeStock = (value, requiredError, invalidError, isRequired = true) => {
    const stockValue = `${value ?? ""}`.trim();

    if (!stockValue) {
        if (!isRequired) {
            return { value: 0 };
        }

        return { error: requiredError };
    }

    if (!INTEGER_REGEX.test(stockValue)) {
        return { error: invalidError };
    }

    const parsedStock = Number.parseInt(stockValue, 10);

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return { error: invalidError };
    }

    return { value: parsedStock };
};

const serializeProducto = (producto) => ({
    id_producto: producto.id_producto,
    id_proveedor: producto.id_proveedor,
    nombre: producto.nombre,
    referencia: producto.referencia,
    descripcion: producto.descripcion,
    categoria: producto.categoria,
    precio_compra: producto.precio_compra,
    precio_venta: producto.precio_venta,
    stock: producto.stock,
    stock_minimo: producto.stock_minimo,
});

const validateProductoFields = ({
    nombre,
    referencia,
    id_proveedor,
    categoria,
    precio_compra,
    precio_venta,
    stock,
    stock_minimo,
    descripcion,
}) => {
    const nombreValue = typeof nombre === "string" ? nombre.trim() : "";
    const referenciaValue = typeof referencia === "string" ? referencia.trim() : "";
    const categoriaValue = typeof categoria === "string" ? categoria.trim() : "";
    const proveedorValue = `${id_proveedor ?? ""}`.trim();

    if (!nombreValue) {
        return { error: PRODUCTO_ERRORS.NOMBRE_REQUIRED };
    }

    if (!referenciaValue) {
        return { error: PRODUCTO_ERRORS.REFERENCIA_REQUIRED };
    }

    if (!proveedorValue || !INTEGER_REGEX.test(proveedorValue)) {
        return { error: PRODUCTO_ERRORS.PROVEEDOR_ID_REQUIRED };
    }

    if (!categoriaValue) {
        return { error: PRODUCTO_ERRORS.CATEGORIA_REQUIRED };
    }

    const precioCompraResult = normalizePrice(
        precio_compra,
        PRODUCTO_ERRORS.PRECIO_COMPRA_REQUIRED,
        PRODUCTO_ERRORS.PRECIO_COMPRA_INVALID
    );

    if (precioCompraResult.error) {
        return { error: precioCompraResult.error };
    }

    const precioVentaResult = normalizePrice(
        precio_venta,
        PRODUCTO_ERRORS.PRECIO_VENTA_REQUIRED,
        PRODUCTO_ERRORS.PRECIO_VENTA_INVALID
    );

    if (precioVentaResult.error) {
        return { error: precioVentaResult.error };
    }

    const stockResult = normalizeStock(
        stock,
        PRODUCTO_ERRORS.STOCK_REQUIRED,
        PRODUCTO_ERRORS.STOCK_INVALID
    );

    if (stockResult.error) {
        return { error: stockResult.error };
    }

    const stockMinimoResult = normalizeStock(
        stock_minimo,
        PRODUCTO_ERRORS.STOCK_REQUIRED,
        PRODUCTO_ERRORS.STOCK_MINIMO_INVALID,
        false
    );

    if (stockMinimoResult.error) {
        return { error: stockMinimoResult.error };
    }

    return {
        value: {
            id_proveedor: Number.parseInt(proveedorValue, 10),
            nombre: nombreValue,
            referencia: referenciaValue,
            categoria: categoriaValue,
            precio_compra: precioCompraResult.value,
            precio_venta: precioVentaResult.value,
            stock: stockResult.value,
            stock_minimo: stockMinimoResult.value,
            descripcion: typeof descripcion === "string" ? descripcion.trim() || null : null,
        },
    };
};

export const createProducto = async (req, res) => {
    const { id_negocio } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: PRODUCTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: PRODUCTO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    const productoFieldsResult = validateProductoFields(req.body);

    if (productoFieldsResult.error) {
        return res.status(400).json({ message: productoFieldsResult.error });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: PRODUCTO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageProductos(usuarioNegocio.rol)) {
            return res.status(403).json({ message: PRODUCTO_ERRORS.NO_MANAGE_PERMISSION });
        }

        const proveedor = await Proveedor.findByPk(productoFieldsResult.value.id_proveedor);

        if (!proveedor) {
            return res.status(404).json({ message: PRODUCTO_ERRORS.PROVEEDOR_NOT_FOUND });
        }

        if (proveedor.id_negocio !== Number(id_negocio)) {
            return res.status(400).json({ message: PRODUCTO_ERRORS.PROVIDER_NOT_IN_BUSINESS });
        }

        const producto = await Producto.create(productoFieldsResult.value);

        return res.status(201).json({
            message: PRODUCTO_MESSAGES.PRODUCTO_CREATED,
            producto: serializeProducto(producto),
        });
    } catch (error) {
        return res.status(500).json({ message: PRODUCTO_ERRORS.SERVER_ERROR });
    }
};

export const getProductosByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: PRODUCTO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: PRODUCTO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: PRODUCTO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageProductos(usuarioNegocio.rol)) {
            return res.status(403).json({ message: PRODUCTO_ERRORS.NO_MANAGE_PERMISSION });
        }

        const proveedores = await Proveedor.findAll({
            where: { id_negocio },
            attributes: ["id_proveedor", "nombre"],
        });

        const proveedoresIds = proveedores.map((proveedor) => proveedor.id_proveedor);

        if (!proveedoresIds.length) {
            return res.status(200).json({
                message: PRODUCTO_MESSAGES.PRODUCTOS_FETCHED,
                productos: [],
            });
        }

        const productos = await Producto.findAll({
            where: {
                id_proveedor: {
                    [Op.in]: proveedoresIds,
                },
            },
            order: [["createdAt", "DESC"]],
        });

        const proveedoresMap = new Map(
            proveedores.map((proveedor) => [proveedor.id_proveedor, proveedor.nombre])
        );

        const productosSerialized = productos.map((producto) => ({
            ...serializeProducto(producto),
            proveedor_nombre: proveedoresMap.get(producto.id_proveedor) || "",
        }));

        return res.status(200).json({
            message: PRODUCTO_MESSAGES.PRODUCTOS_FETCHED,
            productos: productosSerialized,
        });
    } catch (error) {
        return res.status(500).json({ message: PRODUCTO_ERRORS.SERVER_ERROR });
    }
};
