export const PRODUCTO_ERRORS = {
    USER_NOT_AUTHENTICATED: "Usuario no autenticado",
    NEGOCIO_ID_REQUIRED: "El negocio es obligatorio",
    NOMBRE_REQUIRED: "El nombre del producto es obligatorio",
    REFERENCIA_REQUIRED: "La referencia del producto es obligatoria",
    PROVEEDOR_ID_REQUIRED: "El proveedor es obligatorio",
    CATEGORIA_REQUIRED: "La categoría del producto es obligatoria",
    PRECIO_COMPRA_REQUIRED: "El precio de compra es obligatorio",
    PRECIO_COMPRA_INVALID: "El precio de compra debe ser mayor que 0",
    PRECIO_VENTA_REQUIRED: "El precio de venta es obligatorio",
    PRECIO_VENTA_INVALID: "El precio de venta debe ser mayor que 0",
    STOCK_REQUIRED: "El stock es obligatorio",
    STOCK_INVALID: "El stock debe ser un número entero mayor o igual a 0",
    STOCK_MINIMO_INVALID: "El stock mínimo debe ser un número entero mayor o igual a 0",
    NO_ACCESS_TO_NEGOCIO: "No tienes acceso a este negocio",
    NO_MANAGE_PERMISSION: "No tienes permisos para gestionar productos",
    PROVEEDOR_NOT_FOUND: "Proveedor no encontrado",
    PROVIDER_NOT_IN_BUSINESS: "El proveedor no pertenece al negocio seleccionado",
    SERVER_ERROR: "Error en el servidor",
};

export const PRODUCTO_MESSAGES = {
    PRODUCTO_CREATED: "Producto creado correctamente",
};

export const PRODUCTO_ROLES = {
    ADMIN: "admin",
    JEFE: "jefe",
};
