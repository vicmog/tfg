export const NEGOCIO_ERRORS = {
  NOMBRE_REQUIRED: "El nombre del negocio es obligatorio",
  CIF_REQUIRED: "El CIF es obligatorio",
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  CIF_ALREADY_EXISTS: "Ya existe un negocio con este CIF",
  NO_EDIT_PERMISSION: "No tienes permisos para editar este negocio",
  NO_DELETE_PERMISSION: "No tienes permisos para eliminar este negocio",
  NO_ACCESS: "No tienes acceso a este negocio",
  NO_VIEW_USERS_PERMISSION: "No tienes permisos para ver los usuarios de este negocio",
  USER_ID_REQUIRED: "Falta el id del usuario",
  INVALID_ROLE: "Rol inválido",
  NO_ASSIGN_PERMISSION: "No tienes permisos para asignar usuarios",
  NO_REMOVE_USER_PERMISSION: "No tienes permisos para eliminar usuarios",
  NO_EDIT_USER_ROLE_PERMISSION: "No tienes permisos para editar roles de usuarios",
  TARGET_USER_NOT_FOUND: "El usuario no existe",
  USER_ACCESS_NOT_FOUND: "El usuario no tiene acceso a este negocio",
  USER_ALREADY_HAS_ACCESS: "El usuario ya tiene acceso a este negocio",
  CANNOT_EDIT_ADMIN_ROLE: "No se puede modificar el rol de un administrador",
  CANNOT_REMOVE_ADMIN_ACCESS: "No se puede eliminar el acceso de un administrador",
  NEGOCIO_NOT_FOUND: "Negocio no encontrado",
  SERVER_ERROR: "Error en el servidor",
};

export const NEGOCIO_MESSAGES = {
  NEGOCIO_CREATED: "Negocio creado correctamente",
  NEGOCIO_UPDATED: "Negocio actualizado correctamente",
  NEGOCIO_DELETED: "Negocio eliminado correctamente",
  USER_ADDED: "Usuario añadido correctamente",
  USER_ROLE_UPDATED: "Rol actualizado correctamente",
  USER_REMOVED: "Acceso de usuario eliminado correctamente",
};

export const NEGOCIO_ROLES = {
  ADMIN: "admin",
  JEFE: "jefe",
  TRABAJADOR: "trabajador",
};

export const DEFAULT_ADMIN_USER_ID = 1;
export const DEFAULT_PLANTILLA = 0;
