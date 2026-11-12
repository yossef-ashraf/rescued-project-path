export function calculateMarketRates(prices = []) {
  const findPrice = (str) => {
    const found = prices.find(p => (p.name || '').toLowerCase().includes(str.toLowerCase()));
    return found ? parseFloat(found.price || 0) : null;
  };

  const rate24 = findPrice('24') || 5340;
  const rate21 = findPrice('21') || (rate24 * 21 / 24);
  const rate18 = findPrice('18') || (rate24 * 18 / 24);
  const poundRate = findPrice('pound') || findPrice('جنيه') || (rate21 * 8);

  const priceWithDollar = prices.find(p => p.dollar && parseFloat(p.dollar) > 0);
  const priceWithRiyal = prices.find(p => p.riyal && parseFloat(p.riyal) > 0);

  const usdRate = findPrice('dollar') || findPrice('usd') || findPrice('دولار') || (priceWithDollar ? parseFloat(priceWithDollar.dollar) : 50.45);
  const sarRate = findPrice('riyal') || findPrice('sar') || findPrice('ريال') || (priceWithRiyal ? parseFloat(priceWithRiyal.riyal) : 13.45);

  return {
    rate24,
    rate21,
    rate18,
    poundRate,
    usdRate,
    sarRate
  };
}

export function filterAndSortPrices(prices = [], search = '', sortField = 'id', sortDirection = 'desc') {
  const filtered = prices.filter(p => {
    return (p.name || '').toLowerCase().includes(search.toLowerCase());
  });

  return [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'price') {
      valA = parseFloat(a.price || 0);
      valB = parseFloat(b.price || 0);
    }

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (!isNaN(Number(valA)) && !isNaN(Number(valB)) && valA !== '' && valB !== '') {
      return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    }

    return sortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
}
