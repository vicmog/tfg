import { API_ROUTES } from "@/app/constants/apiRoutes";

export const CREATE_PLANTILLA_ROUTE = API_ROUTES.plantillas;

export const SCREEN_TITLE = "Crear Plantilla";
export const CONNECTION_ERROR = "Error de conexion. Intentalo de nuevo.";
export const NO_TOKEN_ERROR = "No se encontro token de autenticacion";
export const DEFAULT_CREATE_ERROR = "No se pudo crear la plantilla";
export const CREATE_SUCCESS_MESSAGE = "Plantilla creada correctamente";

export const EMPTY_NOMBRE_ERROR = "El nombre de la plantilla es obligatorio";
export const EMPTY_SERVICIOS_ERROR = "Debes anadir al menos un servicio";
export const EMPTY_RECURSOS_ERROR = "Debes anadir al menos un recurso";

export const EMPTY_SERVICIO_NOMBRE_ERROR = "Todos los servicios deben tener nombre";
export const INVALID_SERVICIO_PRECIO_ERROR = "Todos los precios de servicios deben ser mayores que 0";
export const INVALID_SERVICIO_DURACION_ERROR = "Todas las duraciones deben ser enteros mayores que 0";

export const EMPTY_RECURSO_NOMBRE_ERROR = "Todos los recursos deben tener nombre";
export const INVALID_RECURSO_CAPACIDAD_ERROR = "Todas las capacidades deben ser enteros mayores que 0";
