import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type FilterType = "today" | "week" | "month" | "year" | "custom";

interface StatsFilterProps {
  onFilterChange: (filter: FilterType, startDate?: string, endDate?: string) => void;
  currentFilter: FilterType;
}

const StatsFilter: React.FC<StatsFilterProps> = ({ onFilterChange, currentFilter }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const filterOptions = [
    { label: "Hoy", value: "today" as FilterType },
    { label: "Semana", value: "week" as FilterType },
    { label: "Mes", value: "month" as FilterType },
    { label: "Año", value: "year" as FilterType },
  ];

  const handleSelectFilter = (filter: FilterType) => {
    onFilterChange(filter);
    setModalVisible(false);
  };

  const currentLabel = filterOptions.find((f) => f.value === currentFilter)?.label || "Filtro";

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="filter-list" size={20} color="#2563eb" />
        <Text style={styles.filterButtonText}>{currentLabel}</Text>
        <MaterialIcons name="expand-more" size={20} color="#2563eb" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por período</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    currentFilter === option.value && styles.optionActive,
                  ]}
                  onPress={() => handleSelectFilter(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      currentFilter === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {currentFilter === option.value && (
                    <MaterialIcons name="check" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 16,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  optionsList: {
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  optionActive: {
    backgroundColor: "#f0f9ff",
  },
  optionText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  optionTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
});

export default StatsFilter;
