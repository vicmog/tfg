import { API_ROUTES } from "@/app/constants/apiRoutes";

export const LOGIN_ROUTE = API_ROUTES.authLogin;

export const LOGIN_STATUS_MESSAGES: Record<string, string> = {
  REGISTER_SUCCESS: "Registrado correctamente. Comprueba tu email para validar tu cuenta.",
  VALIDATION_SUCCESS: "Cuenta validada correctamente. Ahora puedes iniciar sesión.",
  PASSWORD_RESET_SUCCESS: "Contraseña restablecida correctamente. Puede encontrarla en su correo.",
  SESSION_EXPIRED: "Tu sesión ha expirado.",
};

export const EMPTY_CREDENTIALS_ERROR = "Por favor completa todos los campos";
export const DEFAULT_LOGIN_ERROR = "Error al Iniciar sesión";
export const SERVER_CONNECTION_ERROR = "No se pudo conectar con el servidor";
