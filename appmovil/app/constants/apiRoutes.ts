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
  putNegocioUserRoleById: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/negocios/users/${idNegocio}`,
  deleteNegocioUserById: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/negocios/users/${idNegocio}`,
  clientes: `${API_BASE_URL}${API_PREFIX}/clientes`,
  clientesByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/clientes/${idNegocio}`,
  deleteClienteById: (idCliente: number) => `${API_BASE_URL}${API_PREFIX}/clientes/${idCliente}`,
  users: `${API_BASE_URL}${API_PREFIX}/users`,
  userById: (idUsuario: string | number) => `${API_BASE_URL}${API_PREFIX}/users/user/${idUsuario}`,
} as const;
