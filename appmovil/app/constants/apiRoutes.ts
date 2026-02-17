export const API_BASE_URL = "http://localhost:3000";

const API_PREFIX = "/v1/api";

export const API_ROUTES = {
  authLogin: `${API_BASE_URL}${API_PREFIX}/auth/login`,
  authRegister: `${API_BASE_URL}${API_PREFIX}/auth/register`,
  authValidateCode: `${API_BASE_URL}${API_PREFIX}/auth/validate-code`,
  authResetPassword: `${API_BASE_URL}${API_PREFIX}/auth/reset-password`,
  negocios: `${API_BASE_URL}${API_PREFIX}/negocios`,
  negocioById: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/negocios/${idNegocio}`,
  negocioUsersById: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/negocios/users/${idNegocio}`,
  users: `${API_BASE_URL}${API_PREFIX}/users`,
  userById: (idUsuario: string | number) => `${API_BASE_URL}${API_PREFIX}/users/user/${idUsuario}`,
} as const;
