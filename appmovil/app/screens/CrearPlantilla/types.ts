import { NavigationScreenList } from "@/app";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type CrearPlantillaProps = NativeStackScreenProps<NavigationScreenList, "CrearPlantilla">;

export type ServicioPlantillaInput = {
  nombre: string;
  precio: string;
  duracion: string;
  descripcion: string;
};

export type RecursoPlantillaInput = {
  nombre: string;
  capacidad: string;
};
