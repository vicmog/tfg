export const mockUsuarioJefe = { id_usuario: 1, id_negocio: 10, rol: "jefe" };
export const mockUsuarioAdmin = { id_usuario: 3, id_negocio: 10, rol: "admin" };
export const mockUsuarioTrabajador = { id_usuario: 2, id_negocio: 10, rol: "trabajador" };

export const createServicioReq = {
    body: {
        id_negocio: 10,
        nombre: "Corte premium",
        precio: 25.5,
        duracion: 45,
        descripcion: "Corte con lavado y peinado",
    },
    user: { id_usuario: 1 },
};

export const createServicioReqAdmin = {
    body: {
        id_negocio: 10,
        nombre: "Color completo",
        precio: "60",
        duracion: "90",
        descripcion: "Aplicación de color con secado",
    },
    user: { id_usuario: 3 },
};

export const createServicioReqSinNombre = {
    body: {
        id_negocio: 10,
        nombre: "   ",
        precio: 25.5,
        duracion: 45,
        descripcion: "Corte con lavado y peinado",
    },
    user: { id_usuario: 1 },
};

export const createServicioReqSinDescripcion = {
    body: {
        id_negocio: 10,
        nombre: "Corte premium",
        precio: 25.5,
        duracion: 45,
        descripcion: "   ",
    },
    user: { id_usuario: 1 },
};

export const createServicioReqPrecioInvalido = {
    body: {
        id_negocio: 10,
        nombre: "Corte premium",
        precio: 0,
        duracion: 45,
        descripcion: "Corte con lavado y peinado",
    },
    user: { id_usuario: 1 },
};

export const createServicioReqDuracionInvalida = {
    body: {
        id_negocio: 10,
        nombre: "Corte premium",
        precio: 25.5,
        duracion: "12.5",
        descripcion: "Corte con lavado y peinado",
    },
    user: { id_usuario: 1 },
};

export const createServicioReqSinPermiso = {
    body: {
        id_negocio: 10,
        nombre: "Corte premium",
        precio: 25.5,
        duracion: 45,
        descripcion: "Corte con lavado y peinado",
    },
    user: { id_usuario: 2 },
};

export const getServiciosReq = {
    params: { id_negocio: "10" },
    user: { id_usuario: 1 },
};

export const getServiciosReqSinAuth = {
    params: { id_negocio: "10" },
    user: null,
};

export const getServiciosReqSinPermiso = {
    params: { id_negocio: "10" },
    user: { id_usuario: 2 },
};

export const mockServicioData = {
    id_servicio: 5,
    id_negocio: 10,
    nombre: "Corte premium",
    precio: 25.5,
    duracion: 45,
    descripcion: "Corte con lavado y peinado",
};

export const mockServicios = [
    mockServicioData,
    {
        id_servicio: 6,
        id_negocio: 10,
        nombre: "Color completo",
        precio: 60,
        duracion: 90,
        descripcion: "Aplicación de color con secado",
    },
];

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};