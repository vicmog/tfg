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
        id_recurso_favorito: 8,
    },
    user: { id_usuario: 3 },
};

export const createServicioReqRecursoFavoritoInvalido = {
    body: {
        id_negocio: 10,
        nombre: "Corte premium",
        precio: 25.5,
        duracion: 45,
        descripcion: "Corte con lavado y peinado",
        id_recurso_favorito: "abc",
    },
    user: { id_usuario: 1 },
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

export const updateServicioReq = {
    params: { id_servicio: "5" },
    body: {
        nombre: "Corte premium actualizado",
        precio: "30",
        duracion: "50",
        descripcion: "Corte con lavado, peinado y tratamiento",
    },
    user: { id_usuario: 1 },
};

export const updateServicioReqAdmin = {
    params: { id_servicio: "5" },
    body: {
        nombre: "Color actualizado",
        precio: 70,
        duracion: 95,
        descripcion: "Aplicacion de color con secado y peinado",
        id_recurso_favorito: 8,
    },
    user: { id_usuario: 3 },
};

export const updateServicioReqSinAuth = {
    params: { id_servicio: "5" },
    body: {
        nombre: "Corte premium actualizado",
        precio: "30",
        duracion: "50",
        descripcion: "Corte con lavado, peinado y tratamiento",
    },
    user: null,
};

export const updateServicioReqSinNombre = {
    params: { id_servicio: "5" },
    body: {
        nombre: "   ",
        precio: "30",
        duracion: "50",
        descripcion: "Corte con lavado, peinado y tratamiento",
    },
    user: { id_usuario: 1 },
};

export const updateServicioReqSinPermiso = {
    params: { id_servicio: "5" },
    body: {
        nombre: "Corte premium actualizado",
        precio: "30",
        duracion: "50",
        descripcion: "Corte con lavado, peinado y tratamiento",
    },
    user: { id_usuario: 2 },
};

export const deleteServicioReq = {
    params: { id_servicio: "5" },
    user: { id_usuario: 1 },
};

export const deleteServicioReqAdmin = {
    params: { id_servicio: "5" },
    user: { id_usuario: 3 },
};

export const deleteServicioReqSinAuth = {
    params: { id_servicio: "5" },
    user: null,
};

export const deleteServicioReqSinPermiso = {
    params: { id_servicio: "5" },
    user: { id_usuario: 2 },
};

export const mockServicioData = {
    id_servicio: 5,
    id_negocio: 10,
    id_recurso_favorito: null,
    nombre: "Corte premium",
    precio: 25.5,
    duracion: 45,
    descripcion: "Corte con lavado y peinado",
    requiere_capacidad: false,
};

export const mockServicios = [
    mockServicioData,
    {
        id_servicio: 6,
        id_negocio: 10,
        id_recurso_favorito: 8,
        nombre: "Color completo",
        precio: 60,
        duracion: 90,
        descripcion: "Aplicación de color con secado",
        requiere_capacidad: false,
    },
];

export const mockServicioConDestroy = {
    ...mockServicioData,
    destroy: jest.fn(),
};

export const mockServicioConUpdate = {
    ...mockServicioData,
    update: jest.fn(async function updateServicioMock(data) {
        Object.assign(this, data);
        return this;
    }),
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};