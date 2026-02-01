import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React, { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LoginScreenProps = NativeStackScreenProps<NavigationScreenList, "Login"> & {
  setIsAuth: (value: boolean) => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route, setIsAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const message = route.params?.message;
  const messages: Record<string, string> = {
    REGISTER_SUCCESS: "Registrado correctamente. Comprueba tu email para validar tu cuenta.",
    VALIDATION_SUCCESS: "Cuenta validada correctamente. Ahora puedes iniciar sesión.",
    PASSWORD_RESET_SUCCESS: "Contraseña restablecida correctamente. Puede encontrarla en su correo.",
    SESSION_EXPIRED: "Tu sesión ha expirado.",
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/v1/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_usuario: username,
          contrasena: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al Iniciar sesión");
        return;
      }
      if (data.message === "UsuarioNoValidado") {
        navigation.navigate("ValidateCode", { id_usuario: data.id_usuario, nombre_usuario: username });
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("id_usuario", data.id_usuario);
      setIsAuth(true);
      
    } catch (error) {
      setError("No se pudo conectar con el servidor");
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7fafc" />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.title}>Iniciar Sesión</Text>
        </View>

        <View style={styles.formContainer}>
          {message && message.length > 0 && (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={20} color="#16a34a" />
              <Text style={styles.successText}>{messages[message]}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Introduce tu usuario"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Introduce tu contraseña"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <MaterialIcons name="login" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate("ResetPassword")}
          >
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0D47A1",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: "#16a34a",
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#1976D2",
    fontSize: 15,
    fontWeight: "500",
  },
});
