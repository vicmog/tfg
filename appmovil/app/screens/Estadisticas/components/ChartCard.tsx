import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ChartDataItem {
  label: string;
  value: string | number;
  icon?: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  secondary?: string;
  tertiary?: string;
}

interface ChartCardProps {
  title: string;
  data: ChartDataItem[];
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  emptyMessage?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  loading = false,
  icon = "bar-chart",
  emptyMessage = "Sin datos disponibles",
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon} size={20} color="#2563eb" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="info-outline" size={32} color="#d1d5db" />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView style={styles.dataList} showsVerticalScrollIndicator={false}>
          {data.map((item, index) => (
            <View
              key={index}
              style={[
                styles.dataItem,
                index !== data.length - 1 && styles.dataItemBorder,
              ]}
            >
              {item.icon && (
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={item.color || "#2563eb"}
                  style={styles.itemIcon}
                />
              )}
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel} numberOfLines={2}>
                  {item.label}
                </Text>
                {item.secondary && (
                  <Text style={styles.itemSecondary}>{item.secondary}</Text>
                )}
              </View>
              <View style={styles.itemValue}>
                <Text style={[styles.valueText, { color: item.color || "#2563eb" }]}>
                  {item.value}
                </Text>
                {item.tertiary && (
                  <Text style={styles.valueTertiary}>{item.tertiary}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
  dataList: {
    maxHeight: 300,
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  dataItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemIcon: {
    marginRight: 4,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  itemSecondary: {
    fontSize: 11,
    color: "#9ca3af",
  },
  itemValue: {
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "700",
  },
  valueTertiary: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
});

export default ChartCard;
