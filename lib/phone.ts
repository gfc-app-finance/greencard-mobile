const NON_DIALABLE_CHARACTERS = /[\s()-]/g;
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizePhoneNumber(value: string) {
  return value.trim().replace(NON_DIALABLE_CHARACTERS, '');
}

export function isE164PhoneNumber(value: string) {
  return E164_PHONE_PATTERN.test(normalizePhoneNumber(value));
}

export function maskPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value);

  if (normalized.length <= 6) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}${'*'.repeat(
    Math.max(normalized.length - 6, 2),
  )}${normalized.slice(-2)}`;
}
