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
};

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

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};
