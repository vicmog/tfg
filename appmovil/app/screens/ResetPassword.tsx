import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Modal } from "react-native";
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
    linkText: {
        color: "#1976D2",
        fontSize: 16,
        textAlign: "center",
        marginTop: 10,
    },
});

const ResetPassword: React.FC<Props> = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    const handleReset = () => {
        if (!username) {
            setError("Por favor introduce el nombre de usuario");
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmReset = async () => {
        setShowConfirm(false);
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
            <TouchableOpacity onPress={() => navigation.navigate("Login", {})}>
                <Text style={styles.linkText}>Inicia sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>

            <Modal visible={showConfirm} transparent animationType="fade">
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <View style={{ width: 320, padding: 20, backgroundColor: "#fff", borderRadius: 8 }}>
                        <Text style={{ fontSize: 16, marginBottom: 12 }}>Se generará una nueva contraseña y se enviará al email asociado. ¿Deseas continuar?</Text>
                        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                            <TouchableOpacity onPress={() => setShowConfirm(false)} style={{ marginRight: 12 }}>
                                <Text style={{ color: "#1976D2" }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmReset}>
                                <Text style={{ color: "#1976D2", fontWeight: "bold" }}>Si</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default ResetPassword;
