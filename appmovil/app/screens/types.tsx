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
