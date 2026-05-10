import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface StatCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  value: string | number;
  unit?: string;
  color?: string;
  backgroundColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  unit,
  color = "#2563eb",
  backgroundColor = "#dbeafe",
}) => {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={icon} size={28} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
  },
  unit: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
});

export default StatCard;
