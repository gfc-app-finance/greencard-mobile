import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const canUseBrowserStorage = isWeb && typeof window !== 'undefined';

const noopStorage = {
  getItem() {
    return Promise.resolve<string | null>(null);
  },
  setItem() {
    return Promise.resolve();
  },
  removeItem() {
    return Promise.resolve();
  },
};

export const authStorage = {
  getItem(key: string) {
    if (canUseBrowserStorage) {
      return AsyncStorage.getItem(key);
    }

    if (isWeb) {
      return noopStorage.getItem();
    }

    return SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string) {
    if (canUseBrowserStorage) {
      return AsyncStorage.setItem(key, value);
    }

    if (isWeb) {
      return noopStorage.setItem();
    }

    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string) {
    if (canUseBrowserStorage) {
      return AsyncStorage.removeItem(key);
    }

    if (isWeb) {
      return noopStorage.removeItem();
    }

    return SecureStore.deleteItemAsync(key);
  },
};
