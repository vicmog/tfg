import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React, { useState } from "react";
import {
  Alert,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  TextInput,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

type LoginScreenProps = NativeStackScreenProps<NavigationScreenList, "Login"> & {
  setIsAuth: (value: boolean) => void;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  success: {
    color: "#878e94",
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    textAlign: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0D47A1",
    marginBottom: 40,
    textAlign: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: "#1976D2",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#0D47A1",
  },
  error: {
    fontSize: 15,
    color: "#f50000",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#1976D2",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
});

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route, setIsAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const message = route.params?.message;
  const messages: Record<string, string> = {
    REGISTER_SUCCESS: "Registrado Correctamente. Inicia sesión para validar tu cuenta.",
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
        navigation.navigate("ValidateCode", { id_usuario: data.id_usuario});
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {message && message.length > 0 && (
        <Text style={styles.success}>{messages[message]}</Text>
      )}

      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        placeholderTextColor="#1976D2"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#1976D2"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
