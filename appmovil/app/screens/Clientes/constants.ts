import { API_ROUTES } from "@/app/constants/apiRoutes";

export const clientesByNegocioRoute = (idNegocio: number) => API_ROUTES.clientesByNegocio(idNegocio);
export const createClienteRoute = API_ROUTES.clientes;

export const SCREEN_TITLE = "Clientes";
export const ADD_CLIENT_BUTTON = "Añadir cliente";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVING_BUTTON_TEXT = "Guardando...";

export const EMPTY_NOMBRE_ERROR = "El nombre del cliente es obligatorio";
export const EMPTY_APELLIDO1_ERROR = "El primer apellido es obligatorio";
export const CONTACT_REQUIRED_ERROR = "Debes indicar email o teléfono";
export const INVALID_EMAIL_ERROR = "El email no tiene un formato válido";

export const DEFAULT_FETCH_ERROR = "No se pudieron obtener los clientes";
export const DEFAULT_CREATE_ERROR = "No se pudo crear el cliente";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Cliente creado correctamente";
export const EMPTY_CLIENTS_MESSAGE = "No hay clientes registrados";
export const NO_EMAIL_MESSAGE = "Sin email";
export const NO_TELEFONO_MESSAGE = "Sin teléfono";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
