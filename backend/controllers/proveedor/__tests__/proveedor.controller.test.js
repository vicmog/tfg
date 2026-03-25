import {
    createProveedor,
    deleteProveedor,
    getProveedoresByNegocio,
    updateProveedor,
} from "../proveedorController.js";
import { Proveedor } from "../../../models/Proveedor.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
    buildRes,
    createProveedorReq,
    createProveedorReqAdmin,
    createProveedorReqEmailInvalido,
    createProveedorReqSinCanal,
    createProveedorReqSinCif,
    createProveedorReqSinContacto,
    createProveedorReqSinNombre,
    createProveedorReqSinPermiso,
    createProveedorReqSinTipo,
    deleteProveedorReq,
    deleteProveedorReqAdmin,
    deleteProveedorReqSinAuth,
    deleteProveedorReqSinPermiso,
    getProveedoresReq,
    getProveedoresReqSinAuth,
    getProveedoresReqSinPermiso,
    mockProveedorData,
    mockProveedorEntity,
    mockProveedores,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
    updateProveedorReq,
    updateProveedorReqSinCanal,
    updateProveedorReqSinNombre,
    updateProveedorReqSinPermiso,
} from "./data.js";

jest.mock("../../../models/Proveedor.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("ProveedorController Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createProveedor", () => {
        it("debería crear proveedor correctamente para jefe", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Proveedor.create).mockResolvedValue(mockProveedorData);

            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReq, res);

            expect(Proveedor.create).toHaveBeenCalledWith({
                id_negocio: 10,
                nombre: "Distribuciones Norte",
                cif_nif: "B12345678",
                contacto: "Laura Pérez",
                telefono: "600123123",
                email: "proveedor@mail.com",
                tipo_proveedor: "Material de peluquería",
                direccion: "Calle Mayor 1",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Proveedor creado correctamente",
                proveedor: mockProveedorData,
            });
        });

        it("debería crear proveedor correctamente para admin", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);
            (Proveedor.create).mockResolvedValue(mockProveedores[1]);

            const { res } = buildRes();

            await createProveedor(createProveedorReqAdmin, res);

            expect(Proveedor.create).toHaveBeenCalledWith({
                id_negocio: 10,
                nombre: "Cosméticos Pro",
                cif_nif: "A87654321",
                contacto: "Pablo Gómez",
                telefono: null,
                email: "contacto@cosmeticospro.com",
                tipo_proveedor: "Cosmética",
                direccion: "Avenida Sol 12",
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("debería fallar si falta nombre", async () => {
            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReqSinNombre, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El nombre del proveedor es obligatorio",
            });
        });

        it("debería fallar si falta CIF/NIF", async () => {
            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReqSinCif, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El CIF/NIF del proveedor es obligatorio",
            });
        });

        it("debería fallar si falta contacto", async () => {
            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReqSinContacto, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "La persona de contacto es obligatoria",
            });
        });

        it("debería fallar si falta teléfono y email", async () => {
            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReqSinCanal, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Debes indicar teléfono o email",
            });
        });

        it("debería fallar con email inválido", async () => {
            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReqEmailInvalido, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El email no tiene un formato válido",
            });
        });

        it("debería fallar si falta tipo de proveedor", async () => {
            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReqSinTipo, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El tipo de proveedor es obligatorio",
            });
        });

        it("debería fallar si no tiene permisos de gestión", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await createProveedor(createProveedorReqSinPermiso, res);

            expect(Proveedor.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar proveedores",
            });
        });
    });

    describe("getProveedoresByNegocio", () => {
        it("debería devolver proveedores para jefe", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Proveedor.findAll).mockResolvedValue(mockProveedores);

            const { res, jsonMock } = buildRes();

            await getProveedoresByNegocio(getProveedoresReq, res);

            expect(Proveedor.findAll).toHaveBeenCalledWith({
                where: { id_negocio: "10" },
                order: [["createdAt", "DESC"]],
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                proveedores: mockProveedores,
            });
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await getProveedoresByNegocio(getProveedoresReqSinAuth, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si el usuario no es jefe ni admin", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await getProveedoresByNegocio(getProveedoresReqSinPermiso, res);

            expect(Proveedor.findAll).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar proveedores",
            });
        });
    });

    describe("deleteProveedor", () => {
        it("debería eliminar proveedor correctamente para jefe", async () => {
            (Proveedor.findByPk).mockResolvedValue(mockProveedorEntity);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await deleteProveedor(deleteProveedorReq, res);

            expect(Proveedor.findByPk).toHaveBeenCalledWith("7");
            expect(UsuarioNegocio.findOne).toHaveBeenCalledWith({
                where: { id_usuario: 1, id_negocio: 10 },
            });
            expect(mockProveedorEntity.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Proveedor eliminado correctamente",
            });
        });

        it("debería eliminar proveedor correctamente para admin", async () => {
            const proveedor = { ...mockProveedorEntity, destroy: jest.fn() };
            (Proveedor.findByPk).mockResolvedValue(proveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);

            const { res } = buildRes();

            await deleteProveedor(deleteProveedorReqAdmin, res);

            expect(proveedor.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("debería fallar si no está autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await deleteProveedor(deleteProveedorReqSinAuth, res);

            expect(Proveedor.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("debería fallar si el proveedor no existe", async () => {
            (Proveedor.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await deleteProveedor(deleteProveedorReq, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Proveedor no encontrado",
            });
        });

        it("debería fallar si no tiene acceso al negocio", async () => {
            (Proveedor.findByPk).mockResolvedValue(mockProveedorEntity);
            (UsuarioNegocio.findOne).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await deleteProveedor(deleteProveedorReq, res);

            expect(mockProveedorEntity.destroy).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes acceso a este negocio",
            });
        });

        it("debería fallar si no tiene permisos de gestión", async () => {
            (Proveedor.findByPk).mockResolvedValue(mockProveedorEntity);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await deleteProveedor(deleteProveedorReqSinPermiso, res);

            expect(mockProveedorEntity.destroy).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar proveedores",
            });
        });
    });

    describe("updateProveedor", () => {
        it("debería actualizar proveedor correctamente para jefe", async () => {
            const proveedor = {
                ...mockProveedorEntity,
                update: jest.fn(async function updateProveedor(data) {
                    Object.assign(this, data);
                    return this;
                }),
            };
            (Proveedor.findByPk).mockResolvedValue(proveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await updateProveedor(updateProveedorReq, res);

            expect(Proveedor.findByPk).toHaveBeenCalledWith("7");
            expect(proveedor.update).toHaveBeenCalledWith({
                nombre: "Distribuciones Norte 2",
                cif_nif: "B12345678",
                contacto: "Laura Pérez",
                telefono: "699000111",
                email: "nuevo@mail.com",
                tipo_proveedor: "Material de peluquería",
                direccion: "Calle Mayor 22",
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Proveedor actualizado correctamente",
                proveedor: expect.objectContaining({
                    id_proveedor: 7,
                    nombre: "Distribuciones Norte 2",
                    telefono: "699000111",
                    email: "nuevo@mail.com",
                }),
            });
        });

        it("debería fallar si falta nombre", async () => {
            const { res, jsonMock } = buildRes();

            await updateProveedor(updateProveedorReqSinNombre, res);

            expect(Proveedor.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El nombre del proveedor es obligatorio",
            });
        });

        it("debería fallar si faltan teléfono y email", async () => {
            const { res, jsonMock } = buildRes();

            await updateProveedor(updateProveedorReqSinCanal, res);

            expect(Proveedor.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Debes indicar teléfono o email",
            });
        });

        it("debería fallar si el proveedor no existe", async () => {
            (Proveedor.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await updateProveedor(updateProveedorReq, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Proveedor no encontrado",
            });
        });

        it("debería fallar si no tiene permisos de gestión", async () => {
            const proveedor = {
                ...mockProveedorEntity,
                update: jest.fn(),
            };
            (Proveedor.findByPk).mockResolvedValue(proveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await updateProveedor(updateProveedorReqSinPermiso, res);

            expect(proveedor.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar proveedores",
            });
        });
    });
});
