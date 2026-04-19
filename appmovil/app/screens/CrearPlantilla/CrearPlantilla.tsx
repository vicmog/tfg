import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CONNECTION_ERROR,
  CREATE_PLANTILLA_ROUTE,
  CREATE_SUCCESS_MESSAGE,
  DEFAULT_CREATE_ERROR,
  EMPTY_NOMBRE_ERROR,
  EMPTY_RECURSOS_ERROR,
  EMPTY_RECURSO_NOMBRE_ERROR,
  EMPTY_SERVICIOS_ERROR,
  EMPTY_SERVICIO_NOMBRE_ERROR,
  INVALID_RECURSO_CAPACIDAD_ERROR,
  INVALID_SERVICIO_DURACION_ERROR,
  INVALID_SERVICIO_PRECIO_ERROR,
  NO_TOKEN_ERROR,
  SCREEN_TITLE,
} from "./constants";
import { CrearPlantillaProps, RecursoPlantillaInput, ServicioPlantillaInput } from "./types";

const newServicio = (): ServicioPlantillaInput => ({
  nombre: "",
  precio: "",
  duracion: "",
  descripcion: "",
});

const newRecurso = (): RecursoPlantillaInput => ({
  nombre: "",
  capacidad: "1",
});

const CrearPlantilla: React.FC<CrearPlantillaProps> = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [servicios, setServicios] = useState<ServicioPlantillaInput[]>([newServicio()]);
  const [recursos, setRecursos] = useState<RecursoPlantillaInput[]>([newRecurso()]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateServicioNombre = (index: number, value: string) => {
    setServicios((prev) => prev.map((item, i) => (i === index ? { ...item, nombre: value } : item)));
  };

  const updateServicioPrecio = (index: number, value: string) => {
    setServicios((prev) => prev.map((item, i) => (i === index ? { ...item, precio: value } : item)));
  };

  const updateServicioDuracion = (index: number, value: string) => {
    setServicios((prev) => prev.map((item, i) => (i === index ? { ...item, duracion: value } : item)));
  };

  const updateServicioDescripcion = (index: number, value: string) => {
    setServicios((prev) => prev.map((item, i) => (i === index ? { ...item, descripcion: value } : item)));
  };

  const updateRecursoNombre = (index: number, value: string) => {
    setRecursos((prev) => prev.map((item, i) => (i === index ? { ...item, nombre: value } : item)));
  };

  const updateRecursoCapacidad = (index: number, value: string) => {
    setRecursos((prev) => prev.map((item, i) => (i === index ? { ...item, capacidad: value } : item)));
  };

  const validateForm = (): boolean => {
    setErrorMessage("");

    if (!nombre.trim()) {
      setErrorMessage(EMPTY_NOMBRE_ERROR);
      return false;
    }

    if (servicios.length === 0) {
      setErrorMessage(EMPTY_SERVICIOS_ERROR);
      return false;
    }

    if (recursos.length === 0) {
      setErrorMessage(EMPTY_RECURSOS_ERROR);
      return false;
    }

    const serviciosInvalidos = servicios.some((servicio) => {
      if (!servicio.nombre.trim()) return true;
      if (Number.isNaN(Number(servicio.precio)) || Number(servicio.precio) <= 0) return true;
      if (!Number.isInteger(Number(servicio.duracion)) || Number(servicio.duracion) <= 0) return true;
      return false;
    });

    if (serviciosInvalidos) {
      const tieneNombreVacio = servicios.some((servicio) => !servicio.nombre.trim());
      if (tieneNombreVacio) {
        setErrorMessage(EMPTY_SERVICIO_NOMBRE_ERROR);
        return false;
      }

      const tienePrecioInvalido = servicios.some(
        (servicio) => Number.isNaN(Number(servicio.precio)) || Number(servicio.precio) <= 0
      );
      if (tienePrecioInvalido) {
        setErrorMessage(INVALID_SERVICIO_PRECIO_ERROR);
        return false;
      }

      setErrorMessage(INVALID_SERVICIO_DURACION_ERROR);
      return false;
    }

    const recursosInvalidos = recursos.some((recurso) => {
      if (!recurso.nombre.trim()) return true;
      if (!Number.isInteger(Number(recurso.capacidad)) || Number(recurso.capacidad) <= 0) return true;
      return false;
    });

    if (recursosInvalidos) {
      const tieneNombreVacio = recursos.some((recurso) => !recurso.nombre.trim());
      if (tieneNombreVacio) {
        setErrorMessage(EMPTY_RECURSO_NOMBRE_ERROR);
        return false;
      }

      setErrorMessage(INVALID_RECURSO_CAPACIDAD_ERROR);
      return false;
    }

    return true;
  };

  const handleCrearPlantilla = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setErrorMessage(NO_TOKEN_ERROR);
        setLoading(false);
        return;
      }

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        servicios: servicios.map((servicio) => ({
          nombre: servicio.nombre.trim(),
          precio: Number(servicio.precio),
          duracion: Number(servicio.duracion),
          descripcion: servicio.descripcion.trim(),
        })),
        recursos: recursos.map((recurso) => ({
          nombre: recurso.nombre.trim(),
          capacidad: Number(recurso.capacidad),
        })),
      };

      const response = await fetch(CREATE_PLANTILLA_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(CREATE_SUCCESS_MESSAGE);
        setNombre("");
        setDescripcion("");
        setServicios([newServicio()]);
        setRecursos([newRecurso()]);

        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      } else {
        setErrorMessage(data.message || DEFAULT_CREATE_ERROR);
      }
    } catch (error) {
      console.error("Error al crear plantilla:", error);
      setErrorMessage(CONNECTION_ERROR);
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} testID="back-button">
            <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.title}>{SCREEN_TITLE}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la plantilla</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Peluqueria completa"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              testID="nombre-plantilla-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe para que tipo de negocio esta plantilla"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={3}
              testID="descripcion-plantilla-input"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Servicios personalizados</Text>
            <TouchableOpacity style={styles.smallActionButton} onPress={() => setServicios((prev) => [...prev, newServicio()])}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={styles.smallActionButtonText}>Anadir servicio</Text>
            </TouchableOpacity>
          </View>

          {servicios.map((servicio, index) => (
            <View key={`servicio-${index}`} style={styles.groupCard}>
              <View style={styles.groupTitleRow}>
                <Text style={styles.groupTitle}>Servicio {index + 1}</Text>
                <TouchableOpacity
                  disabled={servicios.length === 1}
                  onPress={() => setServicios((prev) => prev.filter((_, i) => i !== index))}
                  style={[styles.iconButton, servicios.length === 1 && styles.iconButtonDisabled]}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={servicio.nombre}
                onChangeText={(value) => updateServicioNombre(index, value)}
                testID={`servicio-nombre-${index}`}
              />

              <View style={styles.inlineInputsRow}>
                <TextInput
                  style={[styles.input, styles.inlineInput, styles.inlineInputSpacing]}
                  placeholder="Precio (EUR)"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={servicio.precio}
                  onChangeText={(value) => updateServicioPrecio(index, value)}
                  testID={`servicio-precio-${index}`}
                />
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  placeholder="Duracion en minutos"
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  value={servicio.duracion}
                  onChangeText={(value) => updateServicioDuracion(index, value)}
                  testID={`servicio-duracion-${index}`}
                />
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripcion"
                value={servicio.descripcion}
                onChangeText={(value) => updateServicioDescripcion(index, value)}
                multiline
                numberOfLines={2}
                testID={`servicio-descripcion-${index}`}
              />
            </View>
          ))}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recursos personalizados</Text>
            <TouchableOpacity style={styles.smallActionButton} onPress={() => setRecursos((prev) => [...prev, newRecurso()])}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={styles.smallActionButtonText}>Anadir recurso</Text>
            </TouchableOpacity>
          </View>

          {recursos.map((recurso, index) => (
            <View key={`recurso-${index}`} style={styles.groupCard}>
              <View style={styles.groupTitleRow}>
                <Text style={styles.groupTitle}>Recurso {index + 1}</Text>
                <TouchableOpacity
                  disabled={recursos.length === 1}
                  onPress={() => setRecursos((prev) => prev.filter((_, i) => i !== index))}
                  style={[styles.iconButton, recursos.length === 1 && styles.iconButtonDisabled]}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={recurso.nombre}
                onChangeText={(value) => updateRecursoNombre(index, value)}
                testID={`recurso-nombre-${index}`}
              />
              <TextInput
                style={styles.input}
                placeholder="Capacidad"
                keyboardType="number-pad"
                value={recurso.capacidad}
                onChangeText={(value) => updateRecursoCapacidad(index, value)}
                testID={`recurso-capacidad-${index}`}
              />
            </View>
          ))}

          {errorMessage ? (
            <View style={styles.errorContainer} testID="error-message">
              <MaterialIcons name="error-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successContainer} testID="success-message">
              <MaterialIcons name="check-circle" size={20} color="#16a34a" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleCrearPlantilla}
            disabled={loading}
            testID="submit-button"
          >
            <MaterialIcons name="post-add" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>{loading ? "Guardando..." : "Crear plantilla"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CrearPlantilla;

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
    marginBottom: 20,
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
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D47A1",
  },
  smallActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallActionButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  groupCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  groupTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  iconButton: {
    padding: 6,
  },
  iconButtonDisabled: {
    opacity: 0.4,
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    marginBottom: 8,
  },
  inlineInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  inlineInput: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    marginBottom: 0,
  },
  inlineInputSpacing: {
    marginRight: 8,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  successText: {
    color: "#16a34a",
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
