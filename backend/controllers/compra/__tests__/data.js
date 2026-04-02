export const mockUsuarioJefe = { id_usuario: 1, id_negocio: 10, rol: "jefe" };
export const mockUsuarioAdmin = { id_usuario: 2, id_negocio: 10, rol: "admin" };
export const mockUsuarioTrabajador = { id_usuario: 3, id_negocio: 10, rol: "trabajador" };

export const mockProductos = [
    {
        id_producto: 7,
        id_proveedor: 20,
        nombre: "Champu",
        precio_compra: 5,
    },
    {
        id_producto: 9,
        id_proveedor: 21,
        nombre: "Mascarilla",
        precio_compra: 3,
    },
];

export const mockProveedores = [
    { id_proveedor: 20, id_negocio: 10 },
    { id_proveedor: 21, id_negocio: 10 },
];

export const createCompraReq = {
    user: { id_usuario: 1 },
    body: {
        id_negocio: 10,
        descripcion: "Reposicion mensual",
        fecha: "2026-04-02T10:00:00.000Z",
        productos: [
            { id_producto: 7, cantidad_esperada: 10, cantidad_llegada: 0 },
            { id_producto: 9, cantidad_esperada: 4, cantidad_llegada: 1 },
        ],
    },
};

export const createCompraReqAdmin = {
    ...createCompraReq,
    user: { id_usuario: 2 },
};

export const createCompraReqSinPermiso = {
    ...createCompraReq,
    user: { id_usuario: 3 },
};

export const createCompraReqSinProductos = {
    ...createCompraReq,
    body: {
        ...createCompraReq.body,
        productos: [],
    },
};

export const createCompraReqCantidadEsperadaInvalida = {
    ...createCompraReq,
    body: {
        ...createCompraReq.body,
        productos: [
            { id_producto: 7, cantidad_esperada: 0, cantidad_llegada: 0 },
        ],
    },
};

export const createCompraReqCantidadLlegadaInvalida = {
    ...createCompraReq,
    body: {
        ...createCompraReq.body,
        productos: [
            { id_producto: 7, cantidad_esperada: 2, cantidad_llegada: 3 },
        ],
    },
};

export const createCompraReqProductoDuplicado = {
    ...createCompraReq,
    body: {
        ...createCompraReq.body,
        productos: [
            { id_producto: 7, cantidad_esperada: 1, cantidad_llegada: 0 },
            { id_producto: 7, cantidad_esperada: 2, cantidad_llegada: 0 },
        ],
    },
};

export const createCompraReqProductoFueraNegocio = {
    ...createCompraReq,
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};
