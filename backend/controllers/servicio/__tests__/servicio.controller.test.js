import { createServicio, deleteServicio, getServiciosByNegocio, updateServicio, getServicioById, searchServicios } from "../servicioController.js";
import { ProductoServicio } from "../../../models/ProductoServicio.js";
import { Servicio } from "../../../models/Servicio.js";
import { Recurso } from "../../../models/Recurso.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import { sequelize } from "../../../models/db.js";
import {
    buildRes,
    createServicioReq,
    createServicioReqAdmin,
    createServicioReqDuracionInvalida,
    createServicioReqPrecioInvalido,
    createServicioReqRecursoFavoritoInvalido,
    createServicioReqSinDescripcion,
    createServicioReqSinNombre,
    createServicioReqSinPermiso,
    deleteServicioReq,
    deleteServicioReqAdmin,
    deleteServicioReqSinAuth,
    deleteServicioReqSinPermiso,
    getServiciosReq,
    getServiciosReqSinAuth,
    getServiciosReqSinPermiso,
    mockServicioConDestroy,
    mockServicioConUpdate,
    mockServicioData,
    mockServicios,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
    updateServicioReq,
    updateServicioReqAdmin,
    updateServicioReqSinAuth,
    updateServicioReqSinNombre,
    updateServicioReqSinPermiso,
} from "./data.js";

jest.mock("../../../models/Servicio.js");
jest.mock("../../../models/ProductoServicio.js");
jest.mock("../../../models/Recurso.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("ServicioController Unit Tests", () => {
    let transactionSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        transactionSpy = jest.spyOn(sequelize, "transaction").mockImplementation(async (callback) => callback({}));
    });

    afterEach(() => {
        transactionSpy.mockRestore();
    });

    describe("createServicio", () => {
        it("debería crear servicio correctamente para jefe", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (ProductoServicio.create).mockResolvedValue({ id_ps: 101 });
            (Servicio.create).mockResolvedValue(mockServicioData);

            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReq, res);

            expect(Servicio.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_negocio: 10,
                    nombre: "Corte premium",
                    precio: 25.5,
                    duracion: 45,
                    requiere_capacidad: false,
                    id_recurso_favorito: null,
                    id_ps: expect.any(Number),
                }),
                expect.objectContaining({ transaction: expect.any(Object) })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Servicio creado correctamente",
                servicio: expect.objectContaining({
                    id_servicio: 5,
                    id_negocio: 10,
                    id_recurso_favorito: null,
                    nombre: "Corte premium",
                    precio: 25.5,
                    duracion: 45,
                    descripcion: "Corte con lavado y peinado",
                    requiere_capacidad: false,
                }),
            });
        });

        it("debería crear servicio correctamente para admin con strings numéricos", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);
            (Recurso.findOne).mockResolvedValue({ id_recurso: 8, id_negocio: 10, nombre: "Sala A" });
            (ProductoServicio.create).mockResolvedValue({ id_ps: 102 });
            (Servicio.create).mockResolvedValue({
                id_servicio: 6,
                id_negocio: 10,
                id_recurso_favorito: 8,
                nombre: "Color completo",
                precio: 60,
                duracion: 90,
                descripcion: "Aplicación de color con secado",
            });

            const { res } = buildRes();

            await createServicio(createServicioReqAdmin, res);

            expect(Servicio.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_negocio: 10,
                    nombre: "Color completo",
                    precio: 60,
                    duracion: 90,
                    requiere_capacidad: false,
                    id_recurso_favorito: 8,
                    id_ps: expect.any(Number),
                }),
                expect.objectContaining({ transaction: expect.any(Object) })
            );
        });

        it("debería fallar si id_recurso_favorito no es válido", async () => {
            const { res, jsonMock } = buildRes();

            await createServicio(createServicioReqRecursoFavoritoInvalido, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El recurso favorito debe ser un número entero mayor que 0 o nulo",
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

            expect(Servicio.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.any(Array),
                    order: [["createdAt", "DESC"]],
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                servicios: [
                    expect.objectContaining({
                        id_servicio: 5,
                        id_negocio: 10,
                        id_recurso_favorito: null,
                        nombre: "Corte premium",
                        precio: 25.5,
                        duracion: 45,
                        descripcion: "Corte con lavado y peinado",
                        requiere_capacidad: false,
                    }),
                    expect.objectContaining({
                        id_servicio: 6,
                        id_negocio: 10,
                        id_recurso_favorito: 8,
                        nombre: "Color completo",
                        precio: 60,
                        duracion: 90,
                        descripcion: "Aplicación de color con secado",
                        requiere_capacidad: false,
                    }),
                ],
            });
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await getServiciosByNegocio(getServiciosReqSinAuth, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería devolver servicios para trabajador", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);
            (Servicio.findAll).mockResolvedValue(mockServicios);

            const { res, jsonMock } = buildRes();

            await getServiciosByNegocio(getServiciosReqSinPermiso, res);

            expect(Servicio.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.any(Array),
                    order: [["createdAt", "DESC"]],
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                servicios: [
                    expect.objectContaining({
                        id_servicio: 5,
                        id_negocio: 10,
                        id_recurso_favorito: null,
                    }),
                    expect.objectContaining({
                        id_servicio: 6,
                        id_negocio: 10,
                        id_recurso_favorito: 8,
                    }),
                ],
            });
        });
    });

    describe("updateServicio", () => {
        it("debería actualizar servicio correctamente para jefe", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await updateServicio(updateServicioReq, res);

            expect(mockServicioConUpdate.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_negocio: 10,
                    nombre: "Corte premium actualizado",
                    precio: 30,
                    duracion: 50,
                    requiere_capacidad: false,
                    id_recurso_favorito: null,
                }),
                expect.objectContaining({ transaction: expect.any(Object) })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Servicio actualizado correctamente",
                servicio: expect.objectContaining({
                    nombre: "Corte premium actualizado",
                    precio: 30,
                    duracion: 50,
                    requiere_capacidad: false,
                    id_recurso_favorito: null,
                    id_servicio: 5,
                    id_negocio: 10,
                }),
            });
        });

        it("debería actualizar servicio correctamente para admin", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);
            (Recurso.findOne).mockResolvedValue({ id_recurso: 8, id_negocio: 10, nombre: "Sala A" });

            const { res } = buildRes();

            await updateServicio(updateServicioReqAdmin, res);

            expect(mockServicioConUpdate.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_negocio: 10,
                    nombre: "Color actualizado",
                    precio: 70,
                    duracion: 95,
                    requiere_capacidad: false,
                    id_recurso_favorito: 8,
                }),
                expect.objectContaining({ transaction: expect.any(Object) })
            );
            expect(Recurso.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id_recurso: 8,
                        id_negocio: 10,
                    },
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await updateServicio(updateServicioReqSinAuth, res);

            expect(Servicio.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si el servicio no existe", async () => {
            (Servicio.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await updateServicio(updateServicioReq, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Servicio no encontrado",
            });
        });

        it("debería fallar si falta nombre", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await updateServicio(updateServicioReqSinNombre, res);

            expect(mockServicioConUpdate.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El nombre del servicio es obligatorio",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioConUpdate);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await updateServicio(updateServicioReqSinPermiso, res);

            expect(mockServicioConUpdate.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar servicios",
            });
        });
    });

    describe("deleteServicio", () => {
        it("debería eliminar servicio correctamente para jefe", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioConDestroy);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await deleteServicio(deleteServicioReq, res);

            expect(ProductoServicio.destroy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id_ps: 5 },
                    transaction: expect.any(Object),
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Servicio eliminado correctamente",
            });
        });

        it("debería eliminar servicio correctamente para admin", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioConDestroy);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);

            const { res } = buildRes();

            await deleteServicio(deleteServicioReqAdmin, res);

            expect(ProductoServicio.destroy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id_ps: 5 },
                    transaction: expect.any(Object),
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await deleteServicio(deleteServicioReqSinAuth, res);

            expect(Servicio.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si el servicio no existe", async () => {
            (Servicio.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await deleteServicio(deleteServicioReq, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Servicio no encontrado",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioConDestroy);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await deleteServicio(deleteServicioReqSinPermiso, res);

            expect(mockServicioConDestroy.destroy).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar servicios",
            });
        });
    });

    describe("getServicioById", () => {
        it("debería obtener servicio por ID correctamente", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioData);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();
            const req = {
                params: { id_servicio: 5 },
                user: { id_usuario: 1 },
            };

            await getServicioById(req, res);

            expect(Servicio.findByPk).toHaveBeenCalledWith(5, expect.objectContaining({ include: expect.any(Array) }));
            expect(UsuarioNegocio.findOne).toHaveBeenCalledWith({
                where: { id_usuario: 1, id_negocio: 10 },
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                servicio: expect.objectContaining({
                    id_servicio: 5,
                    id_negocio: 10,
                    id_recurso_favorito: null,
                    nombre: "Corte premium",
                    precio: 25.5,
                    duracion: 45,
                    descripcion: "Corte con lavado y peinado",
                    requiere_capacidad: false,
                }),
            });
        });

        it("debería fallar si el servicio no existe", async () => {
            (Servicio.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();
            const req = {
                params: { id_servicio: 999 },
                user: { id_usuario: 1 },
            };

            await getServicioById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Servicio no encontrado",
            });
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();
            const req = {
                params: { id_servicio: 5 },
                user: {},
            };

            await getServicioById(req, res);

            expect(Servicio.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si no tiene acceso al negocio", async () => {
            (Servicio.findByPk).mockResolvedValue(mockServicioData);
            (UsuarioNegocio.findOne).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();
            const req = {
                params: { id_servicio: 5 },
                user: { id_usuario: 99 },
            };

            await getServicioById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes acceso a este negocio",
            });
        });
    });

    describe("searchServicios", () => {
        it("debería buscar servicios por nombre", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Servicio.findAll).mockResolvedValue([
                {
                    ...mockServicioData,
                    base: {
                        id_negocio: 10,
                        nombre: "Corte premium",
                        descripcion: "Corte con lavado y peinado",
                    },
                },
            ]);

            const { res, jsonMock } = buildRes();
            const req = {
                query: { id_negocio: 10, q: "Corte" },
                user: { id_usuario: 1 },
            };

            await searchServicios(req, res);

            expect(UsuarioNegocio.findOne).toHaveBeenCalledWith({
                where: { id_usuario: 1, id_negocio: 10 },
            });
            expect(Servicio.findAll).toHaveBeenCalledWith(expect.objectContaining({ include: expect.any(Array) }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                servicios: [
                    expect.objectContaining({
                        id_servicio: 5,
                        id_negocio: 10,
                        nombre: "Corte premium",
                    }),
                ],
            });
        });

        it("debería buscar servicios por texto de búsqueda", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Servicio.findAll).mockResolvedValue([
                {
                    ...mockServicioData,
                    base: {
                        id_negocio: 10,
                        nombre: "Corte premium",
                        descripcion: "Corte con lavado y peinado",
                    },
                },
                {
                    ...mockServicios[1],
                    base: {
                        id_negocio: 10,
                        nombre: "Color completo",
                        descripcion: "Aplicación de color con secado",
                    },
                },
            ]);

            const { res, jsonMock } = buildRes();
            const req = {
                query: { id_negocio: 10, q: "Color" },
                user: { id_usuario: 1 },
            };

            await searchServicios(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                servicios: [
                    expect.objectContaining({ id_servicio: 6, nombre: "Color completo" }),
                ],
            });
        });

        it("debería retornar todos los servicios sin parámetros de búsqueda", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Servicio.findAll).mockResolvedValue([
                {
                    ...mockServicioData,
                    base: {
                        id_negocio: 10,
                        nombre: "Corte premium",
                        descripcion: "Corte con lavado y peinado",
                    },
                },
                {
                    ...mockServicios[1],
                    base: {
                        id_negocio: 10,
                        nombre: "Color completo",
                        descripcion: "Aplicación de color con secado",
                    },
                },
            ]);

            const { res, jsonMock } = buildRes();
            const req = {
                query: { id_negocio: 10 },
                user: { id_usuario: 1 },
            };

            await searchServicios(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                servicios: expect.arrayContaining([
                    expect.objectContaining({ id_servicio: 5, nombre: "Corte premium" }),
                    expect.objectContaining({ id_servicio: 6, nombre: "Color completo" }),
                ]),
            });
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();
            const req = {
                query: { id_negocio: 10 },
                user: {},
            };

            await searchServicios(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si no tiene acceso al negocio", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();
            const req = {
                query: { id_negocio: 10 },
                user: { id_usuario: 1 },
            };

            await searchServicios(req, res);

            expect(Servicio.findAll).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes acceso a este negocio",
            });
        });
    });
});