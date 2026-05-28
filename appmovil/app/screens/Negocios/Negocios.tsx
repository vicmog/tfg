import React, { useCallback, useState,useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Negocio } from "../types";
import { NEGOCIOS_ROUTE, SEARCH_DEBOUNCE_MS } from "./constants";
import { NegociosScreenProps } from "./types";

const Negocios: React.FC<NegociosScreenProps> = ({ navigation }) => {

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchTerm]);
  
  useFocusEffect(
    useCallback(() => {
      const fetchBusinesses = async () => {
        setIsLoading(true);
        try {
          const token = await AsyncStorage.getItem("token");
          const query = search ? `?search=${encodeURIComponent(search)}` : "";
          const response = await fetch(`${NEGOCIOS_ROUTE}${query}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setNegocios(data.negocios);
            setHasAdminAccess((prev) => prev || data.negocios.some((negocio: Negocio) => negocio.rol === "admin"));
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchBusinesses();
    }, [search])
  );

  const negociosCount = negocios.length;

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditarDatos")}
            testID="edit-profile-button"
          >
            <MaterialIcons name="person" size={18} color="#334155" style={{ marginRight: 8 }} />
            <Text style={styles.editButtonText}>Editar datos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("CrearNegocio")}
            testID="add-business-button"
          >
            <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>Añadir negocio</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>Mis negocios</Text>
          <Text style={styles.heroSubtitle}>{negociosCount} negocios activos</Text>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar por nombre o CIF"
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
            autoCapitalize="none"
            testID="business-search-input"
          />
        </View>
      </View>

      {hasAdminAccess ? (
        <View style={styles.adminSection}>
          <TouchableOpacity
            style={styles.adminTemplateButton}
            onPress={() => navigation.navigate("GestionPlantillas")}
            testID="manage-templates-button"
          >
            <MaterialIcons name="dashboard-customize" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.adminTemplateButtonText}>Gestionar plantillas</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {negocios.length > 0 ?
        <ScrollView contentContainerStyle={styles.negociosContainer}>
          {negocios.map((negocio) => (
            <TouchableOpacity 
              key={negocio.id_negocio} 
              style={styles.negocioCard} 
              testID={`business-${negocio.id_negocio}`}
              onPress={() => navigation.navigate("NegocioDetail", { negocio })}
            >
              <MaterialIcons name="store" size={36} color="#1976D2" style={{ marginRight: 12 }} />
              <View style={styles.businessMeta}>
                <Text style={styles.negocioText}>{negocio.nombre}</Text>
                <Text style={styles.negocioSubtitle}>{negocio.rol}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        :
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: "#6b7280" }}>
            {isLoading
              ? "Cargando negocios..."
              : search
                ? "No se encontraron negocios"
                : "No tienes negocios asignados"}
          </Text>
        </View>
      }
    </View>
  );
};

export default Negocios;

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 20,
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
  adminSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  adminTemplateButton: {
    backgroundColor: "#0f766e",
    borderRadius: 12,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  adminTemplateButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    flex: 1,
  },
  editButtonText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    minHeight: 36,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  negociosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  negocioCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  businessImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  businessMeta: {
    flex: 1,
    justifyContent: "center",
  },
  negocioText: {
    fontWeight: "800",
    fontSize: 14,
    color: "#0f172a",
  },
  negocioSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  actionsRow: {
    marginLeft: 8,
  },
});
