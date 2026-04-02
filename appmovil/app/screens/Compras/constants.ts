import { API_ROUTES } from "@/app/constants/apiRoutes";

export const comprasRoute = API_ROUTES.compras;
export const productosByNegocioRoute = (idNegocio: number) => API_ROUTES.productosByNegocio(idNegocio);

export const SCREEN_TITLE = "Nueva compra";
export const FORM_TITLE = "Registro de compra";
export const PRODUCTS_SECTION_TITLE = "Productos";
export const ADD_PRODUCT_ROW_TEXT = "Anadir producto";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVING_BUTTON_TEXT = "Guardando...";

export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden registrar compras";
export const DEFAULT_PRODUCTS_ERROR = "No se pudieron obtener los productos";
export const DEFAULT_CREATE_ERROR = "No se pudo registrar la compra";
export const CONNECTION_ERROR = "Error de conexion. Intentalo de nuevo.";
export const SUCCESS_MESSAGE = "Compra registrada correctamente";

export const EMPTY_PRODUCTS_MESSAGE = "Debes anadir al menos un producto";
export const EMPTY_PRODUCT_ID_ERROR = "Debes seleccionar un producto en cada linea";
export const INVALID_CANTIDAD_ESPERADA_ERROR = "La cantidad esperada debe ser un entero mayor que 0";
export const INVALID_CANTIDAD_LLEGADA_ERROR = "La cantidad llegada debe ser un entero mayor o igual que 0";
export const CANTIDAD_LLEGADA_EXCEEDS_ERROR = "La cantidad llegada no puede ser mayor que la esperada";
export const DUPLICATED_PRODUCT_ERROR = "No puedes repetir productos en la misma compra";
