export const SERVICIO_ERRORS = {
    USER_NOT_AUTHENTICATED: "Usuario no autenticado",
    NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
    SERVICIO_ID_REQUIRED: "El servicio es obligatorio",
    NOMBRE_REQUIRED: "El nombre del servicio es obligatorio",
    PRECIO_REQUIRED: "El precio del servicio es obligatorio",
    PRECIO_INVALID: "El precio del servicio debe ser mayor que 0",
    DURACION_REQUIRED: "La duración del servicio es obligatoria",
    DURACION_INVALID: "La duración del servicio debe ser un número entero mayor que 0",
    REQUIERE_CAPACIDAD_INVALID: "El campo requiere capacidad debe ser verdadero o falso",
    RECURSO_FAVORITO_INVALID: "El recurso favorito debe ser un número entero mayor que 0 o nulo",
    RECURSO_FAVORITO_NOT_FOUND: "El recurso favorito no existe en este negocio",
    DESCRIPCION_REQUIRED: "La descripción del servicio es obligatoria",
    SERVICIO_NOT_FOUND: "Servicio no encontrado",
    NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
    NO_MANAGE_PERMISSION: "No tienes permisos para gestionar servicios",
    SERVER_ERROR: "Error en el servidor",
};

export const SERVICIO_MESSAGES = {
    SERVICIO_CREATED: "Servicio creado correctamente",
    SERVICIO_UPDATED: "Servicio actualizado correctamente",
    SERVICIO_DELETED: "Servicio eliminado correctamente",
};

export const SERVICIO_ROLES = {
    ADMIN: "admin",
    JEFE: "jefe",
};