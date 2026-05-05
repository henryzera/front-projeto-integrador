import { StyleSheet, TextInput } from "react-native";

export default function InputAut(props: any) {
  return (
    <TextInput {...props} style={styles.input} placeholderTextColor="#999" />
  );
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00A99D",
    marginBottom: 12,
  },
});
