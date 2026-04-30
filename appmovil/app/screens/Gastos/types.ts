import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "@/app/index";

export type GastosProps = NativeStackScreenProps<NavigationScreenList, "Gastos">;
export type TipoGastoDetailProps = NativeStackScreenProps<NavigationScreenList, "TipoGastoDetail">;