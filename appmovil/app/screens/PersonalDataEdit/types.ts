import { NavigationScreenList } from "@/app";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type PersonalDataEditProps = NativeStackScreenProps<NavigationScreenList, "EditarDatos"> & {
  setIsAuth: (value: boolean) => void;
};
