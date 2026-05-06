import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const tokenKey = 'auth_token';

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
