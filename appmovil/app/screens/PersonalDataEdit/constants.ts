import { API_ROUTES } from "@/app/constants/apiRoutes";

export const userByIdRoute = (idUsuario: string | number) => API_ROUTES.userById(idUsuario);

export const SAVE_SUCCESS_MESSAGE = "Datos guardados correctamente";
export const SAVE_ERROR_MESSAGE = "Error: No se pudo actualizar el usuario";
