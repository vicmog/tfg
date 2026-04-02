export const COMPRA_ERRORS = {
    USER_NOT_AUTHENTICATED: "Usuario no autenticado",
    NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
    FECHA_REQUIRED: "La fecha de compra es obligatoria",
    PRODUCTOS_REQUIRED: "Debes indicar al menos un producto",
    PRODUCTO_ID_REQUIRED: "Cada producto debe tener id_producto válido",
    CANTIDAD_ESPERADA_REQUIRED: "La cantidad esperada debe ser un entero mayor que 0",
    CANTIDAD_LLEGADA_INVALID: "La cantidad llegada debe ser un entero mayor o igual que 0",
    CANTIDAD_LLEGADA_EXCEEDS: "La cantidad llegada no puede ser mayor que la esperada",
    PRODUCTOS_DUPLICATED: "No se pueden repetir productos en la misma compra",
    FECHA_INVALID: "La fecha de compra no es válida",
    NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
    NO_MANAGE_PERMISSION: "No tienes permisos para gestionar compras",
    PRODUCTOS_NOT_FOUND: "Hay productos que no existen",
    PRODUCTOS_NOT_IN_NEGOCIO: "Hay productos que no pertenecen al negocio seleccionado",
    PRODUCTOS_WITHOUT_PROVIDER: "Hay productos sin proveedor asociado",
    SERVER_ERROR: "Error en el servidor",
};

export const COMPRA_MESSAGES = {
    COMPRA_CREATED: "Compra registrada correctamente",
};

export const COMPRA_ROLES = {
    ADMIN: "admin",
    JEFE: "jefe",
};
