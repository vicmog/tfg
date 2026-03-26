import { API_ROUTES } from "@/app/constants/apiRoutes";

export const createProductoRoute = API_ROUTES.productos;
export const proveedoresByNegocioRoute = (idNegocio: number) => API_ROUTES.proveedoresByNegocio(idNegocio);

export const SCREEN_TITLE = "Productos";
export const FORM_TITLE = "Nuevo producto";

export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVING_BUTTON_TEXT = "Guardando...";

export const EMPTY_NOMBRE_ERROR = "El nombre del producto es obligatorio";
export const EMPTY_REFERENCIA_ERROR = "La referencia del producto es obligatoria";
export const EMPTY_PROVEEDOR_ERROR = "Debes seleccionar un proveedor";
export const EMPTY_CATEGORIA_ERROR = "La categoría del producto es obligatoria";
export const EMPTY_PRECIO_COMPRA_ERROR = "El precio de compra es obligatorio";
export const EMPTY_PRECIO_VENTA_ERROR = "El precio de venta es obligatorio";
export const EMPTY_STOCK_ERROR = "El stock es obligatorio";

export const INVALID_PRECIO_COMPRA_ERROR = "El precio de compra debe ser mayor que 0";
export const INVALID_PRECIO_VENTA_ERROR = "El precio de venta debe ser mayor que 0";
export const INVALID_STOCK_ERROR = "El stock debe ser un número entero mayor o igual a 0";
export const INVALID_STOCK_MINIMO_ERROR = "El stock mínimo debe ser un número entero mayor o igual a 0";

export const DEFAULT_CREATE_ERROR = "No se pudo crear el producto";
export const DEFAULT_PROVIDERS_ERROR = "No se pudieron obtener los proveedores";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Producto creado correctamente";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar productos";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";
