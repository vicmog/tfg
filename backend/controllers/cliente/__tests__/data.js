export const mockClienteData = {
    id_cliente: 3,
    id_negocio: 10,
    nombre: "Ana",
    apellido1: "López",
    apellido2: null,
    email: "ana@mail.com",
    numero_telefono: null,
    bloqueado: false,
};

export const mockUsuarioEncontrado = { id_usuario: 1, id_negocio: 10, rol: "jefe" };

export const createClienteReq = {
    body: {
        id_negocio: 10,
        nombre: "Ana",
        apellido1: "López",
        email: "ana@mail.com",
    },
    user: { id_usuario: 1 },
};

export const createClienteReqSinContacto = {
    body: {
        id_negocio: 10,
        nombre: "Ana",
        apellido1: "López",
    },
    user: { id_usuario: 1 },
};

export const createClienteReqSinAcceso = {
    body: {
        id_negocio: 10,
        nombre: "Ana",
        apellido1: "López",
        numero_telefono: "600111222",
    },
    user: { id_usuario: 2 },
};

export const getClientesReq = {
    params: { id_negocio: "10" },
    user: { id_usuario: 1 },
};

export const mockClienteListado = {
    id_cliente: 1,
    id_negocio: 10,
    nombre: "María",
    apellido1: "Ruiz",
    apellido2: "Gil",
    email: null,
    numero_telefono: "600111222",
    bloqueado: false,
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};