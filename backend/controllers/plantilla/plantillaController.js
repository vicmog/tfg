import { Plantilla } from "../../models/Plantilla.js";
import { ServicioPlantilla } from "../../models/ServicioPlantilla.js";
import { RecursoPlantilla } from "../../models/RecursoPlantilla.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { sequelize } from "../../models/db.js";
import { PLANTILLA_ERRORS, PLANTILLA_MESSAGES, PLANTILLA_ROLES } from "./constants.js";

const canCreatePlantillas = (rol) => `${rol ?? ""}`.toLowerCase() === PLANTILLA_ROLES.ADMIN;

const ensureAdminAccess = async (id_usuario) => {
  if (!id_usuario) {
    return { status: 401, message: PLANTILLA_ERRORS.USER_NOT_AUTHENTICATED };
  }

  const usuarioAdmin = await UsuarioNegocio.findOne({
    where: {
      id_usuario,
      rol: PLANTILLA_ROLES.ADMIN,
    },
  });

  if (!usuarioAdmin || !canCreatePlantillas(usuarioAdmin.rol)) {
    return { status: 403, message: PLANTILLA_ERRORS.NO_VIEW_PERMISSION };
  }

  return { status: null };
};

const isPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const isPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null || value === "") {
    return { value: false };
  }

  if (typeof value === "boolean") {
    return { value };
  }

  if (typeof value === "number") {
    if (value === 1) {
      return { value: true };
    }

    if (value === 0) {
      return { value: false };
    }

    return { error: true };
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return { value: true };
    }

    if (normalized === "false" || normalized === "0") {
      return { value: false };
    }

    return { error: true };
  }

  return { error: true };
};

const validateServicios = (servicios) => {
  if (!Array.isArray(servicios) || servicios.length === 0) {
    return { error: PLANTILLA_ERRORS.SERVICIOS_REQUIRED };
  }

  const hasNombreError = servicios.some((servicio) => !servicio?.nombre || !`${servicio.nombre}`.trim());
  if (hasNombreError) {
    return { error: PLANTILLA_ERRORS.SERVICIO_NOMBRE_REQUIRED };
  }

  const hasPrecioError = servicios.some((servicio) => !isPositiveNumber(servicio?.precio));
  if (hasPrecioError) {
    return { error: PLANTILLA_ERRORS.SERVICIO_PRECIO_INVALID };
  }

  const hasDuracionError = servicios.some((servicio) => !isPositiveInteger(servicio?.duracion));
  if (hasDuracionError) {
    return { error: PLANTILLA_ERRORS.SERVICIO_DURACION_INVALID };
  }

  const normalizedServicios = [];

  for (const servicio of servicios) {
    const requiereCapacidadResult = normalizeBoolean(servicio?.requiere_capacidad);
    if (requiereCapacidadResult.error) {
      return { error: PLANTILLA_ERRORS.SERVICIO_REQUIERE_CAPACIDAD_INVALID };
    }

    normalizedServicios.push({
      nombre: `${servicio.nombre}`.trim(),
      precio: Number(servicio.precio),
      duracion: Number(servicio.duracion),
      descripcion: typeof servicio.descripcion === "string" ? servicio.descripcion.trim() : "",
      requiere_capacidad: requiereCapacidadResult.value,
    });
  }

  return { value: normalizedServicios };
};

const validateRecursos = (recursos) => {
  if (!Array.isArray(recursos) || recursos.length === 0) {
    return { error: PLANTILLA_ERRORS.RECURSOS_REQUIRED };
  }

  const hasNombreError = recursos.some((recurso) => !recurso?.nombre || !`${recurso.nombre}`.trim());
  if (hasNombreError) {
    return { error: PLANTILLA_ERRORS.RECURSO_NOMBRE_REQUIRED };
  }

  const hasCapacidadError = recursos.some((recurso) => !isPositiveInteger(recurso?.capacidad));
  if (hasCapacidadError) {
    return { error: PLANTILLA_ERRORS.RECURSO_CAPACIDAD_INVALID };
  }

  return {
    value: recursos.map((recurso) => ({
      nombre: `${recurso.nombre}`.trim(),
      capacidad: Number(recurso.capacidad),
    })),
  };
};

export const getPlantillas = async (req, res) => {
  const id_usuario = req.user?.id_usuario;

  try {
    const accessResult = await ensureAdminAccess(id_usuario);
    if (accessResult.status) {
      return res.status(accessResult.status).json({ message: accessResult.message });
    }

    const plantillas = await Plantilla.findAll({
      order: [["createdAt", "DESC"]],
    });

    if (plantillas.length === 0) {
      return res.status(200).json({
        message: PLANTILLA_MESSAGES.PLANTILLAS_RETRIEVED,
        plantillas: [],
      });
    }

    const plantillaIds = plantillas.map((plantilla) => plantilla.id_plantilla);

    const servicios = await ServicioPlantilla.findAll({
      where: { id_plantilla: plantillaIds },
      order: [["createdAt", "DESC"]],
    });

    const recursos = await RecursoPlantilla.findAll({
      where: { id_plantilla: plantillaIds },
      order: [["createdAt", "DESC"]],
    });

    const serviciosByPlantilla = servicios.reduce((acc, servicio) => {
      if (!acc[servicio.id_plantilla]) {
        acc[servicio.id_plantilla] = [];
      }
      acc[servicio.id_plantilla].push({
        id_servicio_plantilla: servicio.id_servicio_plantilla,
        id_plantilla: servicio.id_plantilla,
        nombre: servicio.nombre,
        precio: servicio.precio,
        duracion: servicio.duracion,
        descripcion: servicio.descripcion,
        requiere_capacidad: Boolean(servicio.requiere_capacidad),
      });
      return acc;
    }, {});

    const recursosByPlantilla = recursos.reduce((acc, recurso) => {
      if (!acc[recurso.id_plantilla]) {
        acc[recurso.id_plantilla] = [];
      }
      acc[recurso.id_plantilla].push({
        id_recurso_plantilla: recurso.id_recurso_plantilla,
        id_plantilla: recurso.id_plantilla,
        nombre: recurso.nombre,
        capacidad: recurso.capacidad,
      });
      return acc;
    }, {});

    return res.status(200).json({
      message: PLANTILLA_MESSAGES.PLANTILLAS_RETRIEVED,
      plantillas: plantillas.map((plantilla) => ({
        id_plantilla: plantilla.id_plantilla,
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion,
        servicios: serviciosByPlantilla[plantilla.id_plantilla] || [],
        recursos: recursosByPlantilla[plantilla.id_plantilla] || [],
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: PLANTILLA_ERRORS.SERVER_ERROR });
  }
};

export const createPlantilla = async (req, res) => {
  const { nombre, descripcion, servicios, recursos } = req.body;
  const id_usuario = req.user?.id_usuario;

  const accessResult = await ensureAdminAccess(id_usuario);
  if (accessResult.status) {
    return res.status(accessResult.status).json({
      message: accessResult.status === 403 ? PLANTILLA_ERRORS.NO_CREATE_PERMISSION : accessResult.message,
    });
  }

  if (!nombre || !`${nombre}`.trim()) {
    return res.status(400).json({ message: PLANTILLA_ERRORS.NOMBRE_REQUIRED });
  }

  const serviciosResult = validateServicios(servicios);
  if (serviciosResult.error) {
    return res.status(400).json({ message: serviciosResult.error });
  }

  const recursosResult = validateRecursos(recursos);
  if (recursosResult.error) {
    return res.status(400).json({ message: recursosResult.error });
  }

  try {
    const nombreTrim = `${nombre}`.trim();
    const existingPlantilla = await Plantilla.findOne({ where: { nombre: nombreTrim } });

    if (existingPlantilla) {
      return res.status(400).json({ message: PLANTILLA_ERRORS.NOMBRE_ALREADY_EXISTS });
    }

    const createdData = await sequelize.transaction(async (transaction) => {
      const plantilla = await Plantilla.create(
        {
          nombre: nombreTrim,
          descripcion: typeof descripcion === "string" ? descripcion.trim() : "",
        },
        { transaction }
      );

      const createdServicios = await ServicioPlantilla.bulkCreate(
        serviciosResult.value.map((servicio) => ({
          id_plantilla: plantilla.id_plantilla,
          nombre: servicio.nombre,
          precio: servicio.precio,
          duracion: servicio.duracion,
          descripcion: servicio.descripcion,
          requiere_capacidad: servicio.requiere_capacidad,
        })),
        { transaction }
      );

      const createdRecursos = await RecursoPlantilla.bulkCreate(
        recursosResult.value.map((recurso) => ({
          id_plantilla: plantilla.id_plantilla,
          nombre: recurso.nombre,
          capacidad: recurso.capacidad,
        })),
        { transaction }
      );

      return { plantilla, createdServicios, createdRecursos };
    });

    return res.status(201).json({
      message: PLANTILLA_MESSAGES.PLANTILLA_CREATED,
      plantilla: {
        id_plantilla: createdData.plantilla.id_plantilla,
        nombre: createdData.plantilla.nombre,
        descripcion: createdData.plantilla.descripcion,
        servicios: createdData.createdServicios.map((servicio) => ({
          id_servicio_plantilla: servicio.id_servicio_plantilla,
          nombre: servicio.nombre,
          precio: servicio.precio,
          duracion: servicio.duracion,
          descripcion: servicio.descripcion,
          requiere_capacidad: servicio.requiere_capacidad,
        })),
        recursos: createdData.createdRecursos.map((recurso) => ({
          id_recurso_plantilla: recurso.id_recurso_plantilla,
          nombre: recurso.nombre,
          capacidad: recurso.capacidad,
        })),
      },
    });
  } catch (error) {
    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: PLANTILLA_ERRORS.NOMBRE_ALREADY_EXISTS });
    }

    return res.status(500).json({ message: PLANTILLA_ERRORS.SERVER_ERROR });
  }
};

export const updatePlantilla = async (req, res) => {
  const { id_plantilla } = req.params;
  const { nombre, descripcion, servicios, recursos } = req.body;
  const id_usuario = req.user?.id_usuario;

  const accessResult = await ensureAdminAccess(id_usuario);
  if (accessResult.status) {
    return res.status(accessResult.status).json({
      message: accessResult.status === 403 ? PLANTILLA_ERRORS.NO_UPDATE_PERMISSION : accessResult.message,
    });
  }

  if (!isPositiveInteger(id_plantilla)) {
    return res.status(400).json({ message: PLANTILLA_ERRORS.PLANTILLA_ID_INVALID });
  }

  if (!nombre || !`${nombre}`.trim()) {
    return res.status(400).json({ message: PLANTILLA_ERRORS.NOMBRE_REQUIRED });
  }

  const serviciosResult = validateServicios(servicios);
  if (serviciosResult.error) {
    return res.status(400).json({ message: serviciosResult.error });
  }

  const recursosResult = validateRecursos(recursos);
  if (recursosResult.error) {
    return res.status(400).json({ message: recursosResult.error });
  }

  try {
    const plantillaId = Number(id_plantilla);
    const plantilla = await Plantilla.findByPk(plantillaId);

    if (!plantilla) {
      return res.status(404).json({ message: PLANTILLA_ERRORS.PLANTILLA_NOT_FOUND });
    }

    const nombreTrim = `${nombre}`.trim();
    const existingPlantilla = await Plantilla.findOne({ where: { nombre: nombreTrim } });

    if (existingPlantilla && existingPlantilla.id_plantilla !== plantillaId) {
      return res.status(400).json({ message: PLANTILLA_ERRORS.NOMBRE_ALREADY_EXISTS });
    }

    const updatedData = await sequelize.transaction(async (transaction) => {
      await plantilla.update(
        {
          nombre: nombreTrim,
          descripcion: typeof descripcion === "string" ? descripcion.trim() : "",
        },
        { transaction }
      );

      await ServicioPlantilla.destroy({
        where: { id_plantilla: plantillaId },
        transaction,
      });

      await RecursoPlantilla.destroy({
        where: { id_plantilla: plantillaId },
        transaction,
      });

      const updatedServicios = await ServicioPlantilla.bulkCreate(
        serviciosResult.value.map((servicio) => ({
          id_plantilla: plantillaId,
          nombre: servicio.nombre,
          precio: servicio.precio,
          duracion: servicio.duracion,
          descripcion: servicio.descripcion,
          requiere_capacidad: servicio.requiere_capacidad,
        })),
        { transaction }
      );

      const updatedRecursos = await RecursoPlantilla.bulkCreate(
        recursosResult.value.map((recurso) => ({
          id_plantilla: plantillaId,
          nombre: recurso.nombre,
          capacidad: recurso.capacidad,
        })),
        { transaction }
      );

      return { plantilla, updatedServicios, updatedRecursos };
    });

    return res.status(200).json({
      message: PLANTILLA_MESSAGES.PLANTILLA_UPDATED,
      plantilla: {
        id_plantilla: updatedData.plantilla.id_plantilla,
        nombre: updatedData.plantilla.nombre,
        descripcion: updatedData.plantilla.descripcion,
        servicios: updatedData.updatedServicios.map((servicio) => ({
          id_servicio_plantilla: servicio.id_servicio_plantilla,
          nombre: servicio.nombre,
          precio: servicio.precio,
          duracion: servicio.duracion,
          descripcion: servicio.descripcion,
          requiere_capacidad: servicio.requiere_capacidad,
        })),
        recursos: updatedData.updatedRecursos.map((recurso) => ({
          id_recurso_plantilla: recurso.id_recurso_plantilla,
          nombre: recurso.nombre,
          capacidad: recurso.capacidad,
        })),
      },
    });
  } catch (error) {
    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: PLANTILLA_ERRORS.NOMBRE_ALREADY_EXISTS });
    }

    return res.status(500).json({ message: PLANTILLA_ERRORS.SERVER_ERROR });
  }
};
