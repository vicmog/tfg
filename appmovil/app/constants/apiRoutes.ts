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
  updateClienteById: (idCliente: number) => `${API_BASE_URL}${API_PREFIX}/clientes/${idCliente}`,
  deleteClienteById: (idCliente: number) => `${API_BASE_URL}${API_PREFIX}/clientes/${idCliente}`,
  sendClienteEmailById: (idCliente: number) => `${API_BASE_URL}${API_PREFIX}/clientes/${idCliente}/email`,
  searchClientByNameOrPhone: (idNegocio: number, search: string) =>
    `${API_BASE_URL}${API_PREFIX}/clientes/${idNegocio}/search?searchTerm=${encodeURIComponent(search)}`,
  empleados: `${API_BASE_URL}${API_PREFIX}/empleados`,
  empleadoById: (idEmpleado: number) => `${API_BASE_URL}${API_PREFIX}/empleados/empleado/${idEmpleado}`,
  empleadosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/empleados/${idNegocio}`,
  searchEmpleadoByNameOrEmail: (idNegocio: number, search: string) =>
    `${API_BASE_URL}${API_PREFIX}/empleados/${idNegocio}/search?searchTerm=${encodeURIComponent(search)}`,
  updateEmpleadoById: (idEmpleado: number) => `${API_BASE_URL}${API_PREFIX}/empleados/${idEmpleado}`,
  deleteEmpleadoById: (idEmpleado: number) => `${API_BASE_URL}${API_PREFIX}/empleados/${idEmpleado}`,
  servicios: `${API_BASE_URL}${API_PREFIX}/servicios`,
  serviciosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/servicios/${idNegocio}`,
  servicioById: (idServicio: number) => `${API_BASE_URL}${API_PREFIX}/servicios/detalle/${idServicio}`,
  searchServicios: (idNegocio: number, searchTerm?: string) => {
    const params = new URLSearchParams({ id_negocio: idNegocio.toString() });
    if (searchTerm) params.append("q", searchTerm);
    return `${API_BASE_URL}${API_PREFIX}/servicios/search?${params.toString()}`;
  },
  updateServicioById: (idServicio: number) => `${API_BASE_URL}${API_PREFIX}/servicios/${idServicio}`,
  deleteServicioById: (idServicio: number) => `${API_BASE_URL}${API_PREFIX}/servicios/${idServicio}`,
  recursos: `${API_BASE_URL}${API_PREFIX}/recursos`,
  recursosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/recursos/${idNegocio}`,
  recursoById: (idRecurso: number) => `${API_BASE_URL}${API_PREFIX}/recursos/detalle/${idRecurso}`,
  updateRecursoById: (idRecurso: number) => `${API_BASE_URL}${API_PREFIX}/recursos/${idRecurso}`,
  deleteRecursoById: (idRecurso: number) => `${API_BASE_URL}${API_PREFIX}/recursos/${idRecurso}`,
  reservas: `${API_BASE_URL}${API_PREFIX}/reservas`,
  reservasByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/reservas/${idNegocio}`,
  proveedores: `${API_BASE_URL}${API_PREFIX}/proveedores`,
  proveedoresByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/proveedores/${idNegocio}`,
  updateProveedorById: (idProveedor: number) => `${API_BASE_URL}${API_PREFIX}/proveedores/${idProveedor}`,
  deleteProveedorById: (idProveedor: number) => `${API_BASE_URL}${API_PREFIX}/proveedores/${idProveedor}`,
  descuentos: `${API_BASE_URL}${API_PREFIX}/descuentos`,
  descuentosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/descuentos/negocio/${idNegocio}`,
  descuentosByProducto: (idProducto: number) => `${API_BASE_URL}${API_PREFIX}/descuentos/${idProducto}`,
  deleteDescuentoById: (idDescuento: number) => `${API_BASE_URL}${API_PREFIX}/descuentos/${idDescuento}`,
  compras: `${API_BASE_URL}${API_PREFIX}/compras`,
  compraById: (idCompra: number) => `${API_BASE_URL}${API_PREFIX}/compras/${idCompra}`,
  updateCompraById: (idCompra: number) => `${API_BASE_URL}${API_PREFIX}/compras/${idCompra}`,
  deleteCompraById: (idCompra: number) => `${API_BASE_URL}${API_PREFIX}/compras/${idCompra}`,
  productos: `${API_BASE_URL}${API_PREFIX}/productos`,
  productosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/productos/${idNegocio}`,
  searchProductosByNegocio: (idNegocio: number, search: string) =>
    `${API_BASE_URL}${API_PREFIX}/productos/${idNegocio}/search?searchTerm=${encodeURIComponent(search)}`,
  productoById: (idProducto: number) => `${API_BASE_URL}${API_PREFIX}/productos/detalle/${idProducto}`,
  updateProductoById: (idProducto: number) => `${API_BASE_URL}${API_PREFIX}/productos/${idProducto}`,
  deleteProductoById: (idProducto: number) => `${API_BASE_URL}${API_PREFIX}/productos/${idProducto}`,
  users: `${API_BASE_URL}${API_PREFIX}/users`,
  userById: (idUsuario: string | number) => `${API_BASE_URL}${API_PREFIX}/users/user/${idUsuario}`,
} as const;
