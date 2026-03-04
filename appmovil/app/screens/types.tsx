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
