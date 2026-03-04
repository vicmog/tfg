import { API_ROUTES } from "@/app/constants/apiRoutes";

export const empleadosByNegocioRoute = (idNegocio: number) => API_ROUTES.empleadosByNegocio(idNegocio);
export const createEmpleadoRoute = API_ROUTES.empleados;

export const SCREEN_TITLE = "Empleados";
export const ADD_EMPLOYEE_BUTTON = "Añadir empleado";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVING_BUTTON_TEXT = "Guardando...";
export const EMPTY_NOMBRE_ERROR = "El nombre del empleado es obligatorio";
export const EMPTY_APELLIDO1_ERROR = "El primer apellido es obligatorio";
export const CONTACT_REQUIRED_ERROR = "Debes indicar email o teléfono";
export const INVALID_EMAIL_ERROR = "El email no tiene un formato válido";
export const DEFAULT_FETCH_ERROR = "No se pudieron obtener los empleados";
export const DEFAULT_CREATE_ERROR = "No se pudo crear el empleado";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";
export const SUCCESS_MESSAGE = "Empleado creado correctamente";
export const EMPTY_EMPLEADOS_MESSAGE = "No hay empleados registrados";
export const FORM_TITLE = "Nuevo empleado";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar empleados";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
