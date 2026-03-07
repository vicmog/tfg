import { createEmpleado, deleteEmpleado, getEmpleadoById, getEmpleadosByNegocio, searchEmpleados, updateEmpleado } from "../empleadoController.js";
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
    getEmpleadoByIdReq,
    getEmpleadoByIdReqSinAuth,
    getEmpleadoByIdReqSinPermiso,
    getEmpleadosReq,
    getEmpleadosReqSinAuth,
    mockEmpleadoConDestroy,
    mockEmpleadoConUpdate,
    mockEmpleadoData,
    mockEmpleadosBusqueda,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
    searchEmpleadosReq,
    searchEmpleadosReqSinAuth,
    searchEmpleadosReqSinPermiso,
    searchEmpleadosReqSinTermino,
    updateEmpleadoReq,
    updateEmpleadoReqAdmin,
    updateEmpleadoReqSinAuth,
    updateEmpleadoReqSinContacto,
    updateEmpleadoReqSinDatos,
    updateEmpleadoReqSinPermisoGestion,
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

    describe("getEmpleadoById", () => {
        it("debería devolver los datos de un empleado", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoData);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await getEmpleadoById(getEmpleadoByIdReq, res);

            expect(Empleado.findByPk).toHaveBeenCalledWith("11");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                empleado: mockEmpleadoData,
            });
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await getEmpleadoById(getEmpleadoByIdReqSinAuth, res);

            expect(Empleado.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si el empleado no existe", async () => {
            (Empleado.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await getEmpleadoById(getEmpleadoByIdReq, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Empleado no encontrado",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoData);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await getEmpleadoById(getEmpleadoByIdReqSinPermiso, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar empleados",
            });
        });
    });

    describe("searchEmpleados", () => {
        it("debería devolver empleados por nombre o email", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Empleado.findAll).mockResolvedValue(mockEmpleadosBusqueda);

            const { res, jsonMock } = buildRes();

            await searchEmpleados(searchEmpleadosReq, res);

            expect(UsuarioNegocio.findOne).toHaveBeenCalledWith({
                where: { id_usuario: 1, id_negocio: "10" },
            });
            expect(Empleado.findAll).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                empleados: mockEmpleadosBusqueda,
            });
        });

        it("debería devolver lista vacía si el término está vacío", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await searchEmpleados(searchEmpleadosReqSinTermino, res);

            expect(Empleado.findAll).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ empleados: [] });
        });

        it("debería fallar si el usuario no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await searchEmpleados(searchEmpleadosReqSinAuth, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await searchEmpleados(searchEmpleadosReqSinPermiso, res);

            expect(Empleado.findAll).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar empleados",
            });
        });
    });

    describe("updateEmpleado", () => {
        it("debería actualizar empleado correctamente", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReq, res);

            expect(Empleado.findByPk).toHaveBeenCalledWith("11");
            expect(mockEmpleadoConUpdate.update).toHaveBeenCalledWith({
                nombre: "Laura María",
                apellido1: "Pérez",
                apellido2: "Gil",
                email: "laura.actualizada@mail.com",
                numero_telefono: "600123123",
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Empleado actualizado correctamente",
                empleado: {
                    id_empleado: 11,
                    id_negocio: 10,
                    nombre: "Laura María",
                    apellido1: "Pérez",
                    apellido2: "Gil",
                    email: "laura.actualizada@mail.com",
                    numero_telefono: "600123123",
                },
            });
        });

        it("debería permitir actualizar empleado a un admin", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);

            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReqAdmin, res);

            expect(mockEmpleadoConUpdate.update).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "Empleado actualizado correctamente",
            }));
        });

        it("debería fallar si el usuario no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReqSinAuth, res);

            expect(Empleado.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si no hay datos para actualizar", async () => {
            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReqSinDatos, res);

            expect(Empleado.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Debes indicar al menos un campo para actualizar",
            });
        });

        it("debería fallar si no hay contacto en actualización", async () => {
            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReqSinContacto, res);

            expect(Empleado.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Debes indicar email o teléfono",
            });
        });

        it("debería fallar si el empleado no existe", async () => {
            (Empleado.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReq, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Empleado no encontrado",
            });
        });

        it("debería fallar si el usuario no pertenece al negocio", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReq, res);

            expect(mockEmpleadoConUpdate.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes acceso a este negocio",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (Empleado.findByPk).mockResolvedValue(mockEmpleadoConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await updateEmpleado(updateEmpleadoReqSinPermisoGestion, res);

            expect(mockEmpleadoConUpdate.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar empleados",
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
