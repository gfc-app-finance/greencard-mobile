import type { AppStatusChipTone } from '@/components/ui/app-status-chip';
import { getManagedCardStatusLabel } from '@/services/goova-app-state-service';
import type { ManagedCardStatus } from '@/types/fintech';

export function resolveManagedCardStatusLabel(status: ManagedCardStatus) {
  return getManagedCardStatusLabel(status);
}

export function resolveManagedCardStatusTone(
  status: ManagedCardStatus
): AppStatusChipTone {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'pending') {
    return 'warning';
  }

  if (status === 'terminated') {
    return 'danger';
  }

  return 'neutral';
}

export function canToggleManagedCardFreeze(status: ManagedCardStatus) {
  return status === 'active' || status === 'frozen';
}
