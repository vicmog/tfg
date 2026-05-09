export const VENTA_ERRORS = {
    USER_NOT_AUTHENTICATED: "Usuario no autenticado",
    NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
    VENTA_ID_REQUIRED: "La venta es obligatoria",
    CLIENTE_ID_REQUIRED: "El cliente es obligatorio",
    PRODUCTO_ID_REQUIRED: "El producto es obligatorio",
    SERVICIO_ID_REQUIRED: "El servicio es obligatorio",
    TIPO_REQUIRED: "El tipo de venta (producto/servicio) es obligatorio",
    TIPO_INVALID: "El tipo debe ser 'producto' o 'servicio'",
    ITEMS_REQUIRED: "Debe especificar al menos un producto o servicio",
    PRECIO_TOTAL_REQUIRED: "El precio total es obligatorio",
    PRECIO_TOTAL_INVALID: "El precio total debe ser mayor que 0",
    FECHA_REQUIRED: "La fecha es obligatoria",
    FECHA_INVALID: "La fecha no es válida",
    CLIENTE_NOT_FOUND: "Cliente no encontrado",
    PRODUCTO_NOT_FOUND: "Producto no encontrado",
    SERVICIO_NOT_FOUND: "Servicio no encontrado",
    VENTA_NOT_FOUND: "Venta no encontrada",
    CLIENTE_EMAIL_REQUIRED: "El cliente no tiene email registrado",
    NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
    NO_MANAGE_PERMISSION: "No tienes permisos para gestionar ventas",
    SERVER_ERROR: "Error en el servidor",
};

export const VENTA_MESSAGES = {
    VENTA_CREATED: "Venta registrada correctamente",
    VENTA_DELETED: "Venta eliminada correctamente",
    VENTAS_RETRIEVED: "Ventas obtenidas correctamente",
    EMAIL_SENT: "Ticket enviado al email correctamente",
    EMAIL_SEND_ERROR: "No se pudo enviar el ticket por email",
};

export const VENTA_ROLES = {
    ADMIN: "admin",
    JEFE: "jefe",
};
