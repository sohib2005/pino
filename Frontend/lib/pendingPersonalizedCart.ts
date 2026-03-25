export interface PendingPersonalizedCartItem {
  variantId: number;
  quantity: number;
  personalizationId: string;
}

const PENDING_PERSONALIZED_CART_KEY = 'pendingPersonalizedCart';

export function savePendingPersonalizedCartItem(item: PendingPersonalizedCartItem): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_PERSONALIZED_CART_KEY, JSON.stringify(item));
}

export function getPendingPersonalizedCartItem(): PendingPersonalizedCartItem | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(PENDING_PERSONALIZED_CART_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingPersonalizedCartItem>;
    if (
      typeof parsed?.variantId === 'number' &&
      typeof parsed?.quantity === 'number' &&
      typeof parsed?.personalizationId === 'string' &&
      parsed.personalizationId.length > 0
    ) {
      return {
        variantId: parsed.variantId,
        quantity: parsed.quantity,
        personalizationId: parsed.personalizationId,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function clearPendingPersonalizedCartItem(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_PERSONALIZED_CART_KEY);
}