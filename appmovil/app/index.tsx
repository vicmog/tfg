import { Text, StyleSheet, View } from "react-native";
import Icon from "./components/icon";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default function Home() {
  return (
    <View style={styles.container}>
      <Icon></Icon>
      <Text style={styles.title}>Bienvenido</Text>
    </View>
  );
}
