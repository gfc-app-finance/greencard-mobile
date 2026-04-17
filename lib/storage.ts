import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const authStorage = {
  getItem(key: string) {
    return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string) {
    return isWeb
      ? AsyncStorage.setItem(key, value)
      : SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string) {
    return isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  },
};
