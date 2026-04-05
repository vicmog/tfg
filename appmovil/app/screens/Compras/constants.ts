import { API_ROUTES } from "@/app/constants/apiRoutes";

export const comprasRoute = API_ROUTES.compras;
export const compraByIdRoute = (idCompra: number) => API_ROUTES.compraById(idCompra);
export const productosByNegocioRoute = (idNegocio: number) => API_ROUTES.productosByNegocio(idNegocio);

export const comprasListRoute = (params: {
	idNegocio: number;
	page?: number;
	limit?: number;
	fecha?: string;
	proveedor?: string;
	sortBy?: "fecha" | "importe_total" | "estado" | "proveedor";
	sortOrder?: "asc" | "desc";
}) => {
	const searchParams = new URLSearchParams({
		id_negocio: `${params.idNegocio}`,
		page: `${params.page ?? 1}`,
		limit: `${params.limit ?? 20}`,
		sort_by: params.sortBy ?? "fecha",
		sort_order: params.sortOrder ?? "desc",
	});

	if (params.fecha?.trim()) {
		searchParams.append("fecha", params.fecha.trim());
	}

	if (params.proveedor?.trim()) {
		searchParams.append("proveedor", params.proveedor.trim());
	}

	return `${API_ROUTES.compras}?${searchParams.toString()}`;
};

export const LIST_SCREEN_TITLE = "Compras";
export const ADD_COMPRA_BUTTON = "Anadir compra";
export const FILTER_DATE_PLACEHOLDER = "Filtrar por fecha (YYYY-MM-DD)";
export const FILTER_PROVIDER_PLACEHOLDER = "Filtrar por proveedor";
export const EMPTY_COMPRAS_MESSAGE = "No hay compras registradas";
export const LOADING_MORE_TEXT = "Cargando mas compras...";
export const DETAIL_TITLE = "Detalle de compra";
export const DETAIL_CLOSE_BUTTON = "Cerrar";
export const DETAIL_PRODUCTS_TITLE = "Productos";
export const DEFAULT_FETCH_COMPRAS_ERROR = "No se pudieron obtener las compras";
export const DEFAULT_FETCH_COMPRA_DETAIL_ERROR = "No se pudo obtener el detalle de la compra";
export const NO_PROVIDER_MESSAGE = "Sin proveedor";
export const DATE_FILTER_INVALID_ERROR = "La fecha del filtro debe tener formato YYYY-MM-DD";
export const SORT_BY_DATE = "fecha" as const;
export const SORT_ORDER_DESC = "desc" as const;

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
export const EMPTY_PRODUCT_ID_ERROR = "Debes seleccionar al menos un producto";
export const EMPTY_FECHA_ERROR = "La fecha de compra es obligatoria";
export const INVALID_FECHA_ERROR = "La fecha de compra no es valida";
export const INVALID_CANTIDAD_ESPERADA_ERROR = "La cantidad esperada debe ser un entero mayor que 0";
export const INVALID_CANTIDAD_LLEGADA_ERROR = "La cantidad llegada debe ser un entero mayor o igual que 0";
export const CANTIDAD_LLEGADA_EXCEEDS_ERROR = "La cantidad llegada no puede ser mayor que la esperada";
export const DUPLICATED_PRODUCT_ERROR = "No puedes repetir productos en la misma compra";
