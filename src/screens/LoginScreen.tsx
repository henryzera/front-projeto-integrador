import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ButtonAut from "../components/autentication/ButtonAut";
import InputAut from "../components/autentication/InputAut";

export default function LoginScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>nome do app</Text>
      <Text style={styles.subtitle}>Seja bem-vindo(a)!</Text>

      <InputAut placeholder="Digite seu Email ou CNPJ" />
      <InputAut placeholder="Digite sua senha" secureTextEntry />

      <TouchableOpacity>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <ButtonAut title="Log in" onPress={() => navigation.navigate("Home")} />

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>
          Não tem uma conta?{" "}
          <Text style={{ fontWeight: "bold" }}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 20 },
  link: { textAlign: "center", marginTop: 10, color: "#00A99D" },
});
