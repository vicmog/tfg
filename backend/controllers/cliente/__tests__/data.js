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

export const deleteClienteReq = {
    params: { id_cliente: "1" },
    user: { id_usuario: 1 },
};

export const deleteClienteReqSinAuth = {
    params: { id_cliente: "1" },
    user: null,
};

export const updateClienteReq = {
    params: { id_cliente: "1" },
    body: {
        nombre: "María",
        apellido1: "Ruiz",
        apellido2: "Gil",
        email: "maria@mail.com",
        numero_telefono: "600111222",
    },
    user: { id_usuario: 1 },
};

export const updateClienteReqSinContacto = {
    params: { id_cliente: "1" },
    body: {
        nombre: "María",
        apellido1: "Ruiz",
        email: "",
        numero_telefono: "",
    },
    user: { id_usuario: 1 },
};

export const searchClientesReq = {
    params: { id_negocio: "10" },
    query: { searchTerm: "Mar" },
    user: { id_usuario: 1 },
};

export const searchClientesReqSinTermino = {
    params: { id_negocio: "10" },
    query: { searchTerm: "   " },
    user: { id_usuario: 1 },
};

export const searchClientesReqSinAuth = {
    params: { id_negocio: "10" },
    query: { searchTerm: "Mar" },
    user: null,
};

export const searchClientesReqSinAcceso = {
    params: { id_negocio: "10" },
    query: { searchTerm: "Mar" },
    user: { id_usuario: 2 },
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

export const mockClienteConDestroy = {
    ...mockClienteListado,
    destroy: jest.fn(),
};

export const mockClienteConUpdate = {
    ...mockClienteListado,
    update: jest.fn().mockResolvedValue(true),
};

export const mockClientesBusqueda = [
    {
        id_cliente: 7,
        id_negocio: 10,
        nombre: "Mario",
        apellido1: "Sanz",
        apellido2: null,
        email: null,
        numero_telefono: "600111222",
        bloqueado: false,
    },
];

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};