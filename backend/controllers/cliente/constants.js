export const CLIENTE_ERRORS = {
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
  CLIENTE_ID_REQUIRED: "El cliente es obligatorio",
  NO_UPDATE_DATA: "Debes indicar al menos un campo para actualizar",
  NOMBRE_REQUIRED: "El nombre del cliente es obligatorio",
  APELLIDO1_REQUIRED: "El primer apellido es obligatorio",
  CONTACT_REQUIRED: "Debes indicar email o teléfono",
  INVALID_EMAIL: "El email no tiene un formato válido",
  BLOCKED_INVALID: "El estado de veto es inválido",
  CLIENTE_NOT_FOUND: "Cliente no encontrado",
  NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
  NO_BLOCK_PERMISSION: "No tienes permisos para vetar clientes",
  SERVER_ERROR: "Error en el servidor",
};

export const CLIENTE_MESSAGES = {
  CLIENTE_CREATED: "Cliente creado correctamente",
  CLIENTE_UPDATED: "Cliente actualizado correctamente",
  CLIENTE_DELETED: "Cliente eliminado correctamente",
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CLIENTE_ROLES = {
  ADMIN: "admin",
  JEFE: "jefe",
};
