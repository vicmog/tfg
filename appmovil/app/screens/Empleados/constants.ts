import { API_ROUTES } from "@/app/constants/apiRoutes";

export const empleadoByIdRoute = (idEmpleado: number) => API_ROUTES.empleadoById(idEmpleado);
export const empleadosByNegocioRoute = (idNegocio: number) => API_ROUTES.empleadosByNegocio(idNegocio);
export const searchEmpleadoByNameOrEmailRoute = (idNegocio: number, search: string) =>
	API_ROUTES.searchEmpleadoByNameOrEmail(idNegocio, search);
export const createEmpleadoRoute = API_ROUTES.empleados;
export const updateEmpleadoByIdRoute = (idEmpleado: number) => API_ROUTES.updateEmpleadoById(idEmpleado);
export const deleteEmpleadoByIdRoute = (idEmpleado: number) => API_ROUTES.deleteEmpleadoById(idEmpleado);

export const SCREEN_TITLE = "Empleados";
export const ADD_EMPLOYEE_BUTTON = "Añadir empleado";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVE_CHANGES_BUTTON_TEXT = "Guardar cambios";
export const SAVING_BUTTON_TEXT = "Guardando...";
export const SAVING_CHANGES_BUTTON_TEXT = "Guardando cambios...";
export const DELETE_BUTTON_TEXT = "Eliminar";
export const DELETING_BUTTON_TEXT = "Eliminando...";
export const CONFIRM_DELETE_TITLE = "Eliminar empleado";
export const CONFIRM_DELETE_MESSAGE = "¿Seguro que quieres eliminar este empleado?";
export const CONFIRM_DELETE_CANCEL = "Cancelar";
export const CONFIRM_DELETE_ACCEPT = "Eliminar";
export const EMPTY_NOMBRE_ERROR = "El nombre del empleado es obligatorio";
export const EMPTY_APELLIDO1_ERROR = "El primer apellido es obligatorio";
export const CONTACT_REQUIRED_ERROR = "Debes indicar email o teléfono";
export const INVALID_EMAIL_ERROR = "El email no tiene un formato válido";
export const DEFAULT_FETCH_ERROR = "No se pudieron obtener los empleados";
export const DEFAULT_CREATE_ERROR = "No se pudo crear el empleado";
export const DEFAULT_UPDATE_ERROR = "No se pudieron guardar los cambios";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar el empleado";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Empleado creado correctamente";
export const UPDATE_SUCCESS_MESSAGE = "Empleado actualizado correctamente";
export const DELETE_SUCCESS_MESSAGE = "Empleado eliminado correctamente";
export const EMPTY_EMPLEADOS_MESSAGE = "No hay empleados registrados";
export const FORM_TITLE = "Nuevo empleado";
export const EDIT_FORM_TITLE = "Editar empleado";
export const DETAIL_EMPLOYEE_TITLE = "Detalles del empleado";
export const DETAIL_NAME_LABEL = "Nombre";
export const DETAIL_EMAIL_LABEL = "Email";
export const DETAIL_PHONE_LABEL = "Teléfono";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar empleados";
export const NO_EMAIL_MESSAGE = "Sin email";
export const NO_TELEFONO_MESSAGE = "Sin teléfono";
export const SEARCH_EMPLOYEE_NAME_OR_EMAIL = "Buscar por nombre o email";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
