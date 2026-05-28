import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
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
  EMPTY_ACTION_TEXT,
  EMPTY_DESCRIPTION,
  EMPTY_MESSAGE,
  ERROR_DEFAULT,
  LOADING_MESSAGE,
  NO_RESULTS_DESCRIPTION,
  NO_RESULTS_MESSAGE,
  PLANTILLAS_ROUTE,
  RETRY_TEXT,
  SEARCH_PLACEHOLDER,
  SCREEN_SUBTITLE,
  deletePlantillaByIdRoute,
  SCREEN_TITLE,
} from "./constants";
import { GestionPlantillasProps } from "./types";

const GestionPlantillas: React.FC<GestionPlantillasProps> = ({ navigation }) => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [deletingPlantillaId, setDeletingPlantillaId] = useState<number | null>(null);
  const [confirmDeletePlantillaId, setConfirmDeletePlantillaId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchPlantillas = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

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
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
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
      await fetchPlantillas(false);
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

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredPlantillas = (() => {
    if (!normalizedSearch) {
      return plantillas;
    }

    return plantillas.filter((plantilla) =>
      `${plantilla.nombre ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  })();

  const renderEmptyState = () => (
    <View style={styles.emptyStateWrap}>
      <MaterialIcons
        name={normalizedSearch ? "search-off" : "inventory-2"}
        size={34}
        color="#64748b"
      />
      <Text style={styles.emptyStateTitle}>
        {normalizedSearch ? NO_RESULTS_MESSAGE : EMPTY_MESSAGE}
      </Text>
      <Text style={styles.emptyStateDescription}>
        {normalizedSearch ? NO_RESULTS_DESCRIPTION : EMPTY_DESCRIPTION}
      </Text>

      {normalizedSearch ? (
        <TouchableOpacity style={styles.emptyStateButton} onPress={() => setSearchText("")}>
          <Text style={styles.emptyStateButtonText}>Reestablecer busqueda</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate("CrearPlantilla")}
          testID="empty-create-plantilla-button"
        >
          <Text style={styles.emptyStateButtonText}>{EMPTY_ACTION_TEXT}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPlantillaItem = ({ item: plantilla }: { item: Plantilla }) => (
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
  );

  const hasPlantillas = filteredPlantillas.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CrearPlantilla")}
            testID="create-plantilla-button"
          >
            <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.createButtonText}>Crear plantilla</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>{SCREEN_TITLE}</Text>
          <Text style={styles.heroSubtitle}>{SCREEN_SUBTITLE}</Text>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={SEARCH_PLACEHOLDER}
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            testID="plantillas-search-input"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")} style={styles.searchClearButton}>
              <MaterialIcons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading && !hasPlantillas ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.stateText}>{LOADING_MESSAGE}</Text>
        </View>
      ) : null}

      {listError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{listError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPlantillas(!hasPlantillas)}>
            <Text style={styles.retryButtonText}>{RETRY_TEXT}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {listSuccess ? (
        <View style={styles.successState}>
          <Text style={styles.successText}>{listSuccess}</Text>
          <TouchableOpacity onPress={() => setListSuccess("")}> 
            <MaterialIcons name="close" size={18} color="#166534" />
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading || hasPlantillas ? (
        <FlatList
          data={filteredPlantillas}
          keyExtractor={(item) => `${item.id_plantilla}`}
          renderItem={renderPlantillaItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchPlantillas(false)}
          ListEmptyComponent={renderEmptyState}
        />
      ) : null}
    </View>
  );
};

export default GestionPlantillas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
    paddingTop: 12,
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  heroBody: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  createButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 999,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 8,
  },
  searchClearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  plantillaCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  plantillaName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  editButtonText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  deleteButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
    marginTop: 12,
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  badgeText: {
    color: "#1d4ed8",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
  },
  stateText: {
    color: "#6b7280",
    fontSize: 15,
    marginTop: 10,
  },
  errorState: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  retryButton: {
    backgroundColor: "#fff",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryButtonText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  emptyStateWrap: {
    marginTop: 8,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyStateTitle: {
    marginTop: 8,
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyStateDescription: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyStateButton: {
    marginTop: 14,
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
