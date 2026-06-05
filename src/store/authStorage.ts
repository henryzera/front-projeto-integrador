import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const tokenKey = 'auth_token';
const onboardingKey = 'onboarding_completed';
const onboardingCompletedValue = 'true';

const webStorage = {
  deleteItem(key: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
  getItem(key: string) {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
};

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webStorage.getItem(tokenKey);
  }

  return SecureStore.getItemAsync(tokenKey);
}

export async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.setItem(tokenKey, token);
    return;
  }

  await SecureStore.setItemAsync(tokenKey, token);
}

export async function clearStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.deleteItem(tokenKey);
    return;
  }

  await SecureStore.deleteItemAsync(tokenKey);
}

export async function getOnboardingCompleted(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return webStorage.getItem(onboardingKey) === onboardingCompletedValue;
  }

  const stored = await SecureStore.getItemAsync(onboardingKey);

  return stored === onboardingCompletedValue;
}

export async function setOnboardingCompleted(value: boolean): Promise<void> {
  if (Platform.OS === 'web') {
    if (value) {
      webStorage.setItem(onboardingKey, onboardingCompletedValue);
    } else {
      webStorage.deleteItem(onboardingKey);
    }

    return;
  }

  if (value) {
    await SecureStore.setItemAsync(onboardingKey, onboardingCompletedValue);
    return;
  }

  await SecureStore.deleteItemAsync(onboardingKey);
}
