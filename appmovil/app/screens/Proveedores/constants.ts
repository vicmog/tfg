import { API_ROUTES } from "@/app/constants/apiRoutes";

export const proveedoresByNegocioRoute = (idNegocio: number) => API_ROUTES.proveedoresByNegocio(idNegocio);
export const createProveedorRoute = API_ROUTES.proveedores;
export const deleteProveedorRoute = (idProveedor: number) => API_ROUTES.deleteProveedorById(idProveedor);

export const SCREEN_TITLE = "Proveedores";
export const ADD_SUPPLIER_BUTTON = "Añadir proveedor";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVING_BUTTON_TEXT = "Guardando...";
export const DELETE_BUTTON_TEXT = "Eliminar";

export const FORM_TITLE = "Nuevo proveedor";
export const DETAIL_SUPPLIER_TITLE = "Detalles del proveedor";

export const DETAIL_NAME_LABEL = "Nombre";
export const DETAIL_CIF_LABEL = "CIF/NIF";
export const DETAIL_CONTACT_LABEL = "Contacto";
export const DETAIL_PHONE_LABEL = "Teléfono";
export const DETAIL_EMAIL_LABEL = "Email";
export const DETAIL_TYPE_LABEL = "Tipo de proveedor";
export const DETAIL_ADDRESS_LABEL = "Dirección";

export const EMPTY_NOMBRE_ERROR = "El nombre del proveedor es obligatorio";
export const EMPTY_CIF_ERROR = "El CIF/NIF del proveedor es obligatorio";
export const EMPTY_CONTACTO_ERROR = "La persona de contacto es obligatoria";
export const EMPTY_TIPO_ERROR = "El tipo de proveedor es obligatorio";
export const CONTACT_METHOD_REQUIRED_ERROR = "Debes indicar teléfono o email";
export const INVALID_EMAIL_ERROR = "El email no tiene un formato válido";

export const DEFAULT_FETCH_ERROR = "No se pudieron obtener los proveedores";
export const DEFAULT_CREATE_ERROR = "No se pudo crear el proveedor";
export const DEFAULT_DELETE_ERROR = "No se pudo eliminar el proveedor";
export const CONNECTION_ERROR = "Error de conexión. Inténtalo de nuevo.";

export const SUCCESS_MESSAGE = "Proveedor creado correctamente";
export const DELETE_SUCCESS_MESSAGE = "Proveedor eliminado correctamente";
export const EMPTY_SUPPLIERS_MESSAGE = "No hay proveedores registrados";
export const SEARCH_SUPPLIER = "Buscar por nombre, CIF o contacto";
export const NO_ACCESS_MESSAGE = "Solo jefe y administrador pueden gestionar proveedores";

export const DELETE_CONFIRM_TITLE = "Eliminar proveedor";
export const DELETE_CONFIRM_MESSAGE = "¿Seguro que quieres eliminar este proveedor? Esta acción no se puede deshacer.";
export const CANCEL_TEXT = "Cancelar";

export const NO_EMAIL_MESSAGE = "Sin email";
export const NO_PHONE_MESSAGE = "Sin teléfono";
export const NO_ADDRESS_MESSAGE = "Sin dirección";

export const JEFE_ROLE = "jefe";
export const ADMIN_ROLE = "admin";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
