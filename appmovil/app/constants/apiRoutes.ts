export const API_BASE_URL = "http://localhost:3000";

const API_PREFIX = "/v1/api";

export const API_ROUTES = {
  authLogin: `${API_BASE_URL}${API_PREFIX}/auth/login`,
  authRegister: `${API_BASE_URL}${API_PREFIX}/auth/register`,
  authValidateCode: `${API_BASE_URL}${API_PREFIX}/auth/validate-code`,
  authResetPassword: `${API_BASE_URL}${API_PREFIX}/auth/reset-password`,
  negocios: `${API_BASE_URL}${API_PREFIX}/negocios`,
  plantillas: `${API_BASE_URL}${API_PREFIX}/plantillas`,
  updatePlantillaById: (idPlantilla: number) => `${API_BASE_URL}${API_PREFIX}/plantillas/${idPlantilla}`,
  deletePlantillaById: (idPlantilla: number) => `${API_BASE_URL}${API_PREFIX}/plantillas/${idPlantilla}`,
  negocioById: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/negocios/${idNegocio}`,
  ajustesByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/ajustes/${idNegocio}`,
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
  reservasHacerCaja: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/reservas/${idNegocio}/hacer-caja`,
  updateReservaById: (idReserva: number) => `${API_BASE_URL}${API_PREFIX}/reservas/${idReserva}`,
  cancelReservaById: (idReserva: number) => `${API_BASE_URL}${API_PREFIX}/reservas/${idReserva}/cancel`,
  completeReservaById: (idReserva: number) => `${API_BASE_URL}${API_PREFIX}/reservas/${idReserva}/complete`,
  deleteReservaById: (idReserva: number) => `${API_BASE_URL}${API_PREFIX}/reservas/${idReserva}`,
  proveedores: `${API_BASE_URL}${API_PREFIX}/proveedores`,
  proveedoresByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/proveedores/${idNegocio}`,
  updateProveedorById: (idProveedor: number) => `${API_BASE_URL}${API_PREFIX}/proveedores/${idProveedor}`,
  deleteProveedorById: (idProveedor: number) => `${API_BASE_URL}${API_PREFIX}/proveedores/${idProveedor}`,
  descuentos: `${API_BASE_URL}${API_PREFIX}/descuentos`,
  descuentosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/descuentos/negocio/${idNegocio}`,
  descuentosByProducto: (idProducto: number) => `${API_BASE_URL}${API_PREFIX}/descuentos/${idProducto}`,
  deleteDescuentoById: (idDescuento: number) => `${API_BASE_URL}${API_PREFIX}/descuentos/${idDescuento}`,
  tipogastos: `${API_BASE_URL}${API_PREFIX}/tipogastos`,
  tipogastosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/tipogastos/${idNegocio}`,
  updateTipoGastoById: (idTipoGasto: number) => `${API_BASE_URL}${API_PREFIX}/tipogastos/${idTipoGasto}`,
  deleteTipoGastoById: (idTipoGasto: number) => `${API_BASE_URL}${API_PREFIX}/tipogastos/${idTipoGasto}`,
  gastos: `${API_BASE_URL}${API_PREFIX}/gastos`,
  gastosByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/gastos/${idNegocio}`,
  updateGastoById: (idGasto: number) => `${API_BASE_URL}${API_PREFIX}/gastos/${idGasto}`,
  deleteGastoById: (idGasto: number) => `${API_BASE_URL}${API_PREFIX}/gastos/${idGasto}`,
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
  ventas: `${API_BASE_URL}${API_PREFIX}/ventas`,
  ventasByNegocio: (idNegocio: number) => `${API_BASE_URL}${API_PREFIX}/ventas/${idNegocio}`,
  ventaById: (idVenta: number) => `${API_BASE_URL}${API_PREFIX}/ventas/detalle/${idVenta}`,
  updateVentaById: (idVenta: number) => `${API_BASE_URL}${API_PREFIX}/ventas/${idVenta}`,
  sendVentaEmailById: (idVenta: number) => `${API_BASE_URL}${API_PREFIX}/ventas/${idVenta}/send-email`,
  deleteVentaById: (idVenta: number) => `${API_BASE_URL}${API_PREFIX}/ventas/${idVenta}`,
  users: `${API_BASE_URL}${API_PREFIX}/users`,
  userById: (idUsuario: string | number) => `${API_BASE_URL}${API_PREFIX}/users/user/${idUsuario}`,
  estadisticasDashboard: (
    idNegocio: number,
    year?: number,
    month?: number | null,
    day?: number | null
  ) => {
    const params = new URLSearchParams();
    if (year) params.append("year", String(year));
    if (month) params.append("month", String(month));
    if (day) params.append("day", String(day));
    const query = params.toString();
    const base = `${API_BASE_URL}${API_PREFIX}/estadisticas/dashboard/${idNegocio}`;
    return query ? `${base}?${query}` : base;
  },
  estadisticasVentas: (idNegocio: number, filter?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/ventas/${idNegocio}?${params.toString()}`;
  },
    estadisticasProductos: (idNegocio: number, filter?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/productos/${idNegocio}?${params.toString()}`;
  },
  estadisticasServicios: (idNegocio: number, filter?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/servicios/${idNegocio}?${params.toString()}`;
  },
  estadisticasGastos: (idNegocio: number, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append("year", String(year));
    if (month) params.append("month", String(month));
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/gastos/${idNegocio}?${params.toString()}`;
  },
  estadisticasComprasChart: (idNegocio: number, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append("year", String(year));
    if (month) params.append("month", String(month));
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/compras/${idNegocio}?${params.toString()}`;
  },
  estadisticasClientes: (idNegocio: number, filter?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/clientes/${idNegocio}?${params.toString()}`;
  },
  estadisticasReservas: (idNegocio: number, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append("year", String(year));
    if (month) params.append("month", String(month));
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/reservas/${idNegocio}?${params.toString()}`;
  },
  estadisticasRecursos: (idNegocio: number, filter?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/recursos/${idNegocio}?${params.toString()}`;
  },
  estadisticasCompras: (idNegocio: number, filter?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return `${API_BASE_URL}${API_PREFIX}/estadisticas/compras/${idNegocio}?${params.toString()}`;
  },
};
