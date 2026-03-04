import { createEmpleado, getEmpleadosByNegocio } from "../empleadoController.js";
import { Empleado } from "../../../models/Empleado.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
    buildRes,
    createEmpleadoReq,
    createEmpleadoReqSinNombre,
    createEmpleadoReqSinPermisoGestion,
    createEmpleadoReqSinContacto,
    getEmpleadosReq,
    getEmpleadosReqSinAuth,
    mockEmpleadoData,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
} from "./data.js";

jest.mock("../../../models/Empleado.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("EmpleadoController Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createEmpleado", () => {
        it("debería crear empleado correctamente", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Empleado.create).mockResolvedValue(mockEmpleadoData);

            const { res, jsonMock } = buildRes();

            await createEmpleado(createEmpleadoReq, res);

            expect(Empleado.create).toHaveBeenCalledWith({
                id_negocio: 10,
                nombre: "Laura",
                apellido1: "Pérez",
                apellido2: null,
                numero_telefono: null,
                email: "laura@mail.com",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Empleado creado correctamente",
                empleado: mockEmpleadoData,
            });
        });

        it("debería fallar si falta nombre", async () => {
            const { res, jsonMock } = buildRes();

            await createEmpleado(createEmpleadoReqSinNombre, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El nombre del empleado es obligatorio",
            });
        });

        it("debería fallar si no hay contacto", async () => {
            const { res, jsonMock } = buildRes();

            await createEmpleado(createEmpleadoReqSinContacto, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Debes indicar email o teléfono",
            });
        });

        it("debería fallar si el usuario no es jefe/admin", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await createEmpleado(createEmpleadoReqSinPermisoGestion, res);

            expect(Empleado.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar empleados",
            });
        });
    });

    describe("getEmpleadosByNegocio", () => {
        it("debería devolver empleados del negocio", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Empleado.findAll).mockResolvedValue([mockEmpleadoData]);

            const { res, jsonMock } = buildRes();

            await getEmpleadosByNegocio(getEmpleadosReq, res);

            expect(Empleado.findAll).toHaveBeenCalledWith({
                where: { id_negocio: "10" },
                order: [["createdAt", "DESC"]],
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ empleados: [mockEmpleadoData] });
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await getEmpleadosByNegocio(getEmpleadosReqSinAuth, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });
    });
});
