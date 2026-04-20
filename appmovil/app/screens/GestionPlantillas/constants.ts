import { API_ROUTES } from "@/app/constants/apiRoutes";

export const PLANTILLAS_ROUTE = API_ROUTES.plantillas;
export const deletePlantillaByIdRoute = (idPlantilla: number) => API_ROUTES.deletePlantillaById(idPlantilla);
export const SCREEN_TITLE = "Gestion de plantillas";
export const SCREEN_SUBTITLE = "Administra y reutiliza configuraciones para tus negocios";
export const EMPTY_MESSAGE = "No hay plantillas creadas";
export const EMPTY_DESCRIPTION = "Crea tu primera plantilla para reutilizar servicios y recursos en segundos.";
export const EMPTY_ACTION_TEXT = "Crear primera plantilla";
export const LOADING_MESSAGE = "Cargando plantillas...";
export const ERROR_DEFAULT = "No se pudieron obtener las plantillas";
export const RETRY_TEXT = "Reintentar";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar la plantilla";
export const DELETE_SUCCESS_MESSAGE = "Plantilla eliminada correctamente";
export const CONFIRM_DELETE_TITLE = "Eliminar plantilla";
export const CONFIRM_DELETE_MESSAGE = "Seguro que quieres eliminar esta plantilla?";
export const CONFIRM_DELETE_CANCEL = "Cancelar";
export const CONFIRM_DELETE_ACCEPT = "Eliminar";
export const DELETING_BUTTON_TEXT = "Eliminando...";
