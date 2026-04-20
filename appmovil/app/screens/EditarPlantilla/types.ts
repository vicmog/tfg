import { NavigationScreenList } from "@/app";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type EditarPlantillaProps = NativeStackScreenProps<NavigationScreenList, "EditarPlantilla">;

export type ServicioPlantillaInput = {
  nombre: string;
  precio: string;
  duracion: string;
  descripcion: string;
  requiere_capacidad: boolean;
};

export type RecursoPlantillaInput = {
  nombre: string;
  capacidad: string;
};
