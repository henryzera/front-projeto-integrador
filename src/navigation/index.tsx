import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { MainTabNavigator } from "./MainTabNavigator";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { OpportunityDetailScreen } from "../screens/OpportunityDetailScreen";
import { RegisterScreen } from "../screens/RegisterScreen";

import { useAuth } from "../store";
import { getOnboardingCompleted } from "../store/authStorage";
import { colors } from "../theme";
import type { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
  },
  loading: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
});

const screenOptions: NativeStackNavigationOptions = {
  contentStyle: StyleSheet.flatten(styles.content),
  headerShown: false,
};

export function AppNavigator() {
  const { isLoading, user } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOnboardingFlag() {
      try {
        const completed = await getOnboardingCompleted();

        if (isMounted) {
          setOnboardingCompleted(completed);
        }
      } catch {
        if (isMounted) {
          setOnboardingCompleted(false);
        }
      }
    }

    void loadOnboardingFlag();

    return () => {
      isMounted = false;
    };
  }, []);

  const isResolvingOnboarding = onboardingCompleted === null;

  if (isLoading || isResolvingOnboarding) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
    >
      {user ? (
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          {onboardingCompleted ? null : (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

export default AppNavigator;
