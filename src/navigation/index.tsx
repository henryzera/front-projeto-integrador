import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";

import { HomeScreen } from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import RegisterScreen from "../screens/RegisterScreen";

import { colors } from "../theme";
import type { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
  },
});

const screenOptions: NativeStackNavigationOptions = {
  contentStyle: StyleSheet.flatten(styles.content),
  headerShown: false,
};

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={screenOptions}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;
