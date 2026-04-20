import { createPlantilla, deletePlantilla, getPlantillas, updatePlantilla } from "../plantillaController.js";
import { Plantilla } from "../../../models/Plantilla.js";
import { ServicioPlantilla } from "../../../models/ServicioPlantilla.js";
import { RecursoPlantilla } from "../../../models/RecursoPlantilla.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import { sequelize } from "../../../models/db.js";

jest.mock("../../../models/Plantilla.js");
jest.mock("../../../models/ServicioPlantilla.js");
jest.mock("../../../models/RecursoPlantilla.js");
jest.mock("../../../models/UsuarioNegocio.js");

const buildRes = () => {
  const jsonMock = jest.fn();
  const res = {
    status: jest.fn(() => ({ json: jsonMock })),
  };
  return { res, jsonMock };
};

const validBody = {
  nombre: "Plantilla Barberia",
  descripcion: "Plantilla base",
  servicios: [
    { nombre: "Corte", precio: 12, duracion: 30, descripcion: "Corte clasico", requiere_capacidad: true },
  ],
  recursos: [
    { nombre: "Sillon", capacidad: 1 },
  ],
};

describe("PlantillaController Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(sequelize, "transaction").mockImplementation(async (callback) => callback({}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deberia crear una plantilla correctamente", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, rol: "admin" });
    (Plantilla.findOne).mockResolvedValue(null);

    (Plantilla.create).mockResolvedValue({
      id_plantilla: 10,
      nombre: "Plantilla Barberia",
      descripcion: "Plantilla base",
    });

    (ServicioPlantilla.bulkCreate).mockResolvedValue([
      {
        id_servicio_plantilla: 20,
        nombre: "Corte",
        precio: 12,
        duracion: 30,
        descripcion: "Corte clasico",
        requiere_capacidad: true,
      },
    ]);

    (RecursoPlantilla.bulkCreate).mockResolvedValue([
      {
        id_recurso_plantilla: 30,
        nombre: "Sillon",
        capacidad: 1,
      },
    ]);

    const req = {
      user: { id_usuario: 1 },
      body: validBody,
    };
    const { res, jsonMock } = buildRes();

    await createPlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Plantilla creada correctamente",
      plantilla: {
        id_plantilla: 10,
        nombre: "Plantilla Barberia",
        descripcion: "Plantilla base",
        servicios: [
          {
            id_servicio_plantilla: 20,
            nombre: "Corte",
            precio: 12,
            duracion: 30,
            descripcion: "Corte clasico",
            requiere_capacidad: true,
          },
        ],
        recursos: [
          {
            id_recurso_plantilla: 30,
            nombre: "Sillon",
            capacidad: 1,
          },
        ],
      },
    });
  });

  it("deberia fallar si no hay usuario autenticado", async () => {
    const req = { user: null, body: validBody };
    const { res, jsonMock } = buildRes();

    await createPlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Usuario no autenticado" });
  });

  it("deberia fallar si el usuario no es admin", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue(null);

    const req = { user: { id_usuario: 2 }, body: validBody };
    const { res, jsonMock } = buildRes();

    await createPlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ message: "No tienes permisos para crear plantillas" });
  });

  it("deberia fallar si falta el nombre", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, rol: "admin" });

    const req = {
      user: { id_usuario: 1 },
      body: { ...validBody, nombre: " " },
    };
    const { res, jsonMock } = buildRes();

    await createPlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "El nombre de la plantilla es obligatorio" });
  });

  it("deberia fallar si servicios esta vacio", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, rol: "admin" });

    const req = {
      user: { id_usuario: 1 },
      body: { ...validBody, servicios: [] },
    };
    const { res, jsonMock } = buildRes();

    await createPlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Debes enviar al menos un servicio" });
  });

  it("deberia devolver plantillas para admin", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, rol: "admin" });
    (Plantilla.findAll).mockResolvedValue([
      { id_plantilla: 1, nombre: "Plantilla A", descripcion: "Desc A" },
    ]);
    (ServicioPlantilla.findAll).mockResolvedValue([
      {
        id_servicio_plantilla: 11,
        id_plantilla: 1,
        nombre: "Corte",
        precio: 10,
        duracion: 30,
        descripcion: "Desc",
        requiere_capacidad: true,
      },
    ]);
    (RecursoPlantilla.findAll).mockResolvedValue([
      {
        id_recurso_plantilla: 21,
        id_plantilla: 1,
        nombre: "Silla",
        capacidad: 1,
      },
    ]);

    const req = { user: { id_usuario: 1 } };
    const { res, jsonMock } = buildRes();

    await getPlantillas(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Plantillas obtenidas correctamente",
      plantillas: [
        {
          id_plantilla: 1,
          nombre: "Plantilla A",
          descripcion: "Desc A",
          servicios: [
            {
              id_servicio_plantilla: 11,
              id_plantilla: 1,
              nombre: "Corte",
              precio: 10,
              duracion: 30,
              descripcion: "Desc",
              requiere_capacidad: true,
            },
          ],
          recursos: [
            {
              id_recurso_plantilla: 21,
              id_plantilla: 1,
              nombre: "Silla",
              capacidad: 1,
            },
          ],
        },
      ],
    });
  });

  it("deberia actualizar una plantilla correctamente", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, rol: "admin" });

    const plantillaMock = {
      id_plantilla: 10,
      nombre: "Plantilla Antigua",
      descripcion: "Descripcion antigua",
      update: jest.fn().mockImplementation(async (payload) => {
        plantillaMock.nombre = payload.nombre;
        plantillaMock.descripcion = payload.descripcion;
      }),
    };

    (Plantilla.findByPk).mockResolvedValue(plantillaMock);
    (Plantilla.findOne).mockResolvedValue({ id_plantilla: 10, nombre: "Plantilla Barberia" });

    (ServicioPlantilla.destroy).mockResolvedValue(1);
    (RecursoPlantilla.destroy).mockResolvedValue(1);

    (ServicioPlantilla.bulkCreate).mockResolvedValue([
      {
        id_servicio_plantilla: 21,
        nombre: "Corte Premium",
        precio: 18,
        duracion: 45,
        descripcion: "Incluye lavado",
        requiere_capacidad: true,
      },
    ]);

    (RecursoPlantilla.bulkCreate).mockResolvedValue([
      {
        id_recurso_plantilla: 31,
        nombre: "Sillon Reclinable",
        capacidad: 1,
      },
    ]);

    const req = {
      user: { id_usuario: 1 },
      params: { id_plantilla: "10" },
      body: {
        nombre: "Plantilla Barberia",
        descripcion: "Plantilla actualizada",
        servicios: [
          {
            nombre: "Corte Premium",
            precio: 18,
            duracion: 45,
            descripcion: "Incluye lavado",
            requiere_capacidad: true,
          },
        ],
        recursos: [
          {
            nombre: "Sillon Reclinable",
            capacidad: 1,
          },
        ],
      },
    };
    const { res, jsonMock } = buildRes();

    await updatePlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Plantilla actualizada correctamente",
      plantilla: {
        id_plantilla: 10,
        nombre: "Plantilla Barberia",
        descripcion: "Plantilla actualizada",
        servicios: [
          {
            id_servicio_plantilla: 21,
            nombre: "Corte Premium",
            precio: 18,
            duracion: 45,
            descripcion: "Incluye lavado",
            requiere_capacidad: true,
          },
        ],
        recursos: [
          {
            id_recurso_plantilla: 31,
            nombre: "Sillon Reclinable",
            capacidad: 1,
          },
        ],
      },
    });
  });

  it("deberia fallar al actualizar si la plantilla no existe", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, rol: "admin" });
    (Plantilla.findByPk).mockResolvedValue(null);

    const req = {
      user: { id_usuario: 1 },
      params: { id_plantilla: "999" },
      body: validBody,
    };
    const { res, jsonMock } = buildRes();

    await updatePlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Plantilla no encontrada" });
  });

  it("deberia borrar una plantilla correctamente", async () => {
    (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, rol: "admin" });

    const plantillaMock = {
      id_plantilla: 10,
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    (Plantilla.findByPk).mockResolvedValue(plantillaMock);

    const req = {
      user: { id_usuario: 1 },
      params: { id_plantilla: "10" },
    };
    const { res, jsonMock } = buildRes();

    await deletePlantilla(req, res);

    expect(plantillaMock.destroy).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Plantilla eliminada correctamente" });
  });

  it("deberia fallar al borrar si la plantilla no existe", async () => {
    (Plantilla.findByPk).mockResolvedValue(null);

    const req = {
      user: { id_usuario: 1 },
      params: { id_plantilla: "999" },
    };
    const { res, jsonMock } = buildRes();

    await deletePlantilla(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Plantilla no encontrada" });
  });
});
