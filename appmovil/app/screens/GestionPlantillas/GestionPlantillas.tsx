import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { Plantilla } from "../types";
import {
  EMPTY_MESSAGE,
  ERROR_DEFAULT,
  LOADING_MESSAGE,
  PLANTILLAS_ROUTE,
  SCREEN_TITLE,
} from "./constants";
import { GestionPlantillasProps } from "./types";

const GestionPlantillas: React.FC<GestionPlantillasProps> = ({ navigation }) => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchPlantillas = async () => {
        setLoading(true);
        setErrorMessage("");

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
            setErrorMessage(data.message || ERROR_DEFAULT);
          }
        } catch (error) {
          setErrorMessage(ERROR_DEFAULT);
        } finally {
          setLoading(false);
        }
      };

      fetchPlantillas();
    }, [])
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

      {!loading && errorMessage ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!loading && !errorMessage ? (
        plantillas.length > 0 ? (
          <ScrollView contentContainerStyle={styles.listContainer}>
            {plantillas.map((plantilla) => (
              <View key={plantilla.id_plantilla} style={styles.plantillaCard}>
                <Text style={styles.plantillaName}>{plantilla.nombre}</Text>
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
  plantillaName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 6,
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
});
