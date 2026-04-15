import { Op } from "sequelize";
import { Cliente } from "../../models/Cliente.js";
import { Recurso } from "../../models/Recurso.js";
import { Reserva } from "../../models/Reserva.js";
import { Servicio } from "../../models/Servicio.js";
import { ServicioReserva } from "../../models/ServicioReserva.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { sendClienteEmail } from "../../utils/mailer.js";
import { RESERVA_ERRORS, RESERVA_MESSAGES } from "./constants.js";

const INTEGER_REGEX = /^\d+$/;
const toPlain = (instance) => (instance && typeof instance.toJSON === "function" ? instance.toJSON() : instance);
const isMissingColumnError = (error, columnName) =>
    error?.name === "SequelizeDatabaseError"
    && error?.original?.code === "42703"
    && error?.original?.message?.includes(`column \"${columnName}\" does not exist`);

const toLegacyDate = (date) => date.toISOString().slice(0, 10);
const toLegacyTime = (date) => date.toISOString().slice(11, 19);
const fromLegacyDateTime = (fecha, hora) => {
    if (!fecha || !hora) {
        return null;
    }

    return new Date(`${fecha}T${hora}`).toISOString();
};

const serializeReserva = (reserva) => ({
    id_reserva: reserva.id_reserva,
    id_recurso: reserva.id_recurso,
    id_cliente: reserva.id_cliente,
    id_servicio: reserva.id_servicio,
    servicio_nombre: reserva.servicio_nombre,
    duracion_minutos: reserva.duracion_minutos,
    fecha_hora_inicio: reserva.fecha_hora_inicio,
    fecha_hora_fin: reserva.fecha_hora_fin,
    estado: reserva.estado,
});

const parseDateValue = (value) => {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};

const formatDateForEmail = (value) => {
    const date = new Date(value);

    return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const resolveReservaForUser = async (idReservaInt, idUsuario) => {
    const reserva = await Reserva.findByPk(idReservaInt);
    if (!reserva) {
        return { error: { status: 404, message: RESERVA_ERRORS.RESERVA_NOT_FOUND } };
    }

    if (!reserva.id_recurso) {
        return { error: { status: 404, message: RESERVA_ERRORS.RECURSO_NOT_FOUND } };
    }

    const recurso = await Recurso.findByPk(reserva.id_recurso);
    if (!recurso) {
        return { error: { status: 404, message: RESERVA_ERRORS.RECURSO_NOT_FOUND } };
    }

    const usuarioNegocio = await UsuarioNegocio.findOne({
        where: {
            id_usuario: idUsuario,
            id_negocio: recurso.id_negocio,
        },
    });

    if (!usuarioNegocio) {
        return { error: { status: 403, message: RESERVA_ERRORS.NO_ACCESS_TO_NEGOCIO } };
    }

    return { reserva };
};

export const createReserva = async (req, res) => {
    const {
        id_recurso,
        id_cliente,
        id_servicio,
        fecha_hora_inicio,
        duracion_minutos,
        recurrencia,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RESERVA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_recurso) {
        return res.status(400).json({ message: RESERVA_ERRORS.RECURSO_ID_REQUIRED });
    }

    if (!id_cliente) {
        return res.status(400).json({ message: RESERVA_ERRORS.CLIENTE_ID_REQUIRED });
    }

    if (!id_servicio) {
        return res.status(400).json({ message: RESERVA_ERRORS.SERVICIO_ID_REQUIRED });
    }

    if (!fecha_hora_inicio) {
        return res.status(400).json({ message: RESERVA_ERRORS.FECHA_INICIO_REQUIRED });
    }

    const inicioDate = parseDateValue(fecha_hora_inicio);
    if (!inicioDate) {
        return res.status(400).json({ message: RESERVA_ERRORS.FECHA_INICIO_INVALID });
    }

    const recurrenciaActiva = recurrencia?.activa === true;
    const recurrenciaCantidadRaw = `${recurrencia?.cantidad ?? ""}`.trim();
    const recurrenciaIntervaloRaw = `${recurrencia?.intervalo_dias ?? ""}`.trim();

    const recurrenciaCantidad = recurrenciaActiva
        ? Number.parseInt(recurrenciaCantidadRaw, 10)
        : 1;
    const recurrenciaIntervaloDias = recurrenciaActiva
        ? Number.parseInt(recurrenciaIntervaloRaw, 10)
        : 1;

    if (recurrenciaActiva) {
        if (!INTEGER_REGEX.test(recurrenciaCantidadRaw) || !Number.isInteger(recurrenciaCantidad) || recurrenciaCantidad < 2) {
            return res.status(400).json({ message: RESERVA_ERRORS.RECURRENCIA_CANTIDAD_INVALID });
        }

        if (!INTEGER_REGEX.test(recurrenciaIntervaloRaw) || !Number.isInteger(recurrenciaIntervaloDias) || recurrenciaIntervaloDias <= 0) {
            return res.status(400).json({ message: RESERVA_ERRORS.RECURRENCIA_INTERVALO_INVALID });
        }
    }

    try {
        const recurso = await Recurso.findByPk(id_recurso);
        if (!recurso) {
            return res.status(404).json({ message: RESERVA_ERRORS.RECURSO_NOT_FOUND });
        }

        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return res.status(404).json({ message: RESERVA_ERRORS.CLIENTE_NOT_FOUND });
        }

        const servicio = await Servicio.findByPk(id_servicio);
        if (!servicio) {
            return res.status(404).json({ message: RESERVA_ERRORS.SERVICIO_NOT_FOUND });
        }

        if (cliente.bloqueado) {
            return res.status(400).json({ message: RESERVA_ERRORS.CLIENTE_BLOCKED });
        }

        if (cliente.id_negocio !== recurso.id_negocio) {
            return res.status(400).json({ message: RESERVA_ERRORS.RESOURCE_CLIENT_NEGOCIO_MISMATCH });
        }

        if (servicio.id_negocio !== recurso.id_negocio) {
            return res.status(400).json({ message: RESERVA_ERRORS.SERVICIO_NEGOCIO_MISMATCH });
        }

        const durationInputValue = `${duracion_minutos ?? servicio.duracion}`.trim();

        if (!durationInputValue) {
            return res.status(400).json({ message: RESERVA_ERRORS.DURACION_REQUIRED });
        }

        if (!INTEGER_REGEX.test(durationInputValue)) {
            return res.status(400).json({ message: RESERVA_ERRORS.DURACION_INVALID });
        }

        const durationMinutes = Number.parseInt(durationInputValue, 10);

        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            return res.status(400).json({ message: RESERVA_ERRORS.DURACION_INVALID });
        }

        const finDate = new Date(inicioDate.getTime() + durationMinutes * 60 * 1000);

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: {
                id_usuario,
                id_negocio: recurso.id_negocio,
            },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RESERVA_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const ocurrencias = Array.from({ length: recurrenciaActiva ? recurrenciaCantidad : 1 }, (_, index) => {
            const inicioOcurrencia = new Date(inicioDate.getTime());
            inicioOcurrencia.setDate(inicioOcurrencia.getDate() + (index * recurrenciaIntervaloDias));

            const finOcurrencia = new Date(inicioOcurrencia.getTime() + durationMinutes * 60 * 1000);

            return {
                inicio: inicioOcurrencia,
                fin: finOcurrencia,
                indice: index + 1,
            };
        });

        const conflictos = [];
        for (const ocurrencia of ocurrencias) {
            const overlappingReserva = await Reserva.findOne({
                where: {
                    id_recurso,
                    estado: { [Op.ne]: "cancelada" },
                    [Op.and]: [
                        { fecha_hora_inicio: { [Op.lt]: ocurrencia.fin } },
                        { fecha_hora_fin: { [Op.gt]: ocurrencia.inicio } },
                    ],
                },
            });

            if (overlappingReserva) {
                conflictos.push({
                    ocurrencia: ocurrencia.indice,
                    fecha_hora_inicio: ocurrencia.inicio,
                    fecha_hora_fin: ocurrencia.fin,
                });
            }
        }

        if (conflictos.length > 0) {
            return res.status(409).json({
                message: recurrenciaActiva ? RESERVA_ERRORS.RECURRENCIA_CONFLICTS : RESERVA_ERRORS.RESERVA_SOLAPADA,
                conflictos,
            });
        }

        const transaction = await Reserva.sequelize.transaction();
        const reservasCreadas = [];

        try {
            for (const ocurrencia of ocurrencias) {
                const reserva = await Reserva.create({
                    id_recurso,
                    id_cliente,
                    fecha: toLegacyDate(ocurrencia.inicio),
                    hora_inicio: toLegacyTime(ocurrencia.inicio),
                    hora_fin: toLegacyTime(ocurrencia.fin),
                    fecha_hora_inicio: ocurrencia.inicio,
                    fecha_hora_fin: ocurrencia.fin,
                }, { transaction });

                await ServicioReserva.create({
                    id_servicio,
                    id_reserva: reserva.id_reserva,
                }, { transaction });

                reservasCreadas.push(reserva);
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        if (cliente.email) {
            const clienteNombre = [cliente.nombre, cliente.apellido1].filter(Boolean).join(" ").trim();
            const subject = "Confirmacion de reserva";
            const primeraOcurrencia = ocurrencias[0];
            const ultimaOcurrencia = ocurrencias[ocurrencias.length - 1];
            const text = [
                `Hola ${clienteNombre || "cliente"},`,
                "",
                recurrenciaActiva
                    ? `Tus ${ocurrencias.length} reservas recurrentes han sido registradas correctamente.`
                    : "Tu reserva ha sido registrada correctamente.",
                `Recurso: ${recurso.nombre}`,
                `Servicio: ${servicio.nombre}`,
                `Duracion: ${durationMinutes} min`,
                `Inicio: ${formatDateForEmail(primeraOcurrencia.inicio)}`,
                `Fin: ${formatDateForEmail(primeraOcurrencia.fin)}`,
                recurrenciaActiva ? `Ultima ocurrencia: ${formatDateForEmail(ultimaOcurrencia.inicio)}` : null,
                "",
                "Gracias por confiar en nosotros.",
            ].filter(Boolean).join("\n");

            await sendClienteEmail(cliente.email, subject, text);
        }

        const reservasSerializadas = reservasCreadas.map((reserva) => serializeReserva({
            ...toPlain(reserva),
            id_servicio,
            servicio_nombre: servicio.nombre,
            duracion_minutos: durationMinutes,
        }));

        const [primeraReserva] = reservasSerializadas;

        return res.status(201).json({
            message: recurrenciaActiva ? RESERVA_MESSAGES.RESERVA_RECURRENT_CREATED : RESERVA_MESSAGES.RESERVA_CREATED,
            reserva: primeraReserva,
            reservas: reservasSerializadas,
        });
    } catch (error) {
        return res.status(500).json({ message: RESERVA_ERRORS.SERVER_ERROR });
    }
};

export const updateReserva = async (req, res) => {
    const { id_reserva } = req.params;
    const {
        id_recurso,
        id_cliente,
        id_servicio,
        fecha_hora_inicio,
        duracion_minutos,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RESERVA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_reserva) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    if (!id_recurso) {
        return res.status(400).json({ message: RESERVA_ERRORS.RECURSO_ID_REQUIRED });
    }

    if (!id_cliente) {
        return res.status(400).json({ message: RESERVA_ERRORS.CLIENTE_ID_REQUIRED });
    }

    if (!id_servicio) {
        return res.status(400).json({ message: RESERVA_ERRORS.SERVICIO_ID_REQUIRED });
    }

    if (!fecha_hora_inicio) {
        return res.status(400).json({ message: RESERVA_ERRORS.FECHA_INICIO_REQUIRED });
    }

    const inicioDate = parseDateValue(fecha_hora_inicio);
    if (!inicioDate) {
        return res.status(400).json({ message: RESERVA_ERRORS.FECHA_INICIO_INVALID });
    }

    const idReservaInt = Number.parseInt(`${id_reserva}`, 10);
    if (!Number.isInteger(idReservaInt) || idReservaInt <= 0) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    try {
        const reserva = await Reserva.findByPk(idReservaInt);
        if (!reserva) {
            return res.status(404).json({ message: RESERVA_ERRORS.RESERVA_NOT_FOUND });
        }

        const recurso = await Recurso.findByPk(id_recurso);
        if (!recurso) {
            return res.status(404).json({ message: RESERVA_ERRORS.RECURSO_NOT_FOUND });
        }

        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return res.status(404).json({ message: RESERVA_ERRORS.CLIENTE_NOT_FOUND });
        }

        const servicio = await Servicio.findByPk(id_servicio);
        if (!servicio) {
            return res.status(404).json({ message: RESERVA_ERRORS.SERVICIO_NOT_FOUND });
        }

        if (cliente.bloqueado) {
            return res.status(400).json({ message: RESERVA_ERRORS.CLIENTE_BLOCKED });
        }

        if (cliente.id_negocio !== recurso.id_negocio) {
            return res.status(400).json({ message: RESERVA_ERRORS.RESOURCE_CLIENT_NEGOCIO_MISMATCH });
        }

        if (servicio.id_negocio !== recurso.id_negocio) {
            return res.status(400).json({ message: RESERVA_ERRORS.SERVICIO_NEGOCIO_MISMATCH });
        }

        const durationInputValue = `${duracion_minutos ?? servicio.duracion}`.trim();

        if (!durationInputValue) {
            return res.status(400).json({ message: RESERVA_ERRORS.DURACION_REQUIRED });
        }

        if (!INTEGER_REGEX.test(durationInputValue)) {
            return res.status(400).json({ message: RESERVA_ERRORS.DURACION_INVALID });
        }

        const durationMinutes = Number.parseInt(durationInputValue, 10);

        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            return res.status(400).json({ message: RESERVA_ERRORS.DURACION_INVALID });
        }

        const finDate = new Date(inicioDate.getTime() + durationMinutes * 60 * 1000);

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: {
                id_usuario,
                id_negocio: recurso.id_negocio,
            },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RESERVA_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const overlappingReserva = await Reserva.findOne({
            where: {
                id_recurso,
                estado: { [Op.ne]: "cancelada" },
                id_reserva: { [Op.ne]: idReservaInt },
                [Op.and]: [
                    { fecha_hora_inicio: { [Op.lt]: finDate } },
                    { fecha_hora_fin: { [Op.gt]: inicioDate } },
                ],
            },
        });

        if (overlappingReserva) {
            return res.status(409).json({ message: RESERVA_ERRORS.RESERVA_SOLAPADA });
        }

        await reserva.update({
            id_recurso,
            id_cliente,
            fecha: toLegacyDate(inicioDate),
            hora_inicio: toLegacyTime(inicioDate),
            hora_fin: toLegacyTime(finDate),
            fecha_hora_inicio: inicioDate,
            fecha_hora_fin: finDate,
        });

        await ServicioReserva.destroy({ where: { id_reserva: idReservaInt } });
        await ServicioReserva.create({
            id_servicio,
            id_reserva: idReservaInt,
        });

        return res.status(200).json({
            message: RESERVA_MESSAGES.RESERVA_UPDATED,
            reserva: serializeReserva({
                ...toPlain(reserva),
                id_servicio,
                servicio_nombre: servicio.nombre,
                duracion_minutos: durationMinutes,
            }),
        });
    } catch (error) {
        console.error("Error actualizando reserva:", error);
        return res.status(500).json({ message: RESERVA_ERRORS.SERVER_ERROR });
    }
};

export const cancelReserva = async (req, res) => {
    const { id_reserva } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RESERVA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_reserva) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    const idReservaInt = Number.parseInt(`${id_reserva}`, 10);
    if (!Number.isInteger(idReservaInt) || idReservaInt <= 0) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    try {
        const resolved = await resolveReservaForUser(idReservaInt, id_usuario);
        if (resolved.error) {
            return res.status(resolved.error.status).json({ message: resolved.error.message });
        }

        const { reserva } = resolved;

        if (reserva.estado === "cancelada") {
            return res.status(409).json({ message: RESERVA_ERRORS.RESERVA_ALREADY_CANCELLED });
        }

        if (reserva.estado === "completada") {
            return res.status(409).json({ message: RESERVA_ERRORS.RESERVA_ALREADY_COMPLETED });
        }

        await reserva.update({ estado: "cancelada" });

        return res.status(200).json({
            message: RESERVA_MESSAGES.RESERVA_CANCELLED,
            reserva: serializeReserva(toPlain(reserva)),
        });
    } catch (error) {
        console.error("Error cancelando reserva:", error);
        return res.status(500).json({ message: RESERVA_ERRORS.SERVER_ERROR });
    }
};

export const completeReserva = async (req, res) => {
    const { id_reserva } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RESERVA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_reserva) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    const idReservaInt = Number.parseInt(`${id_reserva}`, 10);
    if (!Number.isInteger(idReservaInt) || idReservaInt <= 0) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    try {
        const resolved = await resolveReservaForUser(idReservaInt, id_usuario);
        if (resolved.error) {
            return res.status(resolved.error.status).json({ message: resolved.error.message });
        }

        const { reserva } = resolved;

        if (reserva.estado === "cancelada") {
            return res.status(409).json({ message: RESERVA_ERRORS.RESERVA_ALREADY_CANCELLED });
        }

        if (reserva.estado === "completada") {
            return res.status(409).json({ message: RESERVA_ERRORS.RESERVA_ALREADY_COMPLETED });
        }

        await reserva.update({ estado: "completada" });

        return res.status(200).json({
            message: RESERVA_MESSAGES.RESERVA_COMPLETED,
            reserva: serializeReserva(toPlain(reserva)),
        });
    } catch (error) {
        console.error("Error completando reserva:", error);
        return res.status(500).json({ message: RESERVA_ERRORS.SERVER_ERROR });
    }
};

export const deleteReserva = async (req, res) => {
    const { id_reserva } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RESERVA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_reserva) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    const idReservaInt = Number.parseInt(`${id_reserva}`, 10);
    if (!Number.isInteger(idReservaInt) || idReservaInt <= 0) {
        return res.status(400).json({ message: RESERVA_ERRORS.RESERVA_ID_REQUIRED });
    }

    try {
        const resolved = await resolveReservaForUser(idReservaInt, id_usuario);
        if (resolved.error) {
            return res.status(resolved.error.status).json({ message: resolved.error.message });
        }

        const { reserva } = resolved;

        await ServicioReserva.destroy({ where: { id_reserva: idReservaInt } });
        await reserva.destroy();

        return res.status(200).json({ message: RESERVA_MESSAGES.RESERVA_DELETED });
    } catch (error) {
        console.error("Error eliminando reserva:", error);
        return res.status(500).json({ message: RESERVA_ERRORS.SERVER_ERROR });
    }
};

export const getReservasByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: RESERVA_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: RESERVA_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: RESERVA_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const recursos = await Recurso.findAll({
            where: { id_negocio },
            attributes: ["id_recurso"],
        });

        const idRecursos = recursos.map((recurso) => recurso.id_recurso);

        if (!idRecursos.length) {
            return res.status(200).json({ reservas: [] });
        }

        let reservas = [];

        try {
            reservas = await Reserva.findAll({
                where: { id_recurso: idRecursos },
                order: [["fecha_hora_inicio", "DESC"]],
            });
        } catch (queryError) {
            if (!isMissingColumnError(queryError, "id_recurso")) {
                throw queryError;
            }

            const clientes = await Cliente.findAll({
                where: { id_negocio },
                attributes: ["id_cliente"],
            });

            const idClientes = clientes.map((cliente) => cliente.id_cliente);

            if (!idClientes.length) {
                return res.status(200).json({ reservas: [] });
            }

            const reservasLegacy = await Reserva.findAll({
                where: { id_cliente: idClientes },
                order: [["fecha", "DESC"], ["hora_inicio", "DESC"]],
            });

            const reservasLegacySerialized = reservasLegacy.map((reserva) => {
                const inicio = fromLegacyDateTime(reserva.fecha, reserva.hora_inicio);
                const fin = fromLegacyDateTime(reserva.fecha, reserva.hora_fin);
                const durationMinutes = inicio && fin
                    ? Math.max(1, Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000))
                    : null;

                return serializeReserva({
                    ...toPlain(reserva),
                    id_recurso: null,
                    id_servicio: null,
                    servicio_nombre: null,
                    duracion_minutos: durationMinutes,
                    fecha_hora_inicio: inicio,
                    fecha_hora_fin: fin,
                });
            });

            return res.status(200).json({ reservas: reservasLegacySerialized });
        }

        try {
            const reservaIds = reservas.map((reserva) => reserva.id_reserva);

            const serviciosReserva = reservaIds.length
                ? await ServicioReserva.findAll({ where: { id_reserva: reservaIds } })
                : [];

            const servicioIds = [...new Set(serviciosReserva.map((item) => item.id_servicio))];
            const servicios = servicioIds.length
                ? await Servicio.findAll({ where: { id_servicio: servicioIds } })
                : [];

            const servicioById = new Map(servicios.map((servicio) => [servicio.id_servicio, servicio]));
            const servicioIdByReservaId = new Map(serviciosReserva.map((item) => [item.id_reserva, item.id_servicio]));

            const reservasSerialized = reservas.map((reserva) => {
                const idServicio = servicioIdByReservaId.get(reserva.id_reserva) || null;
                const servicio = idServicio ? servicioById.get(idServicio) : null;
                const durationMinutes = Math.max(
                    1,
                    Math.round((new Date(reserva.fecha_hora_fin).getTime() - new Date(reserva.fecha_hora_inicio).getTime()) / 60000)
                );

                return serializeReserva({
                    ...toPlain(reserva),
                    id_servicio: idServicio,
                    servicio_nombre: servicio?.nombre || null,
                    duracion_minutos: durationMinutes,
                });
            });

            return res.status(200).json({ reservas: reservasSerialized });
        } catch (enrichmentError) {
            console.error("Error enriqueciendo reservas con servicios:", enrichmentError);

            const reservasFallback = reservas.map((reserva) => {
                const durationMinutes = Math.max(
                    1,
                    Math.round((new Date(reserva.fecha_hora_fin).getTime() - new Date(reserva.fecha_hora_inicio).getTime()) / 60000)
                );

                return serializeReserva({
                    ...toPlain(reserva),
                    id_servicio: null,
                    servicio_nombre: null,
                    duracion_minutos: durationMinutes,
                });
            });

            return res.status(200).json({ reservas: reservasFallback });
        }
    } catch (error) {
        console.error("Error listando reservas:", error);
        return res.status(500).json({ message: RESERVA_ERRORS.SERVER_ERROR });
    }
};
