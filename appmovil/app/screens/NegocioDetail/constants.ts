import { API_ROUTES } from "@/app/constants/apiRoutes";
import { AjusteModuleField, Modulo, ModuloId } from "@/app/screens/types";

export const negocioByIdRoute = (idNegocio: number) => API_ROUTES.negocioById(idNegocio);
export const ajustesByNegocioRoute = (idNegocio: number) => API_ROUTES.ajustesByNegocio(idNegocio);

export const MODULOS: Modulo[] = [
  { id: "gastos", nombre: "Gastos", icono: "receipt-long", color: "#F44336" },
  { id: "clientes", nombre: "Gestión de Clientes", icono: "people", color: "#4CAF50" },
  { id: "empleados", nombre: "Empleados", icono: "badge", color: "#607D8B" },
  { id: "servicios", nombre: "Servicios", icono: "build", color: "#9C27B0" },
  { id: "recursos", nombre: "Recursos", icono: "meeting-room", color: "#26A69A" },
  { id: "productos", nombre: "Productos", icono: "inventory", color: "#2196F3" },
  { id: "proveedores", nombre: "Proveedores", icono: "local-shipping", color: "#FF9800" },
  { id: "compras", nombre: "Compras", icono: "shopping-cart", color: "#FF5722" },
  { id: "descuentos", nombre: "Descuentos", icono: "discount", color: "#795548" },
  { id: "ventas", nombre: "Ventas", icono: "point-of-sale", color: "#E91E63" },
  { id: "reservas", nombre: "Reservas", icono: "event", color: "#00BCD4" },
  { id: "estadisticas", nombre: "Estadísticas", icono: "bar-chart", color: "#3F51B5" },
];

export const MODULO_TO_AJUSTE_FIELD: Record<ModuloId, AjusteModuleField> = {
  gastos: "modulo_gastos",
  clientes: "modulo_clientes",
  empleados: "modulo_empleados",
  servicios: "modulo_servicios",
  recursos: "modulo_recursos",
  productos: "modulo_productos",
  proveedores: "modulo_proveedores",
  compras: "modulo_compras",
  descuentos: "modulo_descuentos",
  ventas: "modulo_ventas",
  reservas: "modulo_reservas",
  estadisticas: "modulo_estadisticas",
};

export type ModuloGrupo = {
  id: string;
  nombre: string;
  descripcion: string;
  modulos: ModuloId[];
};

export const MODULO_GRUPOS: ModuloGrupo[] = [
  {
    id: "grupo_clientes_equipo",
    nombre: "Clientes y empleados",
    descripcion: "Gestion de clientes y personal del negocio.",
    modulos: ["clientes", "empleados"],
  },
  {
    id: "grupo_servicios",
    nombre: "Servicios",
    descripcion: "Activa el modulo de servicios de forma independiente.",
    modulos: ["servicios"],
  },
  {
    id: "grupo_recursos_reservas",
    nombre: "Recursos y reservas",
    descripcion: "Recursos y reservas estan vinculados entre si.",
    modulos: ["recursos", "reservas"],
  },
  {
    id: "grupo_catalogo_compras",
    nombre: "Inventario, compras y proveedores",
    descripcion: "Productos, proveedores, compras y descuentos forman un bloque dependiente.",
    modulos: ["productos", "proveedores", "compras", "descuentos"],
  },
  {
    id: "grupo_ventas",
    nombre: "Ventas",
    descripcion: "Activa las ventas de forma independiente",
    modulos: ["ventas"],
  },
  {
    id: "grupo_finanzas_analisis",
    nombre: "Finanzas y analisis",
    descripcion: "Control de gastos y estadisticas globales.",
    modulos: ["gastos", "estadisticas"],
  },
];
