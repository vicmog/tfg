export const mockUsuarioNegocio = { id_usuario: 1, id_negocio: 10, rol: "empleado" };

export const mockRecurso = {
    id_recurso: 7,
    id_negocio: 10,
    nombre: "Sala principal",
    capacidad: 10,
};

export const mockServicio = {
    id_servicio: 3,
    id_negocio: 10,
    nombre: "Corte premium",
    duracion: 45,
    requiere_capacidad: false,
};

export const mockCliente = {
    id_cliente: 5,
    id_negocio: 10,
    nombre: "Juan",
    apellido1: "Perez",
    email: "cliente@test.com",
    bloqueado: false,
};

export const mockReserva = {
    id_reserva: 11,
    id_recurso: 7,
    id_cliente: 5,
    fecha_hora_inicio: new Date("2026-04-12T09:00:00.000Z"),
    fecha_hora_fin: new Date("2026-04-12T10:00:00.000Z"),
    estado: "pendiente",
};

export const createReservaReq = {
    body: {
        id_recurso: 7,
        id_cliente: 5,
        id_servicio: 3,
        fecha_hora_inicio: "2026-04-12T09:00:00.000Z",
        duracion_minutos: 60,
    },
    user: { id_usuario: 1 },
};

export const createReservaReqRecurrente = {
    body: {
        id_recurso: 7,
        id_cliente: 5,
        id_servicio: 3,
        fecha_hora_inicio: "2026-04-12T09:00:00.000Z",
        duracion_minutos: 60,
        recurrencia: {
            activa: true,
            cantidad: 3,
            intervalo_dias: 7,
        },
    },
    user: { id_usuario: 1 },
};

export const createReservaReqSinInicio = {
    body: {
        id_recurso: 7,
        id_cliente: 5,
        id_servicio: 3,
        duracion_minutos: 60,
    },
    user: { id_usuario: 1 },
};

export const createReservaReqDuracionInvalida = {
    body: {
        id_recurso: 7,
        id_cliente: 5,
        id_servicio: 3,
        fecha_hora_inicio: "2026-04-12T10:00:00.000Z",
        duracion_minutos: "0",
    },
    user: { id_usuario: 1 },
};

export const createReservaReqSinServicio = {
    body: {
        id_recurso: 7,
        id_cliente: 5,
        fecha_hora_inicio: "2026-04-12T09:00:00.000Z",
        duracion_minutos: 60,
        capacidad_solicitada: 6,
    },
    user: { id_usuario: 1 },
};

export const getReservasReq = {
    params: { id_negocio: "10" },
    user: { id_usuario: 1 },
};

export const updateReservaReq = {
    params: { id_reserva: "11" },
    body: {
        id_recurso: 7,
        id_cliente: 5,
        id_servicio: 3,
        fecha_hora_inicio: "2026-04-12T11:00:00.000Z",
        duracion_minutos: 60,
    },
    user: { id_usuario: 1 },
};

export const updateReservaReqNotFound = {
    params: { id_reserva: "999" },
    body: {
        id_recurso: 7,
        id_cliente: 5,
        id_servicio: 3,
        fecha_hora_inicio: "2026-04-12T11:00:00.000Z",
        duracion_minutos: 60,
    },
    user: { id_usuario: 1 },
};

export const updateReservaReqSinServicio = {
    params: { id_reserva: "11" },
    body: {
        id_recurso: 7,
        id_cliente: 5,
        fecha_hora_inicio: "2026-04-12T11:00:00.000Z",
        duracion_minutos: 60,
        capacidad_solicitada: 6,
    },
    user: { id_usuario: 1 },
};

export const cancelReservaReq = {
    params: { id_reserva: "11" },
    user: { id_usuario: 1 },
};

export const deleteReservaReq = {
    params: { id_reserva: "11" },
    user: { id_usuario: 1 },
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};
