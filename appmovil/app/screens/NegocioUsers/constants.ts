import { API_ROUTES } from "@/app/constants/apiRoutes";

export const negocioUsersByIdRoute = (idNegocio: number) => API_ROUTES.negocioUsersById(idNegocio);
export const searchUsersRoute = (query: string) => `${API_ROUTES.users}?search=${encodeURIComponent(query)}`;

export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_FETCH_USERS_ERROR = "No se pudieron cargar los usuarios";
export const DEFAULT_SEARCH_USERS_ERROR = "No se pudieron buscar usuarios";
export const DEFAULT_GRANT_ACCESS_ERROR = "No se pudo asignar el acceso";
export const CONNECTION_ERROR = "Error de conexión";
