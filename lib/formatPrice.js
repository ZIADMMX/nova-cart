export function formatPrice(value, currency = 'EGP') {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) {
    return '0.00 ج.م';
  }

  const symbol = currency === 'USD' ? '$' : currency === 'SAR' ? 'ر.س' : 'ج.م';
  return `${numericValue.toFixed(2)} ${symbol}`;
}
