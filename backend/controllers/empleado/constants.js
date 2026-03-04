export const EMPLEADO_ERRORS = {
    USER_NOT_AUTHENTICATED: "Usuario no autenticado",
    NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
    NOMBRE_REQUIRED: "El nombre del empleado es obligatorio",
    APELLIDO1_REQUIRED: "El primer apellido es obligatorio",
    CONTACT_REQUIRED: "Debes indicar email o teléfono",
    INVALID_EMAIL: "El email no tiene un formato válido",
    NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
    NO_CREATE_PERMISSION: "No tienes permisos para gestionar empleados",
    SERVER_ERROR: "Error en el servidor",
};

export const EMPLEADO_MESSAGES = {
    EMPLEADO_CREATED: "Empleado creado correctamente",
};

export const EMPLEADO_ROLES = {
    ADMIN: "admin",
    JEFE: "jefe",
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
