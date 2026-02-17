import { API_ROUTES } from "@/app/constants/apiRoutes";
import { Modulo } from "@/app/screens/types";

export const negocioByIdRoute = (idNegocio: number) => API_ROUTES.negocioById(idNegocio);

export const MODULOS: Modulo[] = [
  { id: "clientes", nombre: "Gestión de Clientes", icono: "people", color: "#4CAF50" },
  { id: "productos", nombre: "Productos", icono: "inventory", color: "#2196F3" },
  { id: "proveedores", nombre: "Proveedores", icono: "local-shipping", color: "#FF9800" },
  { id: "servicios", nombre: "Servicios", icono: "build", color: "#9C27B0" },
  { id: "reservas", nombre: "Reservas", icono: "event", color: "#00BCD4" },
  { id: "ventas", nombre: "Ventas", icono: "point-of-sale", color: "#E91E63" },
  { id: "gastos", nombre: "Gastos", icono: "receipt-long", color: "#F44336" },
  { id: "empleados", nombre: "Empleados", icono: "badge", color: "#607D8B" },
];
