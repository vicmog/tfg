export const AJUSTE_ERRORS = {
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  NEGOCIO_ID_REQUIRED: "El id del negocio es obligatorio",
  NEGOCIO_ID_INVALID: "El id del negocio es inválido",
  NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
  NO_MANAGE_PERMISSION: "No tienes permisos para gestionar ajustes",
  NO_FIELDS_TO_UPDATE: "No hay campos válidos para actualizar",
  INVALID_BOOLEAN_FIELD: "Los campos de módulos deben ser booleanos",
  SERVER_ERROR: "Error en el servidor",
};

export const AJUSTE_MESSAGES = {
  AJUSTE_RETRIEVED: "Ajustes obtenidos correctamente",
  AJUSTE_UPDATED: "Ajustes actualizados correctamente",
};

export const AJUSTE_ROLES = {
  ADMIN: "admin",
};

export const AJUSTE_MODULE_FIELDS = [
  "modulo_gastos",
  "modulo_clientes",
  "modulo_empleados",
  "modulo_servicios",
  "modulo_recursos",
  "modulo_productos",
  "modulo_proveedores",
  "modulo_compras",
  "modulo_descuentos",
  "modulo_ventas",
  "modulo_reservas",
  "modulo_estadisticas",
];
