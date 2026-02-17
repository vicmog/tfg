export const AUTH_ERRORS = {
  DNI_REQUIRED: "El DNI es obligatorio",
  REQUIRED_FIELDS: "Faltan campos obligatorios",
  USERNAME_ALREADY_REGISTERED: "Usuario ya registrado con este nombre de usuario",
  USER_NOT_FOUND: "Usuario no encontrado",
  WRONG_PASSWORD: "Contraseña incorrecta",
  INVALID_CODE: "Código inválido",
  MISSING_USERNAME: "Falta el nombre de usuario",
  SERVER_ERROR: "Error en el servidor",
};

export const AUTH_MESSAGES = {
  USER_REGISTERED: "Usuario registrado correctamente",
  USER_NOT_VALIDATED: "UsuarioNoValidado",
  PASSWORD_RESET_SENT: "Nueva contraseña generada y enviada al email asociado",
};

export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 10,
  RESET_LENGTH: 12,
  VALIDATION_CODE_MIN: 100000,
  VALIDATION_CODE_RANGE: 900000,
};
