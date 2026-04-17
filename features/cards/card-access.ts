import type { ManagedCard } from '@/types/fintech';
import type { VerificationAccess } from '@/types/verification';

export function hasActiveManagedCard(cards: ManagedCard[]) {
  return cards.some((card) => card.status !== 'terminated');
}

export function canCreateVirtualCard(access: VerificationAccess) {
  return access.canCreateCard;
}

export function canFundVirtualCard(
  access: VerificationAccess,
  card: ManagedCard | null | undefined
) {
  return access.canFundCard && Boolean(card && card.status !== 'terminated');
}

export function canManageVirtualCard(
  access: VerificationAccess,
  card: ManagedCard | null | undefined
) {
  return access.canManageCard && Boolean(card && card.status !== 'terminated');
}
