import { API_ROUTES } from "@/app/constants/apiRoutes";

export const clientesByNegocioRoute = (idNegocio: number) => API_ROUTES.clientesByNegocio(idNegocio);
export const createClienteRoute = API_ROUTES.clientes;
export const updateClienteByIdRoute = (idCliente: number) => API_ROUTES.updateClienteById(idCliente);
export const deleteClienteByIdRoute = (idCliente: number) => API_ROUTES.deleteClienteById(idCliente);
export const searchClientByNameOrPhoneRoute = API_ROUTES.searchClientByNameOrPhone;

export const SCREEN_TITLE = "Clientes";
export const ADD_CLIENT_BUTTON = "Añadir cliente";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVE_CHANGES_BUTTON_TEXT = "Guardar cambios";
export const SAVING_BUTTON_TEXT = "Guardando...";
export const SAVING_CHANGES_BUTTON_TEXT = "Guardando cambios...";
export const DELETE_BUTTON_TEXT = "Eliminar";
export const EDIT_BUTTON_TEXT = "Editar";
export const DELETING_BUTTON_TEXT = "Eliminando...";
export const CONFIRM_DELETE_TITLE = "Eliminar cliente";
export const CONFIRM_DELETE_MESSAGE = "¿Seguro que quieres eliminar este cliente?";
export const CONFIRM_DELETE_CANCEL = "Cancelar";
export const CONFIRM_DELETE_ACCEPT = "Eliminar";

export const EMPTY_NOMBRE_ERROR = "El nombre del cliente es obligatorio";
export const EMPTY_APELLIDO1_ERROR = "El primer apellido es obligatorio";
export const CONTACT_REQUIRED_ERROR = "Debes indicar email o teléfono";
export const INVALID_EMAIL_ERROR = "El email no tiene un formato válido";

export const DEFAULT_FETCH_ERROR = "No se pudieron obtener los clientes";
export const DEFAULT_CREATE_ERROR = "No se pudo crear el cliente";
export const DEFAULT_UPDATE_ERROR = "No se pudieron guardar los cambios";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar el cliente";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Cliente creado correctamente";
export const UPDATE_SUCCESS_MESSAGE = "Cliente actualizado correctamente";
export const DELETE_SUCCESS_MESSAGE = "Cliente eliminado correctamente";
export const EMPTY_CLIENTS_MESSAGE = "No hay clientes registrados";
export const NO_EMAIL_MESSAGE = "Sin email";
export const NO_TELEFONO_MESSAGE = "Sin teléfono";
export const NEW_CLIENT_PLACEHOLDER = "Nuevo cliente";
export const EDIT_CLIENT_PLACEHOLDER = "Editar cliente";

export const SEARCH_PHONE_NAME = "Buscar por nombre o CIF";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
