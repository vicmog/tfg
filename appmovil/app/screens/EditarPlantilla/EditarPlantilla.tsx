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
  DEFAULT_EDIT_ERROR,
  EDIT_PLANTILLA_ROUTE,
  EDIT_SUCCESS_MESSAGE,
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
import { EditarPlantillaProps, RecursoPlantillaInput, ServicioPlantillaInput } from "./types";

const newServicio = (): ServicioPlantillaInput => ({
  nombre: "",
  precio: "",
  duracion: "",
  descripcion: "",
  requiere_capacidad: false,
});

const newRecurso = (): RecursoPlantillaInput => ({
  nombre: "",
  capacidad: "1",
});

const EditarPlantilla: React.FC<EditarPlantillaProps> = ({ navigation, route }) => {
  const plantilla = route.params.plantilla;

  const [nombre, setNombre] = useState(plantilla.nombre || "");
  const [descripcion, setDescripcion] = useState(plantilla.descripcion || "");
  const [servicios, setServicios] = useState<ServicioPlantillaInput[]>(
    plantilla.servicios.length > 0
      ? plantilla.servicios.map((servicio) => ({
          nombre: servicio.nombre,
          precio: `${servicio.precio}`,
          duracion: `${servicio.duracion}`,
          descripcion: servicio.descripcion || "",
          requiere_capacidad: Boolean(servicio.requiere_capacidad),
        }))
      : [newServicio()]
  );
  const [recursos, setRecursos] = useState<RecursoPlantillaInput[]>(
    plantilla.recursos.length > 0
      ? plantilla.recursos.map((recurso) => ({
          nombre: recurso.nombre,
          capacidad: `${recurso.capacidad}`,
        }))
      : [newRecurso()]
  );
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

  const toggleServicioRequiereCapacidad = (index: number) => {
    setServicios((prev) => prev.map((item, i) => (
      i === index ? { ...item, requiere_capacidad: !item.requiere_capacidad } : item
    )));
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

  const handleEditarPlantilla = async () => {
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
          requiere_capacidad: Boolean(servicio.requiere_capacidad),
        })),
        recursos: recursos.map((recurso) => ({
          nombre: recurso.nombre.trim(),
          capacidad: Number(recurso.capacidad),
        })),
      };

      const response = await fetch(EDIT_PLANTILLA_ROUTE(plantilla.id_plantilla), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(EDIT_SUCCESS_MESSAGE);

        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      } else {
        setErrorMessage(data.message || DEFAULT_EDIT_ERROR);
      }
    } catch {
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
        <View style={styles.heroCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} testID="back-button">
            <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{SCREEN_TITLE}</Text>
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

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => toggleServicioRequiereCapacidad(index)}
                testID={`servicio-requiere-capacidad-${index}`}
              >
                <Text style={styles.toggleLabel}>Este servicio requiere capacidad</Text>
                <MaterialIcons
                  name={servicio.requiere_capacidad ? "check-box" : "check-box-outline-blank"}
                  size={22}
                  color={servicio.requiere_capacidad ? "#1d4ed8" : "#6b7280"}
                />
              </TouchableOpacity>
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
            onPress={handleEditarPlantilla}
            disabled={loading}
            testID="submit-button"
          >
            <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>{loading ? "Guardando..." : "Guardar cambios"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditarPlantilla;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
    flex: 1,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  smallActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  smallActionButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  groupCard: {
    backgroundColor: "#fafbfc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
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
    color: "#0f172a",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#e5e7eb",
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fafbfc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 12,
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
  toggleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafbfc",
  },
  toggleLabel: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    flex: 1,
    marginRight: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: "#dc2626",
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  successText: {
    color: "#16a34a",
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#1d4ed8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#93c5fd",
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
