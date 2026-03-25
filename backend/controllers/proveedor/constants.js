export const PROVEEDOR_ERRORS = {
    USER_NOT_AUTHENTICATED: "Usuario no autenticado",
    NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
    PROVEEDOR_ID_REQUIRED: "El proveedor es obligatorio",
    NOMBRE_REQUIRED: "El nombre del proveedor es obligatorio",
    CIF_NIF_REQUIRED: "El CIF/NIF del proveedor es obligatorio",
    CONTACTO_REQUIRED: "La persona de contacto es obligatoria",
    CONTACT_METHOD_REQUIRED: "Debes indicar teléfono o email",
    INVALID_EMAIL: "El email no tiene un formato válido",
    TIPO_PROVEEDOR_REQUIRED: "El tipo de proveedor es obligatorio",
    NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
    PROVEEDOR_NOT_FOUND: "Proveedor no encontrado",
    NO_MANAGE_PERMISSION: "No tienes permisos para gestionar proveedores",
    SERVER_ERROR: "Error en el servidor",
};

export const PROVEEDOR_MESSAGES = {
    PROVEEDOR_CREATED: "Proveedor creado correctamente",
    PROVEEDOR_DELETED: "Proveedor eliminado correctamente",
};

export const PROVEEDOR_ROLES = {
    ADMIN: "admin",
    JEFE: "jefe",
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
