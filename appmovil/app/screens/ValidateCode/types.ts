import { NavigationScreenList } from "@/app";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type ValidateCodeProps = NativeStackScreenProps<NavigationScreenList, "ValidateCode"> & {
  setIsAuth: (value: boolean) => void;
};
