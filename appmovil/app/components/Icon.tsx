import { Image, StyleSheet } from "react-native";
const styles = StyleSheet.create({
  icon: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
});
export default function Icon() {
  return (
    <Image
      source={require("@/assets/images/android-icon-foreground.png")}
      style={styles.icon}
    />
  );
}
