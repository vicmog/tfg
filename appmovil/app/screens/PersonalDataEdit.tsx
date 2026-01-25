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
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PersonalDataEditProps = NativeStackScreenProps<
  NavigationScreenList,
  "EditarDatos"
> & {
  setIsAuth: (value: boolean) => void;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  backButton: {
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backText: { fontSize: 19, color: "#1976D2", fontWeight: "bold" },
  form: { flex: 1 },
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
    fontSize: 16,
    marginBottom: 15,
    color: "#0D47A1",
  },
  saveButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  logoutButton: {
    backgroundColor: "#f44336",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  success: { textAlign: "center", color: "#4CAF50", marginBottom: 10 },
});

const PersonalDataEdit: React.FC<PersonalDataEditProps> = ({ navigation, route, setIsAuth }) => {
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
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
        console.error(error);
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
      } else {
        setMessage("Datos guardados correctamente");
        setOldPassword("");
        setNewPassword("");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error No se pudo actualizar el usuario");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Negocios")}
          testID="back-button"
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.form}>
          <Text style={styles.title}>Editar datos personales</Text>

          <TextInput
            style={styles.input}
            placeholder="Usuario"
            value={username}
            onChangeText={setUsername}
            testID="input-username"
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            value={fullname}
            onChangeText={setFullname}
            testID="input-fullname"
          />
          <TextInput
            style={styles.input}
            placeholder="DNI/NIE"
            value={dni}
            onChangeText={setDni}
            testID="input-dni"
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            testID="input-email"
          />
          <TextInput
            style={styles.input}
            placeholder="Número de teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            testID="input-phone"
          />
          <TextInput
            style={styles.input}
            placeholder="Antigua contraseña"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            testID="old-password"
          />
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            testID="new-password"
          />

          {message ? <Text style={styles.success}>{message}</Text> : null}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            testID="save-button"
          >
            <Text style={styles.saveText}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            testID="logout-button"
          >
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default PersonalDataEdit;
