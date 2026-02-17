import React, { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

type PersonalDataEditProps = NativeStackScreenProps<
  NavigationScreenList,
  "EditarDatos"
> & {
  setIsAuth: (value: boolean) => void;
};

const PersonalDataEdit: React.FC<PersonalDataEditProps> = ({ navigation, route, setIsAuth }) => {
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jwt = await AsyncStorage.getItem("token");
        const id_usuario = await AsyncStorage.getItem("id_usuario");

        const route = `http://localhost:3000/v1/api/users/user/${id_usuario}`;
        const response = await fetch(route, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await response.json();
        setUsername(data.nombre_usuario);
        setFullname(data.nombre);
        setEmail(data.email);
        setDni(data.dni);
        setPhone(data.numero_telefono);
      } catch (error) {
      }
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("id_usuario");
    setIsAuth(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const jwt = await AsyncStorage.getItem("token");
      const id_usuario = await AsyncStorage.getItem("id_usuario");
      const route = `http://localhost:3000/v1/api/users/user/${id_usuario}`;
      const response = await fetch(route, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          nombre: fullname,
          email,
          dni,
          numero_telefono: phone,
          contrasena: oldPassword,
          nuevacontrasena: newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        setIsError(true);
      } else {
        setMessage("Datos guardados correctamente");
        setIsError(false);
        setOldPassword("");
        setNewPassword("");
      }
    } catch (error) {
      setMessage("Error: No se pudo actualizar el usuario");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            testID="back-button"
          >
            <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.title}>Editar datos personales</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Usuario"
              value={username}
              onChangeText={setUsername}
              testID="input-username"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={fullname}
              onChangeText={setFullname}
              testID="input-fullname"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DNI/NIE</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="DNI/NIE"
              value={dni}
              onChangeText={setDni}
              testID="input-dni"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              testID="input-email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              testID="input-phone"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Antigua contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Antigua contraseña"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              testID="old-password"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              testID="new-password"
            />
          </View>

          {message && !isError ? (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={20} color="#16a34a" />
              <Text style={styles.successText}>{message}</Text>
            </View>
          ) : null}

          {message && isError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{message}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            testID="save-button"
          >
            <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveText}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            testID="logout-button"
          >
            <MaterialIcons name="logout" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDataEdit;

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
  inputDisabled: {
    backgroundColor: "#e5e7eb",
    color: "#6b7280",
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
  saveButton: {
    backgroundColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 12,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
