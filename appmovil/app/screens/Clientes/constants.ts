import { API_ROUTES } from "@/app/constants/apiRoutes";

export const clientesByNegocioRoute = (idNegocio: number) => API_ROUTES.clientesByNegocio(idNegocio);
export const createClienteRoute = API_ROUTES.clientes;
export const updateClienteByIdRoute = (idCliente: number) => API_ROUTES.updateClienteById(idCliente);
export const deleteClienteByIdRoute = (idCliente: number) => API_ROUTES.deleteClienteById(idCliente);
export const sendClienteEmailByIdRoute = (idCliente: number) => API_ROUTES.sendClienteEmailById(idCliente);
export const searchClientByNameOrPhoneRoute = (idNegocio: number, search: string) =>
	API_ROUTES.searchClientByNameOrPhone(idNegocio, search);

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
export const CONFIRM_BAN_TITLE = "Vetar cliente";
export const CONFIRM_BAN_MESSAGE = "¿Seguro que quieres vetar este cliente?";
export const CONFIRM_UNBAN_TITLE = "Desvetar cliente";
export const CONFIRM_UNBAN_MESSAGE = "¿Seguro que quieres desvetar este cliente?";
export const CONFIRM_BAN_CANCEL = "Cancelar";
export const CONFIRM_BAN_ACCEPT = "Vetar";
export const CONFIRM_UNBAN_ACCEPT = "Desvetar";

export const EMPTY_NOMBRE_ERROR = "El nombre del cliente es obligatorio";
export const EMPTY_APELLIDO1_ERROR = "El primer apellido es obligatorio";
export const CONTACT_REQUIRED_ERROR = "Debes indicar email o teléfono";
export const INVALID_EMAIL_ERROR = "El email no tiene un formato válido";

export const DEFAULT_FETCH_ERROR = "No se pudieron obtener los clientes";
export const DEFAULT_CREATE_ERROR = "No se pudo crear el cliente";
export const DEFAULT_UPDATE_ERROR = "No se pudieron guardar los cambios";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar el cliente";
export const DEFAULT_BAN_ERROR = "No se pudo vetar el cliente";
export const DEFAULT_UNBAN_ERROR = "No se pudo desvetar el cliente";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Cliente creado correctamente";
export const UPDATE_SUCCESS_MESSAGE = "Cliente actualizado correctamente";
export const DELETE_SUCCESS_MESSAGE = "Cliente eliminado correctamente";
export const BAN_SUCCESS_MESSAGE = "Cliente vetado correctamente";
export const UNBAN_SUCCESS_MESSAGE = "Cliente desvetado correctamente";
export const EMPTY_CLIENTS_MESSAGE = "No hay clientes registrados";
export const NO_EMAIL_MESSAGE = "Sin email";
export const NO_TELEFONO_MESSAGE = "Sin teléfono";
export const NEW_CLIENT_PLACEHOLDER = "Nuevo cliente";
export const EDIT_CLIENT_PLACEHOLDER = "Editar cliente";
export const DETAIL_CLIENT_TITLE = "Detalles del cliente";
export const DETAIL_CLOSE_BUTTON = "Cerrar";
export const DETAIL_NAME_LABEL = "Nombre";
export const DETAIL_EMAIL_LABEL = "Email";
export const DETAIL_PHONE_LABEL = "Teléfono";
export const DETAIL_BAN_BUTTON = "Vetar cliente";
export const DETAIL_UNBAN_BUTTON = "Desvetar cliente";
export const DETAIL_EMAIL_BUTTON = "Enviar email";
export const BLOCKED_BADGE_TEXT = "Vetado";
export const DETAIL_STATUS_LABEL = "Estado";
export const DETAIL_STATUS_BLOCKED = "Vetado";
export const DETAIL_STATUS_ACTIVE = "Activo";
export const EMAIL_MODAL_TITLE = "Redactar email";
export const EMAIL_SUBJECT_PLACEHOLDER = "Asunto";
export const EMAIL_MESSAGE_PLACEHOLDER = "Mensaje";
export const EMAIL_ATTACHMENTS_PLACEHOLDER = "Adjuntos opcionales (URLs separadas por coma o salto de línea)";
export const EMAIL_SEND_BUTTON = "Enviar";
export const EMAIL_SENDING_BUTTON = "Enviando...";
export const EMAIL_SUBJECT_REQUIRED_ERROR = "El asunto es obligatorio";
export const EMAIL_MESSAGE_REQUIRED_ERROR = "El mensaje es obligatorio";
export const EMAIL_CLIENT_WITHOUT_EMAIL_ERROR = "El cliente no tiene email registrado";
export const DEFAULT_EMAIL_SEND_ERROR = "No se pudo enviar el email";
export const EMAIL_SENT_SUCCESS_MESSAGE = "Email enviado correctamente al cliente";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";

export const SEARCH_PHONE_NAME = "Buscar por nombre o teléfono";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
