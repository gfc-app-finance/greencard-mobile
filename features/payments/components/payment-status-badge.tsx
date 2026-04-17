import { AppStatusChip, type AppStatusChipTone } from '@/components/ui/app-status-chip';
import type { PaymentStatus } from '@/types/payments';

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
  label: string;
};

const toneStyles = {
  submitted: 'info',
  under_review: 'warning',
  processing: 'violet',
  completed: 'success',
  failed: 'danger',
} as const satisfies Record<PaymentStatus, AppStatusChipTone>;

export function PaymentStatusBadge({ status, label }: PaymentStatusBadgeProps) {
  return <AppStatusChip label={label} tone={toneStyles[status]} />;
}
