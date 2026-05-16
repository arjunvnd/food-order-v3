const ACTIVE_ORDER_KEY = "food_order_active";

interface ActiveOrder {
  orderId: string;
  savedAt: string;
}

export function saveActiveOrder(orderId: string): void {
  try {
    const data: ActiveOrder = { orderId, savedAt: new Date().toISOString() };
    localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable in private browsing — silently ignore
  }
}

export function getActiveOrder(): ActiveOrder | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveOrder;
  } catch {
    return null;
  }
}

export function clearActiveOrder(): void {
  try {
    localStorage.removeItem(ACTIVE_ORDER_KEY);
  } catch {
    // ignore
  }
}
