import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type HomeScreenProps = NativeStackScreenProps<NavigationScreenList, "Home">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7fafc" />
      
      <View style={styles.logoContainer}>
        <Image
          source={require("./../../assets/images/logoapp.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Bienvenido a Negocio360</Text>
        <Text style={styles.subtitleText}>
          Gestiona tu negocio de forma sencilla y eficiente
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login", {})}
        >
          <MaterialIcons name="login" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.loginText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Register")}
        >
          <MaterialIcons name="person-add" size={20} color="#1976D2" style={{ marginRight: 8 }} />
          <Text style={styles.registerText}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 50,
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logo: {
    width: width - 40,
    height: width - 40,
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    color: "#0D47A1",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  loginButton: {
    backgroundColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#1976D2",
    borderWidth: 2,
    paddingVertical: 16,
    borderRadius: 12,
  },
  registerText: {
    color: "#1976D2",
    fontSize: 18,
    fontWeight: "bold",
  },
});
