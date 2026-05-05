import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ButtonAut from "../components/autentication/ButtonAut";
import InputAut from "../components/autentication/InputAut";

export default function RegisterScreen() {
  const [step, setStep] = useState(1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crie uma conta</Text>
      <Text style={styles.step}>Passo {step} de 3</Text>

      {step === 1 && (
        <>
          <InputAut placeholder="Email" />
          <InputAut placeholder="Nome" />
          <InputAut placeholder="Sobrenome" />
        </>
      )}

      {step === 2 && (
        <>
          <InputAut placeholder="CNPJ" />
          <InputAut placeholder="CNAE" />
        </>
      )}

      {step === 3 && (
        <>
          <InputAut placeholder="Senha" secureTextEntry />
          <InputAut placeholder="Confirmar senha" secureTextEntry />
        </>
      )}

      {step < 3 ? (
        <ButtonAut title="Próximo" onPress={() => setStep(step + 1)} />
      ) : (
        <ButtonAut
          title="Cadastrar"
          onPress={() => navigation.navigate("Login")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  step: { textAlign: "center", marginBottom: 20, color: "#00A99D" },
});
