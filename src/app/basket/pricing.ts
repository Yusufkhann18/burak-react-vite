export const freeShippingThreshold = 100;

export function getDeliveryCost(subtotal: number) {
  return subtotal > 0 && subtotal < freeShippingThreshold ? 5 : 0;
}

export function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}
