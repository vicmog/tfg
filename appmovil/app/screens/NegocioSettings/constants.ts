import { API_ROUTES } from "@/app/constants/apiRoutes";

export const negocioByIdRoute = (idNegocio: number) => API_ROUTES.negocioById(idNegocio);

export const EMPTY_NAME_ERROR = "El nombre no puede estar vacío";
export const UPDATE_SUCCESS_MESSAGE = "Nombre actualizado correctamente";
export const DEFAULT_UPDATE_ERROR = "Error al actualizar el negocio";
export const DELETE_SUCCESS_MESSAGE = "Negocio eliminado correctamente";
export const DEFAULT_DELETE_ERROR = "Error al eliminar el negocio";
export const CONNECTION_ERROR = "Error de conexión";
