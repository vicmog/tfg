export const PLANTILLA_ERRORS = {
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  NO_CREATE_PERMISSION: "No tienes permisos para crear plantillas",
  NO_UPDATE_PERMISSION: "No tienes permisos para editar plantillas",
  NO_VIEW_PERMISSION: "No tienes permisos para ver plantillas",
  PLANTILLA_ID_INVALID: "El id de la plantilla es invalido",
  PLANTILLA_NOT_FOUND: "Plantilla no encontrada",
  NOMBRE_REQUIRED: "El nombre de la plantilla es obligatorio",
  SERVICIOS_REQUIRED: "Debes enviar al menos un servicio",
  RECURSOS_REQUIRED: "Debes enviar al menos un recurso",
  SERVICIO_NOMBRE_REQUIRED: "Todos los servicios deben tener nombre",
  SERVICIO_PRECIO_INVALID: "Todos los servicios deben tener un precio mayor que 0",
  SERVICIO_DURACION_INVALID: "Todos los servicios deben tener una duracion entera mayor que 0",
  SERVICIO_REQUIERE_CAPACIDAD_INVALID: "El campo requiere_capacidad de cada servicio debe ser booleano",
  RECURSO_NOMBRE_REQUIRED: "Todos los recursos deben tener nombre",
  RECURSO_CAPACIDAD_INVALID: "Todos los recursos deben tener una capacidad entera mayor que 0",
  NOMBRE_ALREADY_EXISTS: "Ya existe una plantilla con ese nombre",
  SERVER_ERROR: "Error en el servidor",
};

export const PLANTILLA_MESSAGES = {
  PLANTILLA_CREATED: "Plantilla creada correctamente",
  PLANTILLA_UPDATED: "Plantilla actualizada correctamente",
  PLANTILLA_DELETED: "Plantilla eliminada correctamente",
  PLANTILLAS_RETRIEVED: "Plantillas obtenidas correctamente",
};

export const PLANTILLA_ROLES = {
  ADMIN: "admin",
};
