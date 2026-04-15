import { API_ROUTES } from "@/app/constants/apiRoutes";

export const reservasRoute = API_ROUTES.reservas;
export const reservasByNegocioRoute = (idNegocio: number) => API_ROUTES.reservasByNegocio(idNegocio);
export const updateReservaByIdRoute = (idReserva: number) => API_ROUTES.updateReservaById(idReserva);
export const cancelReservaByIdRoute = (idReserva: number) => API_ROUTES.cancelReservaById(idReserva);
export const completeReservaByIdRoute = (idReserva: number) => API_ROUTES.completeReservaById(idReserva);
export const deleteReservaByIdRoute = (idReserva: number) => API_ROUTES.deleteReservaById(idReserva);
export const clientesByNegocioRoute = (idNegocio: number) => API_ROUTES.clientesByNegocio(idNegocio);
export const recursosByNegocioRoute = (idNegocio: number) => API_ROUTES.recursosByNegocio(idNegocio);
export const serviciosByNegocioRoute = (idNegocio: number) => API_ROUTES.serviciosByNegocio(idNegocio);

export const SCREEN_TITLE = "Reservas";
export const FORM_TITLE = "Registro de reserva";
export const ADD_RESERVA_BUTTON = "Añadir reserva";
export const SAVE_BUTTON_TEXT = "Guardar";
export const SAVING_BUTTON_TEXT = "Guardando...";
export const SAVE_CHANGES_BUTTON_TEXT = "Guardar cambios";
export const SAVING_CHANGES_BUTTON_TEXT = "Guardando cambios...";
export const SUCCESS_MESSAGE = "Reserva registrada correctamente";
export const RESERVA_CANCELADA_MESSAGE = "Reserva cancelada correctamente";
export const RESERVA_COMPLETADA_MESSAGE = "Reserva completada correctamente";
export const RESERVA_ELIMINADA_MESSAGE = "Reserva eliminada correctamente";

export const SELECT_CLIENTE_LABEL = "Cliente";
export const SELECT_RECURSO_LABEL = "Recurso";
export const SELECT_SERVICIO_LABEL = "Servicio";
export const FECHA_INICIO_LABEL = "Inicio";
export const DURACION_LABEL = "Duración (min)";
export const FRANJA_LABEL = "Franja horaria";
export const CALENDAR_EMPTY_MESSAGE = "No hay reservas para este día";
export const AVAILABLE_SLOTS_EMPTY_MESSAGE = "No hay franjas disponibles para ese día";

export const FECHA_PLACEHOLDER = "Seleccionar día";
export const PICK_CLIENTE_PLACEHOLDER = "Seleccionar cliente";
export const PICK_RECURSO_PLACEHOLDER = "Seleccionar recurso";
export const PICK_SERVICIO_PLACEHOLDER = "Seleccionar servicio";
export const DURACION_PLACEHOLDER = "Duración en minutos";
export const PICK_FRANJA_PLACEHOLDER = "Selecciona una franja";

export const EMPTY_CLIENTE_ERROR = "Debes seleccionar un cliente";
export const EMPTY_RECURSO_ERROR = "Debes seleccionar un recurso";
export const EMPTY_SERVICIO_ERROR = "Debes seleccionar un servicio";
export const EMPTY_FECHA_INICIO_ERROR = "La fecha y hora de inicio es obligatoria";
export const EMPTY_DURACION_ERROR = "La duración de la reserva es obligatoria";
export const EMPTY_FRANJA_ERROR = "Debes seleccionar una franja horaria";
export const INVALID_FECHA_INICIO_ERROR = "La fecha y hora de inicio no es valida";
export const INVALID_DURACION_ERROR = "La duración de la reserva debe ser un número entero mayor que 0";

export const DEFAULT_CLIENTES_ERROR = "No se pudieron obtener los clientes";
export const DEFAULT_RECURSOS_ERROR = "No se pudieron obtener los recursos";
export const DEFAULT_SERVICIOS_ERROR = "No se pudieron obtener los servicios";
export const DEFAULT_RESERVAS_ERROR = "No se pudieron obtener las reservas";
export const DEFAULT_CREATE_ERROR = "No se pudo registrar la reserva";
export const CONNECTION_ERROR = "Error de conexion. Intentalo de nuevo.";
export const EMPTY_CLIENTES_MESSAGE = "No hay clientes disponibles";
export const EMPTY_RECURSOS_MESSAGE = "No hay recursos disponibles";
export const EMPTY_SERVICIOS_MESSAGE = "No hay servicios disponibles";

export const INTEGER_REGEX = /^\d+$/;
export const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 21;
export const TIMELINE_PIXELS_PER_MINUTE = 1.2;
export const MIN_EVENT_BLOCK_HEIGHT = 42;
export const MIN_CANCELLED_EVENT_BLOCK_HEIGHT = 58;
export const TIMELINE_EVENT_HORIZONTAL_GAP = 4;
export const TIMELINE_LANE_WIDTH = 148;
