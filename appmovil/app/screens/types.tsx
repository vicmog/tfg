import { MaterialIcons } from "@expo/vector-icons";

export type Modulo = {
    id: string;
    nombre: string;
    icono: keyof typeof MaterialIcons.glyphMap;
    color: string;
};

export type Negocio = {
    id_negocio: number;
    nombre: string;
    CIF: string;
    plantilla: number;
    rol: string;
};

export type UsuarioAcceso = {
    id_usuario: number;
    nombre_usuario: string;
    nombre: string;
    rol: string;
};

export type Cliente = {
    id_cliente: number;
    id_negocio: number;
    nombre: string;
    apellido1: string;
    apellido2?: string | null;
    email?: string | null;
    numero_telefono?: string | null;
    bloqueado: boolean;
};

export type Empleado = {
    id_empleado: number;
    id_negocio: number;
    nombre: string;
    apellido1: string;
    apellido2?: string | null;
    numero_telefono?: string | null;
    email?: string | null;
};

export type Servicio = {
    id_servicio: number;
    id_negocio: number;
    nombre: string;
    precio: number;
    duracion: number;
    descripcion: string;
    createdAt?: string;
    updatedAt?: string;
};

export type Proveedor = {
    id_proveedor: number;
    id_negocio: number;
    nombre: string;
    cif_nif: string;
    contacto: string;
    telefono?: string | null;
    email?: string | null;
    tipo_proveedor: string;
    direccion?: string | null;
};

export type Producto = {
    id_producto: number;
    id_proveedor: number;
    nombre: string;
    referencia: string;
    categoria: string;
    descripcion?: string | null;
    precio_compra: number;
    precio_venta: number;
    stock: number;
    stock_minimo: number;
    proveedor_nombre?: string;
};

export type Descuento = {
    id_descuento: number;
    id_producto: number;
    porcentaje_descuento: number;
    tipo_descuento?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CompraProductoInput = {
    id_producto: number;
    cantidad_esperada: number;
    cantidad_llegada: number;
};

export type Compra = {
    id_compra: number;
    id_negocio: number;
    descripcion?: string | null;
    fecha: string;
    importe_total: number;
    estado: string;
    productos: CompraProductoInput[];
};
