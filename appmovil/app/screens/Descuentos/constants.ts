import { API_ROUTES } from "@/app/constants/apiRoutes";

export const descuentosRoute = API_ROUTES.descuentos;
export const productosByNegocioRoute = (idNegocio: number) => API_ROUTES.productosByNegocio(idNegocio);

export const SCREEN_TITLE = "Descuentos";
export const FORM_TITLE = "Aplicar descuento";
export const SEARCH_PRODUCT = "Buscar producto por nombre, referencia o categoria";
export const PERCENTAGE_PLACEHOLDER = "Porcentaje de descuento";
export const SAVE_BUTTON_TEXT = "Aplicar descuento";
export const SAVING_BUTTON_TEXT = "Aplicando...";

export const EMPTY_PRODUCTO_ERROR = "Debes seleccionar un producto";
export const EMPTY_PORCENTAJE_ERROR = "El porcentaje de descuento es obligatorio";
export const INVALID_PORCENTAJE_ERROR = "El porcentaje debe ser mayor que 0 y menor o igual a 100";

export const DEFAULT_PRODUCTS_ERROR = "No se pudieron obtener los productos";
export const DEFAULT_CREATE_ERROR = "No se pudo aplicar el descuento";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Descuento aplicado correctamente";
export const EMPTY_PRODUCTS_MESSAGE = "No hay productos disponibles para aplicar descuento";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar descuentos";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";
