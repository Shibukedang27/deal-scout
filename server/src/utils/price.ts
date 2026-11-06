/** Pull a number out of strings like "£51.77" or "₹1,299.00" */
export function parsePrice(raw: string): { price: number; currency: string; priceDisplay: string } {
  const priceDisplay = raw.trim();
  let currency = 'USD';
  if (priceDisplay.includes('£')) currency = 'GBP';
  else if (priceDisplay.includes('₹') || priceDisplay.toLowerCase().includes('rs')) currency = 'INR';
  else if (priceDisplay.includes('€')) currency = 'EUR';
  else if (priceDisplay.includes('$')) currency = 'USD';

  const cleaned = priceDisplay.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned) || 0;
  return { price, currency, priceDisplay };
}
