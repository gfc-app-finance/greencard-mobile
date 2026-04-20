import 'react-native-url-polyfill/auto';

import type { EmailOtpType } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export const AUTH_CONFIRMATION_ROUTE = '/auth/confirm';
const AUTH_CONFIRMATION_PATH = 'auth/confirm';
const APP_SCHEME = 'gcf';

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

export type ParsedAuthConfirmationUrl = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  type: EmailOtpType | null;
  errorCode: string | null;
  errorDescription: string | null;
};

export function getEmailConfirmationRedirectUrl() {
  if (Platform.OS === 'web') {
    return Linking.createURL(AUTH_CONFIRMATION_PATH);
  }

  if (Constants.executionEnvironment === 'storeClient') {
    return Linking.createURL(AUTH_CONFIRMATION_PATH);
  }

  return Linking.createURL(AUTH_CONFIRMATION_PATH, {
    scheme: APP_SCHEME,
  });
}

export function isAuthConfirmationPath(pathname: string) {
  return (
    pathname === AUTH_CONFIRMATION_ROUTE ||
    pathname.startsWith(`${AUTH_CONFIRMATION_ROUTE}/`)
  );
}

export function parseAuthConfirmationUrl(url: string): ParsedAuthConfirmationUrl {
  const params = getCombinedParams(url);

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    tokenHash: params.get('token_hash'),
    type: toEmailOtpType(params.get('type')),
    errorCode: params.get('error_code'),
    errorDescription: params.get('error_description'),
  };
}

function getCombinedParams(url: string) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hash = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;

  if (hash) {
    const hashParams = new URLSearchParams(hash);

    hashParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });
  }

  return params;
}

function toEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) {
    return null;
  }

  return EMAIL_OTP_TYPES.includes(value as EmailOtpType) ? (value as EmailOtpType) : null;
}
