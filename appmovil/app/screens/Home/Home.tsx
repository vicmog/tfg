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
import { MaterialIcons } from "@expo/vector-icons";
import { HomeScreenProps } from "./types";
import { HOME_SUBTITLE, LOGIN, LOGIN_MESSAGE, REGISTER_MESSAGE, WELCOME, REGISTER, WINDOW_DIMENSIONS } from "./constants";


const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7fafc" />
      
      <View style={styles.logoContainer}>
        <Image
          source={require("./../../../assets/images/logoapp.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>{WELCOME}</Text>
        <Text style={styles.subtitleText}>
          {HOME_SUBTITLE}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate(LOGIN, {})}
        >
          <MaterialIcons name="login" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.loginText}>{LOGIN_MESSAGE}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate(REGISTER)}
        >
          <MaterialIcons name="person-add" size={20} color="#1976D2" style={{ marginRight: 8 }} />
          <Text style={styles.registerText}>{REGISTER_MESSAGE}</Text>
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
    width: WINDOW_DIMENSIONS.width - 40,
    height: WINDOW_DIMENSIONS.width - 40,
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
