import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React from "react";
import { Text } from "react-native";

type NegociosScreenProps = NativeStackScreenProps<
  NavigationScreenList,
  "Negocios"
>;

const Negocios: React.FC<NegociosScreenProps> = ({ navigation, route }) => {
  return <Text>Negocios</Text>;
};

export default Negocios;
