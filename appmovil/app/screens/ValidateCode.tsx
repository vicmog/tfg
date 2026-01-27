import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ValidateCodeProps = NativeStackScreenProps<NavigationScreenList, "ValidateCode"> & {
  setIsAuth: (value: boolean) => void;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#0D47A1", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 2, borderColor: "#1976D2", borderRadius: 10, padding: 12, marginBottom: 12 },
  button: { backgroundColor: "#1976D2", padding: 15, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  error: { color: "#f50000", textAlign: "center", marginTop: 10 },
});

const ValidateCode: React.FC<ValidateCodeProps> = ({ navigation, route, setIsAuth }) => {
  const { id_usuario, nombre_usuario } = route.params || {};
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleValidate = async () => {
    if (!code) {
      setError("Introduce el código de validación");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/v1/api/auth/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario, codigo_validacion: code }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Código inválido");
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("id_usuario", String(data.id_usuario));
      setIsAuth(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Text style={styles.title}>Validar Cuenta</Text>
      <Text style={{ textAlign: "center", marginBottom: 12 }}>
        Introduce el código que te enviamos por correo a la cuenta asociada.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Código de validación"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleValidate}>
        <Text style={styles.buttonText}>Validar</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

export default ValidateCode;
