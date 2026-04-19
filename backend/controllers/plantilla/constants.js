export const PLANTILLA_ERRORS = {
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  NO_CREATE_PERMISSION: "No tienes permisos para crear plantillas",
  NO_VIEW_PERMISSION: "No tienes permisos para ver plantillas",
  NOMBRE_REQUIRED: "El nombre de la plantilla es obligatorio",
  SERVICIOS_REQUIRED: "Debes enviar al menos un servicio",
  RECURSOS_REQUIRED: "Debes enviar al menos un recurso",
  SERVICIO_NOMBRE_REQUIRED: "Todos los servicios deben tener nombre",
  SERVICIO_PRECIO_INVALID: "Todos los servicios deben tener un precio mayor que 0",
  SERVICIO_DURACION_INVALID: "Todos los servicios deben tener una duracion entera mayor que 0",
  RECURSO_NOMBRE_REQUIRED: "Todos los recursos deben tener nombre",
  RECURSO_CAPACIDAD_INVALID: "Todos los recursos deben tener una capacidad entera mayor que 0",
  NOMBRE_ALREADY_EXISTS: "Ya existe una plantilla con ese nombre",
  SERVER_ERROR: "Error en el servidor",
};

export const PLANTILLA_MESSAGES = {
  PLANTILLA_CREATED: "Plantilla creada correctamente",
  PLANTILLAS_RETRIEVED: "Plantillas obtenidas correctamente",
};

export const PLANTILLA_ROLES = {
  ADMIN: "admin",
};
