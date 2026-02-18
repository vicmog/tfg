import { API_ROUTES } from "@/app/constants/apiRoutes";

export const negocioUsersByIdRoute = (idNegocio: number) => API_ROUTES.negocioUsersById(idNegocio);
export const negocioUserRoleByIdRoute = (idNegocio: number) => API_ROUTES.putNegocioUserRoleById(idNegocio);
export const searchUsersRoute = (query: string) => `${API_ROUTES.users}?search=${encodeURIComponent(query)}`;

export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_FETCH_USERS_ERROR = "No se pudieron cargar los usuarios";
export const DEFAULT_SEARCH_USERS_ERROR = "No se pudieron buscar usuarios";
export const DEFAULT_GRANT_ACCESS_ERROR = "No se pudo asignar el acceso";
export const DEFAULT_UPDATE_ROLE_ERROR = "No se pudo actualizar el rol";
export const CANNOT_EDIT_ADMIN_ROLE_MESSAGE = "No se puede editar el rol de admin";
export const CONNECTION_ERROR = "Error de conexión";
export const JEFE_ROLE = "jefe";
export const TRABAJADOR_ROLE = "trabajador";
export const ADMIN_ROLE = "admin";
export const ERR_NO_SELECTED = "Selecciona un usuario. Elige un usuario para asignar acceso.";
export const USER_WITH_ACCESS = "Usuarios con acceso";
export const ADD_BUTTON_TEXT = "Añadir";
export const NEGOCIO_LABEL = "Negocio:";
export const LOADING_USERS_TEXT = "Cargando usuarios...";
export const NO_AVALIABLE_USERS_TEXT = "No hay usuarios con acceso";
export const GRANT_ACCESS_TITLE = "Dar permiso a usuario";
export const NO_RESULTS_TEXT = "Sin resultados";
export const ARROBA_SYMBOL = "@";
export const CANCEL_BUTTON_TEXT = "Cancelar";
export const SAVING_TEXT = "Guardando...";
export const SAVE_ROLE_BUTTON_TEXT = "Guardar rol";

