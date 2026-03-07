import { createEmpleado, deleteEmpleado, getEmpleadosByNegocio } from "../empleadoController.js";
import { Empleado } from "../../../models/Empleado.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
    buildRes,
    createEmpleadoReq,
    createEmpleadoReqSinNombre,
    createEmpleadoReqSinPermisoGestion,
    createEmpleadoReqSinContacto,
    deleteEmpleadoReq,
    deleteEmpleadoReqAdmin,
    deleteEmpleadoReqSinAuth,
    deleteEmpleadoReqSinPermisoGestion,
    getEmpleadosReq,
    getEmpleadosReqSinAuth,
    mockEmpleadoConDestroy,
    mockEmpleadoData,
    mockUsuarioAdmin,
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

    describe("deleteEmpleado", () => {
        it("debería eliminar empleado correctamente para jefe", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConDestroy);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await deleteEmpleado(deleteEmpleadoReq, res);

            expect(Empleado.findByPk).toHaveBeenCalledWith("11");
            expect(mockEmpleadoConDestroy.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Empleado eliminado correctamente",
            });
        });

        it("debería permitir eliminar empleado a un admin", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConDestroy);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);

            const { res, jsonMock } = buildRes();

            await deleteEmpleado(deleteEmpleadoReqAdmin, res);

            expect(mockEmpleadoConDestroy.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Empleado eliminado correctamente",
            });
        });

        it("debería fallar si el usuario no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await deleteEmpleado(deleteEmpleadoReqSinAuth, res);

            expect(Empleado.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si el empleado no existe", async () => {
            (Empleado.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await deleteEmpleado(deleteEmpleadoReq, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Empleado no encontrado",
            });
        });

        it("debería fallar si el usuario no pertenece al negocio", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConDestroy);
            (UsuarioNegocio.findOne).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await deleteEmpleado(deleteEmpleadoReq, res);

            expect(mockEmpleadoConDestroy.destroy).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes acceso a este negocio",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConDestroy);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await deleteEmpleado(deleteEmpleadoReqSinPermisoGestion, res);

            expect(mockEmpleadoConDestroy.destroy).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar empleados",
            });
        });
    });
});
