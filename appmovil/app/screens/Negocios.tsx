import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NegociosScreenProps = NativeStackScreenProps<
  NavigationScreenList,
  "Negocios"
>;

const Negocios: React.FC<NegociosScreenProps> = ({ navigation }) => {
  const negocios = [
    { id: 1, nombre: "Tienda A" },
    { id: 2, nombre: "Cafetería B" },
    { id: 3, nombre: "Restaurante C" },
    { id: 4, nombre: "Librería D" },
    { id: 5, nombre: "Librería D" },
    { id: 6, nombre: "Librería D" },
    { id: 7, nombre: "Librería D" },
    { id: 8, nombre: "Librería D" },
    { id: 9, nombre: "Librería D" },
    { id: 10, nombre: "Librería D" },
    { id: 11, nombre: "Librería D" },
    { id: 12, nombre: "Librería D" },
    { id: 13, nombre: "Librería D" },
    { id: 14, nombre: "Librería D" },
    { id: 15, nombre: "Librería D" },
    { id: 16, nombre: "Librería D" },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButtonLeft}
          onPress={() => navigation.navigate("EditarDatos")}
          testID="edit-profile-button"
        >
          <Text style={styles.headerButtonText}>Editar datos personales</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButtonRight}
          onPress={() => navigation.navigate("EditarDatos")}
          testID="add-business-button"
        >
          <Text style={styles.headerButtonText}>Añadir negocio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.negociosContainer}>
        {negocios.map((negocio) => (
          <View
            key={negocio.id}
            style={styles.negocioCard}
            testID={`business-${negocio.id}`}
          >
            <Text style={styles.negocioText}>{negocio.nombre}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Negocios;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  headerButtonLeft: {
    backgroundColor: "#1976D2",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 50,
    marginRight: 5,
  },
  headerButtonRight: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 50,
  },
  headerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  negociosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  negocioCard: {
    width: "48%",
    height: 100,
    backgroundColor: "#E3F2FD",
    borderRadius: 5,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "1px 3px 1px #9E9E9E",
  },
  negocioText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#0D47A1",
  },
});
