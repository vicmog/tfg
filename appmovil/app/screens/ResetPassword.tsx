import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";

type Props = NativeStackScreenProps<NavigationScreenList, "ResetPassword">;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0D47A1",
    marginBottom: 20,
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
});

const ResetPassword: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!username) {
      Alert.alert("Error", "Por favor introduce el nombre de usuario");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/v1/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_usuario: username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Error al recuperar contraseña");
        setLoading(false);
        return;
      }
        navigation.navigate("Login", { message: "PASSWORD_RESET_SUCCESS" });

    } catch (err) {
      console.error(err);
        setError("Error de red. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Text style={styles.title}>Recuperar contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        placeholderTextColor="#1976D2"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Enviando..." : "Enviar nueva contraseña"}</Text>
      </TouchableOpacity>
        {error ? <Text style={{ color: "red", textAlign: "center" }}>{error}</Text> : null}

    </View>
  );
};

export default ResetPassword;
