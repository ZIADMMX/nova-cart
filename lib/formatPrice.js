export function formatPrice(value, currency = 'USD') {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) {
    return '0.00';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${numericValue.toFixed(2)} ${currency}`;
  }
}
