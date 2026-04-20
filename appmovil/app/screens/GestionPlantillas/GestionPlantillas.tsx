import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { Plantilla } from "../types";
import {
  CONFIRM_DELETE_ACCEPT,
  CONFIRM_DELETE_CANCEL,
  CONFIRM_DELETE_MESSAGE,
  CONFIRM_DELETE_TITLE,
  DEFAULT_DELETE_ERROR,
  DELETING_BUTTON_TEXT,
  DELETE_SUCCESS_MESSAGE,
  EMPTY_MESSAGE,
  ERROR_DEFAULT,
  LOADING_MESSAGE,
  PLANTILLAS_ROUTE,
  deletePlantillaByIdRoute,
  SCREEN_TITLE,
} from "./constants";
import { GestionPlantillasProps } from "./types";

const GestionPlantillas: React.FC<GestionPlantillasProps> = ({ navigation }) => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [deletingPlantillaId, setDeletingPlantillaId] = useState<number | null>(null);
  const [confirmDeletePlantillaId, setConfirmDeletePlantillaId] = useState<number | null>(null);

  const fetchPlantillas = useCallback(async () => {
    setLoading(true);
    setListError("");

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(PLANTILLAS_ROUTE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPlantillas(data.plantillas || []);
      } else {
        setListError(data.message || ERROR_DEFAULT);
      }
    } catch {
      setListError(ERROR_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeletePlantilla = async (idPlantilla: number) => {
    setListError("");
    setListSuccess("");
    setDeletingPlantillaId(idPlantilla);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(deletePlantillaByIdRoute(idPlantilla), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setListError(data.message || DEFAULT_DELETE_ERROR);
        return;
      }

      setListError("");
      setListSuccess(DELETE_SUCCESS_MESSAGE);
      setConfirmDeletePlantillaId(null);
      await fetchPlantillas();
    } catch {
      setListError(DEFAULT_DELETE_ERROR);
    } finally {
      setDeletingPlantillaId(null);
    }
  };

  const handleAskDeletePlantilla = (idPlantilla: number) => {
    setListError("");
    setListSuccess("");
    setConfirmDeletePlantillaId(idPlantilla);
  };

  const handleCancelDeletePlantilla = () => {
    setConfirmDeletePlantillaId(null);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlantillas();
    }, [fetchPlantillas])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.title}>{SCREEN_TITLE}</Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate("CrearPlantilla")}
        testID="create-plantilla-button"
      >
        <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.createButtonText}>Crear nueva plantilla</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>{LOADING_MESSAGE}</Text>
        </View>
      ) : null}

      {listError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{listError}</Text>
        </View>
      ) : null}

      {listSuccess ? (
        <View style={styles.successState}>
          <Text style={styles.successText}>{listSuccess}</Text>
        </View>
      ) : null}

      {!loading && !listError ? (
        plantillas.length > 0 ? (
          <ScrollView contentContainerStyle={styles.listContainer}>
            {plantillas.map((plantilla) => (
              <View key={plantilla.id_plantilla} style={styles.plantillaCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.plantillaName}>{plantilla.nombre}</Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => navigation.navigate("EditarPlantilla", { plantilla })}
                      testID={`editar-plantilla-${plantilla.id_plantilla}`}
                    >
                      <MaterialIcons name="edit" size={15} color="#1d4ed8" />
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleAskDeletePlantilla(plantilla.id_plantilla)}
                      disabled={deletingPlantillaId === plantilla.id_plantilla}
                      testID={`plantilla-delete-button-${plantilla.id_plantilla}`}
                    >
                      {deletingPlantillaId === plantilla.id_plantilla ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <MaterialIcons name="delete" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.plantillaDescription}>
                  {plantilla.descripcion || "Sin descripcion"}
                </Text>
                <View style={styles.badgesRow}>
                  <View style={styles.badge}>
                    <MaterialIcons name="content-cut" size={14} color="#1976D2" />
                    <Text style={styles.badgeText}>{plantilla.servicios.length} servicios</Text>
                  </View>
                  <View style={styles.badge}>
                    <MaterialIcons name="chair" size={14} color="#1976D2" />
                    <Text style={styles.badgeText}>{plantilla.recursos.length} recursos</Text>
                  </View>
                </View>

                {confirmDeletePlantillaId === plantilla.id_plantilla ? (
                  <View style={styles.confirmBox} testID={`plantilla-delete-confirm-${plantilla.id_plantilla}`}>
                    <Text style={styles.confirmTitle}>{CONFIRM_DELETE_TITLE}</Text>
                    <Text style={styles.confirmMessage}>{CONFIRM_DELETE_MESSAGE}</Text>
                    <View style={styles.confirmActions}>
                      <TouchableOpacity
                        style={styles.confirmCancelButton}
                        onPress={handleCancelDeletePlantilla}
                        testID={`plantilla-delete-cancel-${plantilla.id_plantilla}`}
                      >
                        <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmDeleteButton}
                        onPress={() => handleDeletePlantilla(plantilla.id_plantilla)}
                        disabled={deletingPlantillaId === plantilla.id_plantilla}
                        testID={`plantilla-delete-confirm-button-${plantilla.id_plantilla}`}
                      >
                        <Text style={styles.confirmDeleteText}>
                          {deletingPlantillaId === plantilla.id_plantilla ? DELETING_BUTTON_TEXT : CONFIRM_DELETE_ACCEPT}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>{EMPTY_MESSAGE}</Text>
          </View>
        )
      ) : null}
    </View>
  );
};

export default GestionPlantillas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc",
    paddingTop: 50,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0D47A1",
  },
  createButton: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  plantillaCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  plantillaName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 6,
  },
  editButtonText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  deleteButton: {
    width: 32,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  confirmBox: {
    marginTop: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 10,
  },
  confirmTitle: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  confirmMessage: {
    color: "#7f1d1d",
    fontSize: 12,
    marginBottom: 8,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  confirmCancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  confirmCancelText: {
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "600",
  },
  confirmDeleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  confirmDeleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  plantillaDescription: {
    fontSize: 13,
    color: "#4b5563",
  },
  badgesRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    color: "#1e3a8a",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stateText: {
    color: "#6b7280",
    fontSize: 15,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  successState: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  successText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "600",
  },
});
