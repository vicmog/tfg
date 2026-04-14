import { createReserva, getReservasByNegocio, updateReserva } from "../reservaController.js";
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
    createReservaReqSinInicio,
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
            expect(ServicioReserva.create).toHaveBeenCalledWith({ id_servicio: 3, id_reserva: 11 });
            expect(sendClienteEmail).toHaveBeenCalledWith(
                "cliente@test.com",
                "Confirmacion de reserva",
                expect.stringContaining("Tu reserva ha sido registrada correctamente")
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Reserva registrada correctamente",
                reserva: expect.objectContaining({ id_reserva: 11 }),
            });
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
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Ya existe una reserva para ese recurso en el rango indicado",
            });
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
});
