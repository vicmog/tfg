export const mockUsuarioJefe = { id_usuario: 1, id_negocio: 10, rol: "jefe" };
export const mockUsuarioAdmin = { id_usuario: 3, id_negocio: 10, rol: "admin" };
export const mockUsuarioTrabajador = { id_usuario: 2, id_negocio: 10, rol: "trabajador" };

export const mockProveedor = {
    id_proveedor: 7,
    id_negocio: 10,
    nombre: "Proveedor Norte",
};

export const createProductoReq = {
    body: {
        id_negocio: 10,
        id_proveedor: 7,
        nombre: "Champu profesional",
        referencia: "CH-001",
        categoria: "Cosmetica",
        precio_compra: "5.25",
        precio_venta: "12.99",
        stock: "50",
        stock_minimo: "5",
        descripcion: "Uso diario",
    },
    user: { id_usuario: 1 },
};

export const createProductoReqAdmin = {
    body: {
        id_negocio: 10,
        id_proveedor: 7,
        nombre: "Mascarilla",
        referencia: "MSK-002",
        categoria: "Cosmetica",
        precio_compra: 4,
        precio_venta: 11,
        stock: 30,
        stock_minimo: 3,
    },
    user: { id_usuario: 3 },
};

export const createProductoReqSinNombre = {
    body: {
        ...createProductoReq.body,
        nombre: "  ",
    },
    user: { id_usuario: 1 },
};

export const createProductoReqSinReferencia = {
    body: {
        ...createProductoReq.body,
        referencia: "",
    },
    user: { id_usuario: 1 },
};

export const createProductoReqPrecioInvalido = {
    body: {
        ...createProductoReq.body,
        precio_venta: "0",
    },
    user: { id_usuario: 1 },
};

export const createProductoReqStockInvalido = {
    body: {
        ...createProductoReq.body,
        stock: "-1",
    },
    user: { id_usuario: 1 },
};

export const createProductoReqSinPermiso = {
    body: {
        ...createProductoReq.body,
    },
    user: { id_usuario: 2 },
};

export const createProductoReqProveedorOtroNegocio = {
    body: {
        ...createProductoReq.body,
    },
    user: { id_usuario: 1 },
};

export const mockProductoData = {
    id_producto: 55,
    id_proveedor: 7,
    nombre: "Champu profesional",
    referencia: "CH-001",
    descripcion: "Uso diario",
    categoria: "Cosmetica",
    precio_compra: 5.25,
    precio_venta: 12.99,
    stock: 50,
    stock_minimo: 5,
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};
