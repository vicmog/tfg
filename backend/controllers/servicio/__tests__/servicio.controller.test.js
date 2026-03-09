import { createServicio, getServiciosByNegocio } from "../servicioController.js";
import { Servicio } from "../../../models/Servicio.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
    buildRes,
    createServicioReq,
    createServicioReqAdmin,
    createServicioReqDuracionInvalida,
    createServicioReqPrecioInvalido,
    createServicioReqSinDescripcion,
    createServicioReqSinNombre,
    createServicioReqSinPermiso,
    getServiciosReq,
    getServiciosReqSinAuth,
    getServiciosReqSinPermiso,
    mockServicioData,
    mockServicios,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
} from "./data.js";

jest.mock("../../../models/Servicio.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("ServicioController Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createServicio", () => {
        it("debería crear servicio correctamente para jefe", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Servicio.create).mockResolvedValue(mockServicioData);

            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReq, res);

            expect(Servicio.create).toHaveBeenCalledWith({
                id_negocio: 10,
                nombre: "Corte premium",
                precio: 25.5,
                duracion: 45,
                descripcion: "Corte con lavado y peinado",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Servicio creado correctamente",
                servicio: mockServicioData,
            });
        });

        it("debería crear servicio correctamente para admin con strings numéricos", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);
            (Servicio.create).mockResolvedValue({
                id_servicio: 6,
                id_negocio: 10,
                nombre: "Color completo",
                precio: 60,
                duracion: 90,
                descripcion: "Aplicación de color con secado",
            });

            const { res } = buildRes();

            await createServicio(createServicioReqAdmin, res);

            expect(Servicio.create).toHaveBeenCalledWith({
                id_negocio: 10,
                nombre: "Color completo",
                precio: 60,
                duracion: 90,
                descripcion: "Aplicación de color con secado",
            });
        });

        it("debería fallar si falta nombre", async () => {
            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReqSinNombre, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El nombre del servicio es obligatorio",
            });
        });

        it("debería fallar si falta descripción", async () => {
            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReqSinDescripcion, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "La descripción del servicio es obligatoria",
            });
        });

        it("debería fallar si el precio es inválido", async () => {
            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReqPrecioInvalido, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El precio del servicio debe ser mayor que 0",
            });
        });

        it("debería fallar si la duración es inválida", async () => {
            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReqDuracionInvalida, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "La duración del servicio debe ser un número entero mayor que 0",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReqSinPermiso, res);

            expect(Servicio.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar servicios",
            });
        });
    });

    describe("getServiciosByNegocio", () => {
        it("debería devolver servicios para jefe", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Servicio.findAll).mockResolvedValue(mockServicios);

            const { res, jsonMock } = buildRes();

            await getServiciosByNegocio(getServiciosReq, res);

            expect(Servicio.findAll).toHaveBeenCalledWith({
                where: { id_negocio: "10" },
                order: [["createdAt", "DESC"]],
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ servicios: mockServicios });
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await getServiciosByNegocio(getServiciosReqSinAuth, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si no tiene permisos", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await getServiciosByNegocio(getServiciosReqSinPermiso, res);

            expect(Servicio.findAll).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar servicios",
            });
        });
    });
});