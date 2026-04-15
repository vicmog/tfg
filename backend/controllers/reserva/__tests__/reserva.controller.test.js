import { cancelReserva, createReserva, deleteReserva, getReservasByNegocio, updateReserva } from "../reservaController.js";
import { Recurso } from "../../../models/Recurso.js";
import { Cliente } from "../../../models/Cliente.js";
import { Reserva } from "../../../models/Reserva.js";
import { Servicio } from "../../../models/Servicio.js";
import { ServicioReserva } from "../../../models/ServicioReserva.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import { sendClienteEmail } from "../../../utils/mailer.js";
import {
    buildRes,
    createReservaReq,
    createReservaReqDuracionInvalida,
    createReservaReqRecurrente,
    createReservaReqSinInicio,
    cancelReservaReq,
    deleteReservaReq,
    getReservasReq,
    mockCliente,
    mockRecurso,
    mockReserva,
    mockServicio,
    mockUsuarioNegocio,
    updateReservaReq,
    updateReservaReqNotFound,
} from "./data.js";

jest.mock("../../../models/Recurso.js");
jest.mock("../../../models/Cliente.js");
jest.mock("../../../models/Reserva.js");
jest.mock("../../../models/Servicio.js");
jest.mock("../../../models/ServicioReserva.js");
jest.mock("../../../models/UsuarioNegocio.js");
jest.mock("../../../utils/mailer.js", () => ({
    sendClienteEmail: jest.fn().mockResolvedValue({}),
}));

describe("ReservaController Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Reserva.sequelize = {
            transaction: jest.fn().mockResolvedValue({
                commit: jest.fn().mockResolvedValue(undefined),
                rollback: jest.fn().mockResolvedValue(undefined),
            }),
        };
    });

    describe("createReserva", () => {
        it("deberia crear una reserva y enviar email", async () => {
            Recurso.findByPk.mockResolvedValue(mockRecurso);
            Cliente.findByPk.mockResolvedValue(mockCliente);
            Servicio.findByPk.mockResolvedValue(mockServicio);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);
            Reserva.findOne.mockResolvedValue(null);
            Reserva.create.mockResolvedValue(mockReserva);
            ServicioReserva.create.mockResolvedValue({ id_servicio: 3, id_reserva: 11 });

            const { res, jsonMock } = buildRes();
            await createReserva(createReservaReq, res);

            expect(Reserva.create).toHaveBeenCalled();
            expect(ServicioReserva.create).toHaveBeenCalledWith(
                { id_servicio: 3, id_reserva: 11 },
                expect.objectContaining({ transaction: expect.any(Object) })
            );
            expect(sendClienteEmail).toHaveBeenCalledWith(
                "cliente@test.com",
                "Confirmacion de reserva",
                expect.stringContaining("Tu reserva ha sido registrada correctamente")
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "Reserva registrada correctamente",
                reserva: expect.objectContaining({ id_reserva: 11 }),
                reservas: expect.arrayContaining([expect.objectContaining({ id_reserva: 11 })]),
            }));
        });

        it("deberia validar fecha inicio obligatoria", async () => {
            const { res, jsonMock } = buildRes();

            await createReserva(createReservaReqSinInicio, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "La fecha y hora de inicio es obligatoria",
            });
        });

        it("deberia validar duracion correcta", async () => {
            const { res, jsonMock } = buildRes();

            await createReserva(createReservaReqDuracionInvalida, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "La duracion de la reserva debe ser un numero entero mayor que 0",
            });
        });

        it("deberia rechazar reservas solapadas", async () => {
            Recurso.findByPk.mockResolvedValue(mockRecurso);
            Cliente.findByPk.mockResolvedValue(mockCliente);
            Servicio.findByPk.mockResolvedValue(mockServicio);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);
            Reserva.findOne.mockResolvedValue({ id_reserva: 20 });

            const { res, jsonMock } = buildRes();
            await createReserva(createReservaReq, res);

            expect(Reserva.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "Ya existe una reserva para ese recurso en el rango indicado",
            }));
        });

        it("deberia crear una recurrencia y devolver todas las reservas", async () => {
            const reserva1 = {
                ...mockReserva,
                id_reserva: 11,
                fecha_hora_inicio: new Date("2026-04-12T09:00:00.000Z"),
                fecha_hora_fin: new Date("2026-04-12T10:00:00.000Z"),
            };
            const reserva2 = {
                ...mockReserva,
                id_reserva: 12,
                fecha_hora_inicio: new Date("2026-04-19T09:00:00.000Z"),
                fecha_hora_fin: new Date("2026-04-19T10:00:00.000Z"),
            };
            const reserva3 = {
                ...mockReserva,
                id_reserva: 13,
                fecha_hora_inicio: new Date("2026-04-26T09:00:00.000Z"),
                fecha_hora_fin: new Date("2026-04-26T10:00:00.000Z"),
            };

            Recurso.findByPk.mockResolvedValue(mockRecurso);
            Cliente.findByPk.mockResolvedValue(mockCliente);
            Servicio.findByPk.mockResolvedValue(mockServicio);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);
            Reserva.findOne.mockResolvedValue(null);
            Reserva.create
                .mockResolvedValueOnce(reserva1)
                .mockResolvedValueOnce(reserva2)
                .mockResolvedValueOnce(reserva3);
            ServicioReserva.create.mockResolvedValue({});

            const { res, jsonMock } = buildRes();
            await createReserva(createReservaReqRecurrente, res);

            expect(Reserva.findOne).toHaveBeenCalledTimes(3);
            expect(Reserva.create).toHaveBeenCalledTimes(3);
            expect(ServicioReserva.create).toHaveBeenCalledTimes(3);
            expect(sendClienteEmail).toHaveBeenCalledWith(
                "cliente@test.com",
                "Confirmacion de reserva",
                expect.stringContaining("Tus 3 reservas recurrentes han sido registradas correctamente.")
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "Reservas recurrentes registradas correctamente",
                reserva: expect.objectContaining({ id_reserva: 11 }),
                reservas: expect.arrayContaining([
                    expect.objectContaining({ id_reserva: 11 }),
                    expect.objectContaining({ id_reserva: 12 }),
                    expect.objectContaining({ id_reserva: 13 }),
                ]),
            }));
        });

        it("deberia rechazar una recurrencia con conflictos", async () => {
            Recurso.findByPk.mockResolvedValue(mockRecurso);
            Cliente.findByPk.mockResolvedValue(mockCliente);
            Servicio.findByPk.mockResolvedValue(mockServicio);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);
            Reserva.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id_reserva: 20 })
                .mockResolvedValueOnce(null);

            const { res, jsonMock } = buildRes();
            await createReserva(createReservaReqRecurrente, res);

            expect(Reserva.create).not.toHaveBeenCalled();
            expect(ServicioReserva.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "No se pudo registrar la recurrencia porque hay conflictos con reservas existentes",
                conflictos: expect.arrayContaining([
                    expect.objectContaining({ ocurrencia: 2 }),
                ]),
            }));
        });
    });

    describe("getReservasByNegocio", () => {
        it("deberia devolver reservas por negocio", async () => {
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);
            Recurso.findAll.mockResolvedValue([{ id_recurso: 7 }]);
            Reserva.findAll.mockResolvedValue([mockReserva]);
            ServicioReserva.findAll.mockResolvedValue([{ id_reserva: 11, id_servicio: 3 }]);
            Servicio.findAll.mockResolvedValue([mockServicio]);

            const { res, jsonMock } = buildRes();
            await getReservasByNegocio(getReservasReq, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                reservas: [expect.objectContaining({ id_reserva: 11 })],
            });
        });
    });

    describe("updateReserva", () => {
        it("deberia actualizar una reserva correctamente", async () => {
            const updateMock = jest.fn().mockResolvedValue({});
            const reservaInstance = {
                ...mockReserva,
                update: updateMock,
            };

            Reserva.findByPk.mockResolvedValue(reservaInstance);
            Recurso.findByPk.mockResolvedValue(mockRecurso);
            Cliente.findByPk.mockResolvedValue(mockCliente);
            Servicio.findByPk.mockResolvedValue(mockServicio);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);
            Reserva.findOne.mockResolvedValue(null);
            ServicioReserva.destroy.mockResolvedValue(1);
            ServicioReserva.create.mockResolvedValue({ id_servicio: 3, id_reserva: 11 });

            const { res, jsonMock } = buildRes();
            await updateReserva(updateReservaReq, res);

            expect(updateMock).toHaveBeenCalled();
            expect(ServicioReserva.destroy).toHaveBeenCalledWith({ where: { id_reserva: 11 } });
            expect(ServicioReserva.create).toHaveBeenCalledWith({ id_servicio: 3, id_reserva: 11 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Reserva actualizada correctamente",
                reserva: expect.objectContaining({ id_reserva: 11 }),
            });
        });

        it("deberia devolver 404 si la reserva no existe", async () => {
            Reserva.findByPk.mockResolvedValue(null);

            const { res, jsonMock } = buildRes();
            await updateReserva(updateReservaReqNotFound, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Reserva no encontrada",
            });
        });
    });

    describe("cancelReserva", () => {
        it("deberia cancelar una reserva", async () => {
            const reservaInstance = {
                ...mockReserva,
                estado: "pendiente",
                update: jest.fn().mockResolvedValue({}),
                toJSON: jest.fn().mockReturnValue({ ...mockReserva, estado: "cancelada" }),
            };

            Reserva.findByPk.mockResolvedValue(reservaInstance);
            Recurso.findByPk.mockResolvedValue(mockRecurso);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);

            const { res, jsonMock } = buildRes();
            await cancelReserva(cancelReservaReq, res);

            expect(reservaInstance.update).toHaveBeenCalledWith({ estado: "cancelada" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Reserva cancelada correctamente" })
            );
        });

        it("no deberia cancelar una reserva ya cancelada", async () => {
            const reservaInstance = {
                ...mockReserva,
                estado: "cancelada",
                update: jest.fn(),
            };

            Reserva.findByPk.mockResolvedValue(reservaInstance);
            Recurso.findByPk.mockResolvedValue(mockRecurso);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);

            const { res, jsonMock } = buildRes();
            await cancelReserva(cancelReservaReq, res);

            expect(reservaInstance.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({ message: "La reserva ya estaba cancelada" });
        });
    });

    describe("deleteReserva", () => {
        it("deberia eliminar una reserva", async () => {
            const reservaInstance = {
                ...mockReserva,
                destroy: jest.fn().mockResolvedValue({}),
            };

            Reserva.findByPk.mockResolvedValue(reservaInstance);
            Recurso.findByPk.mockResolvedValue(mockRecurso);
            UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioNegocio);
            ServicioReserva.destroy.mockResolvedValue(1);

            const { res, jsonMock } = buildRes();
            await deleteReserva(deleteReservaReq, res);

            expect(ServicioReserva.destroy).toHaveBeenCalledWith({ where: { id_reserva: 11 } });
            expect(reservaInstance.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Reserva eliminada correctamente" });
        });
    });
});
