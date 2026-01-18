import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

type RegisterScreenProps = NativeStackScreenProps<
  NavigationScreenList,
  "Register"
>;
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0D47A1",
    marginBottom: 30,
    textAlign: "center",
  },
  error: {
    fontSize: 15,
    color: "#f50000",
    marginBottom: 10,
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
  linkText: {
    color: "#1976D2",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
});

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [fullname, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (
      !username ||
      !fullname ||
      !dni ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      setError("Completa todos los campos");
      return;
    }

    if (password != confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/v1/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre_usuario: username,
            nombre: fullname,
            dni: dni,
            email: email,
            numero_telefono: phone,
            contrasena: password,
            consentimiento: false,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al registrarse");
        return;
      }

      setError("Usuario registrado correctamente");
      navigation.navigate("Login", {message:"REGISTER_SUCCESS"});
    } catch (error) {
      setError("No se pudo conectar con el servidor");
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario"
        placeholderTextColor="#1976D2"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor="#1976D2"
        value={fullname}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="DNI/NIE"
        placeholderTextColor="#1976D2"
        value={dni}
        onChangeText={setDni}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#1976D2"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Numero de Teléfono"
        placeholderTextColor="#1976D2"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#1976D2"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#1976D2"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Crear Cuenta</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity onPress={() => navigation.navigate("Login", {message:""})}>
        <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterScreen;
