export const CLIENTE_ERRORS = {
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
  CLIENTE_ID_REQUIRED: "El cliente es obligatorio",
  NOMBRE_REQUIRED: "El nombre del cliente es obligatorio",
  APELLIDO1_REQUIRED: "El primer apellido es obligatorio",
  CONTACT_REQUIRED: "Debes indicar email o teléfono",
  INVALID_EMAIL: "El email no tiene un formato válido",
  CLIENTE_NOT_FOUND: "Cliente no encontrado",
  NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
  SERVER_ERROR: "Error en el servidor",
};

export const CLIENTE_MESSAGES = {
  CLIENTE_CREATED: "Cliente creado correctamente",
  CLIENTE_DELETED: "Cliente eliminado correctamente",
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
