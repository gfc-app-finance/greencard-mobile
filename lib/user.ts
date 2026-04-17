import type { User } from '@supabase/supabase-js';

function rawName(user: User | null | undefined) {
  if (!user) {
    return '';
  }

  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim().length > 0) {
    return fullName.trim();
  }

  if (typeof user.email === 'string' && user.email.length > 0) {
    return user.email.split('@')[0] ?? '';
  }

  return '';
}

export function getUserDisplayName(user: User | null | undefined) {
  return rawName(user) || 'Greencard customer';
}

export function getUserFirstName(user: User | null | undefined) {
  return rawName(user).split(' ')[0] || 'there';
}

export function getUserInitials(user: User | null | undefined) {
  const name = rawName(user);

  if (!name) {
    return 'GC';
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'GC';
}
