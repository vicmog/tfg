export const mockUsuarioJefe = { id_usuario: 1, id_negocio: 10, rol: "jefe" };
export const mockUsuarioAdmin = { id_usuario: 3, id_negocio: 10, rol: "admin" };
export const mockUsuarioTrabajador = { id_usuario: 2, id_negocio: 10, rol: "trabajador" };

export const createEmpleadoReq = {
    body: {
        id_negocio: 10,
        nombre: "Laura",
        apellido1: "Pérez",
        email: "laura@mail.com",
    },
    user: { id_usuario: 1 },
};

export const createEmpleadoReqSinNombre = {
    body: {
        id_negocio: 10,
        nombre: "   ",
        apellido1: "Pérez",
        email: "laura@mail.com",
    },
    user: { id_usuario: 1 },
};

export const createEmpleadoReqSinContacto = {
    body: {
        id_negocio: 10,
        nombre: "Laura",
        apellido1: "Pérez",
        email: "",
        numero_telefono: "",
    },
    user: { id_usuario: 1 },
};

export const createEmpleadoReqSinPermisoGestion = {
    body: {
        id_negocio: 10,
        nombre: "Laura",
        apellido1: "Pérez",
        email: "laura@mail.com",
    },
    user: { id_usuario: 2 },
};

export const getEmpleadosReq = {
    params: { id_negocio: "10" },
    user: { id_usuario: 1 },
};

export const deleteEmpleadoReq = {
    params: { id_empleado: "11" },
    user: { id_usuario: 1 },
};

export const deleteEmpleadoReqAdmin = {
    params: { id_empleado: "11" },
    user: { id_usuario: 3 },
};

export const deleteEmpleadoReqSinAuth = {
    params: { id_empleado: "11" },
    user: null,
};

export const deleteEmpleadoReqSinPermisoGestion = {
    params: { id_empleado: "11" },
    user: { id_usuario: 2 },
};

export const getEmpleadosReqSinAuth = {
    params: { id_negocio: "10" },
    user: null,
};

export const mockEmpleadoData = {
    id_empleado: 11,
    id_negocio: 10,
    nombre: "Laura",
    apellido1: "Pérez",
    apellido2: null,
    numero_telefono: null,
    email: "laura@mail.com",
};

export const mockEmpleadoConDestroy = {
    ...mockEmpleadoData,
    destroy: jest.fn(),
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};
