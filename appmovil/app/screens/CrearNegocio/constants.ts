import { API_ROUTES } from "@/app/constants/apiRoutes";

export const CREATE_NEGOCIO_ROUTE = API_ROUTES.negocios;
export const CIF_REGEX = /^[A-Za-z]\d{8}$|^\d{8}[A-Za-z]$/;

export const EMPTY_NOMBRE_ERROR = "El nombre del negocio es obligatorio";
export const EMPTY_CIF_ERROR = "El CIF es obligatorio";
export const INVALID_CIF_ERROR = "El formato del CIF no es válido";
export const NO_TOKEN_ERROR = "No estás autenticado. Por favor, inicia sesión de nuevo.";
export const CREATE_SUCCESS_MESSAGE = "¡Negocio creado correctamente!";
export const DEFAULT_CREATE_ERROR = "Error al crear el negocio";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
