export const mockUsuarioJefe = { id_usuario: 1, id_negocio: 10, rol: "jefe" };
export const mockUsuarioAdmin = { id_usuario: 3, id_negocio: 10, rol: "admin" };
export const mockUsuarioTrabajador = { id_usuario: 2, id_negocio: 10, rol: "trabajador" };

export const mockProducto = {
    id_producto: 55,
    id_proveedor: 7,
    nombre: "Champu profesional",
};

export const mockProveedor = {
    id_proveedor: 7,
    id_negocio: 10,
    nombre: "Proveedor Norte",
};

export const mockDescuento = {
    id_descuento: 1,
    id_producto: 55,
    porcentaje_descuento: 15,
    tipo_descuento: "porcentaje",
    fecha_inicio: new Date("2026-01-01"),
    fecha_fin: new Date("2026-12-31"),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
};

export const mockDescuentos = [
    {
        id_descuento: 1,
        id_producto: 55,
        porcentaje_descuento: 15,
        tipo_descuento: "porcentaje",
        fecha_inicio: new Date("2026-01-01"),
        fecha_fin: new Date("2026-12-31"),
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
    },
    {
        id_descuento: 2,
        id_producto: 55,
        porcentaje_descuento: 10,
        tipo_descuento: "porcentaje",
        fecha_inicio: new Date("2026-03-01"),
        fecha_fin: null,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
    },
];

export const createDescuentoReq = {
    body: {
        id_producto: 55,
        porcentaje_descuento: "15",
    },
    user: { id_usuario: 1 },
};

export const createDescuentoReqAdmin = {
    body: {
        id_producto: 55,
        porcentaje_descuento: 25,
    },
    user: { id_usuario: 3 },
};

export const createDescuentoReqSinAuth = {
    body: {
        id_producto: 55,
        porcentaje_descuento: "15",
    },
    user: null,
};

export const createDescuentoReqSinProducto = {
    body: {
        porcentaje_descuento: "15",
    },
    user: { id_usuario: 1 },
};

export const createDescuentoReqPorcentajeInvalido = {
    body: {
        id_producto: 55,
        porcentaje_descuento: "150",
    },
    user: { id_usuario: 1 },
};

export const createDescuentoReqSinPermiso = {
    body: {
        id_producto: 55,
        porcentaje_descuento: "15",
    },
    user: { id_usuario: 2 },
};

export const getDescuentosReq = {
    params: { id_producto: "55" },
    user: { id_usuario: 1 },
};

export const getDescuentosReqSinAuth = {
    params: { id_producto: "55" },
    user: null,
};

export const getDescuentosReqSinPermiso = {
    params: { id_producto: "55" },
    user: { id_usuario: 2 },
};

export const getDescuentosReqProductoInvalido = {
    params: { id_producto: "invalid" },
    user: { id_usuario: 1 },
};

export const deleteDescuentoReq = {
    params: { id_descuento: "1" },
    user: { id_usuario: 1 },
};

export const deleteDescuentoReqAdmin = {
    params: { id_descuento: "1" },
    user: { id_usuario: 3 },
};

export const deleteDescuentoReqSinAuth = {
    params: { id_descuento: "1" },
    user: null,
};

export const deleteDescuentoReqSinPermiso = {
    params: { id_descuento: "1" },
    user: { id_usuario: 2 },
};

export const deleteDescuentoReqIdInvalido = {
    params: { id_descuento: "abc" },
    user: { id_usuario: 1 },
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};
