import { NavigationScreenList } from "@/app";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type LoginScreenProps = NativeStackScreenProps<NavigationScreenList, "Login"> & {
  setIsAuth: (value: boolean) => void;
};
