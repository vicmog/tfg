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
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchBusinesses();
    }, [search])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("EditarDatos")}
          testID="edit-profile-button"
        >
          <MaterialIcons name="person" size={18} color="#1976D2" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>Editar datos personales</Text>
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
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar por nombre o CIF"
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
          autoCapitalize="none"
          testID="business-search-input"
        />
      </View>
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
    backgroundColor: "#f7fafc",
    paddingTop: 40,
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
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 6,
  },
  editButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1976D2",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  editButtonText: {
    width: "100%",
    color: "#1976D2",
    fontWeight: "600",
    fontSize: 14,
  },
  addButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1976D2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  negociosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  negocioCard: {
    width: "48%",
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  businessImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#f2f6fb",
    marginRight: 12,
  },
  businessMeta: {
    flex: 1,
    justifyContent: "center",
  },
  negocioText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#0D47A1",
  },
  negocioSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  actionsRow: {
    marginLeft: 8,
  },
});
