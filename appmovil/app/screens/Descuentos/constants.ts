import { API_ROUTES } from "@/app/constants/apiRoutes";

export const descuentosRoute = API_ROUTES.descuentos;
export const descuentosByNegocioRoute = (idNegocio: number) => API_ROUTES.descuentosByNegocio(idNegocio);
export const deleteDescuentoByIdRoute = (idDescuento: number) => API_ROUTES.deleteDescuentoById(idDescuento);
export const productosByNegocioRoute = (idNegocio: number) => API_ROUTES.productosByNegocio(idNegocio);

export const SCREEN_TITLE = "Descuentos";
export const FORM_TITLE = "Aplicar descuento";
export const SEARCH_PRODUCT = "Buscar producto por nombre, referencia o categoria";
export const PERCENTAGE_PLACEHOLDER = "Porcentaje de descuento";
export const DATE_START_PLACEHOLDER = "Fecha de inicio (opcional)";
export const DATE_END_PLACEHOLDER = "Fecha de fin (opcional)";
export const SAVE_BUTTON_TEXT = "Aplicar descuento";
export const SAVING_BUTTON_TEXT = "Aplicando...";
export const DELETE_BUTTON_TEXT = "Eliminar";
export const DELETING_BUTTON_TEXT = "Eliminando...";
export const CONFIRM_DELETE_TITLE = "Eliminar descuento";
export const CONFIRM_DELETE_MESSAGE = "¿Seguro que quieres eliminar este descuento?";
export const CONFIRM_DELETE_CANCEL = "Cancelar";
export const CONFIRM_DELETE_ACCEPT = "Eliminar";

export const EMPTY_PRODUCTO_ERROR = "Debes seleccionar un producto";
export const EMPTY_PORCENTAJE_ERROR = "El porcentaje de descuento es obligatorio";
export const INVALID_PORCENTAJE_ERROR = "El porcentaje debe ser mayor que 0 y menor o igual a 100";
export const INVALID_DATE_ERROR = "La fecha de fin debe ser posterior a la fecha de inicio";

export const DEFAULT_PRODUCTS_ERROR = "No se pudieron obtener los productos";
export const DEFAULT_CREATE_ERROR = "No se pudo aplicar el descuento";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar el descuento";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Descuento aplicado correctamente";
export const DELETE_SUCCESS_MESSAGE = "Descuento eliminado correctamente";
export const EMPTY_PRODUCTS_MESSAGE = "No hay productos disponibles para aplicar descuento";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar descuentos";
export const EMPTY_DESCUENTOS_MESSAGE = "No hay descuentos aplicados";
export const DEFAULT_DESCUENTOS_ERROR = "No se pudieron obtener los descuentos";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";
