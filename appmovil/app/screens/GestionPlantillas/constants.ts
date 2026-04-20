import { API_ROUTES } from "@/app/constants/apiRoutes";

export const PLANTILLAS_ROUTE = API_ROUTES.plantillas;
export const deletePlantillaByIdRoute = (idPlantilla: number) => API_ROUTES.deletePlantillaById(idPlantilla);
export const SCREEN_TITLE = "Gestion de plantillas";
export const EMPTY_MESSAGE = "No hay plantillas creadas";
export const LOADING_MESSAGE = "Cargando plantillas...";
export const ERROR_DEFAULT = "No se pudieron obtener las plantillas";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar la plantilla";
export const DELETE_SUCCESS_MESSAGE = "Plantilla eliminada correctamente";
export const CONFIRM_DELETE_TITLE = "Eliminar plantilla";
export const CONFIRM_DELETE_MESSAGE = "Seguro que quieres eliminar esta plantilla?";
export const CONFIRM_DELETE_CANCEL = "Cancelar";
export const CONFIRM_DELETE_ACCEPT = "Eliminar";
export const DELETING_BUTTON_TEXT = "Eliminando...";
