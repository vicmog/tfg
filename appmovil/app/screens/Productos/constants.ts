import { API_ROUTES } from "@/app/constants/apiRoutes";

export const createProductoRoute = API_ROUTES.productos;
export const productosByNegocioRoute = (idNegocio: number) => API_ROUTES.productosByNegocio(idNegocio);
export const updateProductoByIdRoute = (idProducto: number) => API_ROUTES.updateProductoById(idProducto);
export const deleteProductoByIdRoute = (idProducto: number) => API_ROUTES.deleteProductoById(idProducto);
export const proveedoresByNegocioRoute = (idNegocio: number) => API_ROUTES.proveedoresByNegocio(idNegocio);

export const SCREEN_TITLE = "Productos";
export const CREATE_SCREEN_TITLE = "Nuevo producto";
export const EDIT_SCREEN_TITLE = "Editar producto";
export const ADD_PRODUCT_BUTTON = "Añadir producto";
export const SEARCH_PRODUCT = "Buscar por nombre, referencia o categoria";
export const EMPTY_PRODUCTS_MESSAGE = "No hay productos registrados";
export const DEFAULT_PRODUCTS_ERROR = "No se pudieron obtener los productos";

export const FORM_TITLE = "Datos del producto";
export const PROVIDER_SEARCH_PLACEHOLDER = "Buscar proveedor";
export const EMPTY_PROVIDER_SEARCH_MESSAGE = "No hay proveedores que coincidan con la busqueda";
export const CATEGORY_OTHER_OPTION = "Otra";
export const PRODUCT_CATEGORIES = [
	"Cosmetica",
	"Herramienta",
	"Higiene",
	"Accesorios",
	"Coloracion",
	"Tratamiento",
	CATEGORY_OTHER_OPTION,
] as const;

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
export const DEFAULT_UPDATE_ERROR = "No se pudo actualizar el producto";
export const DEFAULT_PROVIDERS_ERROR = "No se pudieron obtener los proveedores";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar el producto";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Producto creado correctamente";
export const UPDATE_SUCCESS_MESSAGE = "Producto actualizado correctamente";
export const DELETE_SUCCESS_MESSAGE = "Producto eliminado correctamente";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar productos";

export const DELETE_CONFIRM_TITLE = "Eliminar producto";
export const DELETE_CONFIRM_MESSAGE = "¿Seguro que quieres eliminar este producto?";
export const DELETE_BUTTON_TEXT = "Eliminar";
export const DELETING_BUTTON_TEXT = "Eliminando...";
export const SAVE_CHANGES_BUTTON_TEXT = "Guardar cambios";
export const SAVING_CHANGES_BUTTON_TEXT = "Guardando cambios...";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";
