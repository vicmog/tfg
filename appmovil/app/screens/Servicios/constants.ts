import { API_ROUTES } from "@/app/constants/apiRoutes";

export const serviciosByNegocioRoute = (idNegocio: number) => API_ROUTES.serviciosByNegocio(idNegocio);
export const createServicioRoute = API_ROUTES.servicios;

export const SCREEN_TITLE = "Servicios";
export const ADD_SERVICE_BUTTON = "Añadir servicio";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVING_BUTTON_TEXT = "Guardando...";
export const EMPTY_NOMBRE_ERROR = "El nombre del servicio es obligatorio";
export const EMPTY_PRECIO_ERROR = "El precio del servicio es obligatorio";
export const INVALID_PRECIO_ERROR = "El precio del servicio debe ser mayor que 0";
export const EMPTY_DURACION_ERROR = "La duración del servicio es obligatoria";
export const INVALID_DURACION_ERROR = "La duración del servicio debe ser un número entero mayor que 0";
export const EMPTY_DESCRIPCION_ERROR = "La descripción del servicio es obligatoria";
export const DEFAULT_FETCH_ERROR = "No se pudieron obtener los servicios";
export const DEFAULT_CREATE_ERROR = "No se pudo crear el servicio";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Servicio creado correctamente";
export const EMPTY_SERVICIOS_MESSAGE = "No hay servicios registrados";
export const FORM_TITLE = "Nuevo servicio";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar servicios";
export const PRECIO_LABEL = "Precio";
export const DURACION_LABEL = "Duración";
export const DESCRIPCION_PLACEHOLDER = "Descripción";
export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";