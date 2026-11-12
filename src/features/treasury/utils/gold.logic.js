export function getAssetTypeInfo(name = '', note = '', explicitCurrency = null) {
  const normCurrency = (explicitCurrency || '').toUpperCase();
  const lowerName = (name || '').toLowerCase();
  const lowerNote = (note || '').toLowerCase();

  // 1. Explicit currency check
  if (normCurrency === 'EGP' || normCurrency === 'CASH') {
    return {
      type: 'EGP',
      isGold: false,
      currencyCode: 'EGP',
      unitLabel: 'EGP',
      unitLabelAr: 'ج.م',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      badgeLabel: '🇪🇬 EGP (جنيه مصري)'
    };
  }

  if (normCurrency === 'SAR') {
    return {
      type: 'SAR',
      isGold: false,
      currencyCode: 'SAR',
      unitLabel: 'SAR',
      unitLabelAr: 'ر.س',
      badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
      badgeLabel: '🇸🇦 SAR (ريال سعودي)'
    };
  }

  if (normCurrency === 'USD') {
    return {
      type: 'USD',
      isGold: false,
      currencyCode: 'USD',
      unitLabel: 'USD',
      unitLabelAr: '$',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      badgeLabel: '🇺🇸 USD (دولار)'
    };
  }

  if (normCurrency === 'GOLD_24') {
    return {
      type: 'GOLD',
      isGold: true,
      karat: 24,
      unitLabel: 'g',
      unitLabelAr: 'جم',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      badgeLabel: '🪙 24K Gold (ذهب 24)'
    };
  }

  if (normCurrency === 'GOLD_18') {
    return {
      type: 'GOLD',
      isGold: true,
      karat: 18,
      unitLabel: 'g',
      unitLabelAr: 'جم',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      badgeLabel: '🪙 18K Gold (ذهب 18)'
    };
  }

  if (normCurrency === 'GOLD' || normCurrency === 'GOLD_21') {
    return {
      type: 'GOLD',
      isGold: true,
      karat: 21,
      unitLabel: 'g',
      unitLabelAr: 'جم',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      badgeLabel: '🪙 21K Gold (ذهب 21)'
    };
  }

  // 2. Name-based priority detection (Name always takes precedence over notes)
  if (lowerName.includes('egp') || lowerName.includes('جنيه مصري') || lowerName.includes('مصري') || lowerName === 'cash' || lowerName.includes('cash egp') || lowerName.includes('كاش مصري')) {
    return {
      type: 'EGP',
      isGold: false,
      currencyCode: 'EGP',
      unitLabel: 'EGP',
      unitLabelAr: 'ج.م',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      badgeLabel: '🇪🇬 EGP (جنيه مصري)'
    };
  }

  if (lowerName.includes('sar') || lowerName.includes('riyal') || lowerName.includes('ريال') || lowerName.includes('ر.س')) {
    return {
      type: 'SAR',
      isGold: false,
      currencyCode: 'SAR',
      unitLabel: 'SAR',
      unitLabelAr: 'ر.س',
      badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
      badgeLabel: '🇸🇦 SAR (ريال سعودي)'
    };
  }

  if (lowerName.includes('usd') || lowerName.includes('dollar') || lowerName.includes('دولار')) {
    return {
      type: 'USD',
      isGold: false,
      currencyCode: 'USD',
      unitLabel: 'USD',
      unitLabelAr: '$',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      badgeLabel: '🇺🇸 USD (دولار)'
    };
  }

  if (lowerName.includes('gold') || lowerName.includes('ذهب') || lowerName.includes('عيار') || lowerName.includes('سبيكة') || lowerName.includes('سبيكه') || lowerName.includes('سبائك') || lowerName.includes('جنيه دهب')) {
    let karat = 21;
    if (lowerName.includes('24') || lowerName.includes('٢٤')) karat = 24;
    else if (lowerName.includes('18') || lowerName.includes('١٨')) karat = 18;

    return {
      type: 'GOLD',
      isGold: true,
      karat,
      unitLabel: 'g',
      unitLabelAr: 'جم',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      badgeLabel: `🪙 ${karat}K Gold (ذهب ${karat})`
    };
  }

  if (lowerName.includes('cash') || lowerName.includes('cach') || lowerName.includes('كاش')) {
    return {
      type: 'EGP',
      isGold: false,
      currencyCode: 'EGP',
      unitLabel: 'EGP',
      unitLabelAr: 'ج.م',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      badgeLabel: '🇪🇬 EGP (جنيه مصري)'
    };
  }

  // 3. Fallback to Note detection only if name didn't identify it
  if (lowerNote.includes('egp') || lowerNote.includes('جنيه مصري') || lowerNote.includes('مصري')) {
    return {
      type: 'EGP',
      isGold: false,
      currencyCode: 'EGP',
      unitLabel: 'EGP',
      unitLabelAr: 'ج.م',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      badgeLabel: '🇪🇬 EGP (جنيه مصري)'
    };
  }

  if (lowerNote.includes('sar') || lowerNote.includes('riyal') || lowerNote.includes('ريال') || lowerNote.includes('ر.س')) {
    return {
      type: 'SAR',
      isGold: false,
      currencyCode: 'SAR',
      unitLabel: 'SAR',
      unitLabelAr: 'ر.س',
      badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
      badgeLabel: '🇸🇦 SAR (ريال سعودي)'
    };
  }

  if (lowerNote.includes('usd') || lowerNote.includes('dollar') || lowerNote.includes('دولار')) {
    return {
      type: 'USD',
      isGold: false,
      currencyCode: 'USD',
      unitLabel: 'USD',
      unitLabelAr: '$',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      badgeLabel: '🇺🇸 USD (دولار)'
    };
  }

  // Default Gold 21
  let karat = 21;
  const combined = `${lowerName} ${lowerNote}`;
  if (combined.includes('24') || combined.includes('٢٤')) karat = 24;
  else if (combined.includes('18') || combined.includes('١٨')) karat = 18;

  return {
    type: 'GOLD',
    isGold: true,
    karat,
    unitLabel: 'g',
    unitLabelAr: 'جم',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    badgeLabel: `🪙 ${karat}K Gold (ذهب ${karat})`
  };
}

export function calculateGoldMetrics(assets = []) {
  const safeAssets = Array.isArray(assets)
    ? assets
    : (assets && Array.isArray(assets.data) ? assets.data : []);

  let rawWeight = 0;
  let equivalent21kWeight = 0;
  let totalCost = 0;
  let totalGoldValuation = 0;
  let liquidCash = 0;
  let liquidCashCost = 0;

  safeAssets.forEach(g => {
    const weight = parseFloat(g.val || 0);
    const cost = parseFloat(g.price || 0);
    const curVal = parseFloat(g.amount || 0);
    const info = getAssetTypeInfo(g.name, g.note, g.currency);

    if (!info.isGold) {
      liquidCash += curVal || cost;
      liquidCashCost += cost;
    } else {
      rawWeight += weight;
      const karat = info.karat || 21;
      equivalent21kWeight += (weight * karat) / 21;

      totalCost += cost;
      totalGoldValuation += curVal;
    }
  });

  const totalCurrentValuation = totalGoldValuation + liquidCash;
  const totalPortfolioCost = totalCost + liquidCashCost;
  const totalProfit = totalCurrentValuation - totalPortfolioCost;
  const profitPercentage = totalPortfolioCost > 0 ? (totalProfit / totalPortfolioCost) * 100 : 0;

  return {
    totalWeight: rawWeight,
    rawWeight,
    equivalent21kWeight,
    totalGoldValuation,
    totalCost,
    totalPortfolioCost,
    totalCurrentValuation,
    liquidCash,
    totalProfit,
    profitPercentage
  };
}

export function filterAndSortGold(assets = [], search = '', sortField = 'id', sortDirection = 'desc') {
  const safeAssets = Array.isArray(assets)
    ? assets
    : (assets && Array.isArray(assets.data) ? assets.data : []);

  const filtered = safeAssets.filter(g => {
    const matchesSearch = (g.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.note && g.note.toLowerCase().includes(search.toLowerCase())) ||
      (g.currency && g.currency.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'profit') {
      valA = parseFloat(a.amount || 0) - parseFloat(a.price || 0);
      valB = parseFloat(b.amount || 0) - parseFloat(b.price || 0);
    } else if (sortField === 'val' || sortField === 'price' || sortField === 'amount' || sortField === 'rate') {
      valA = parseFloat(a[sortField] || 0);
      valB = parseFloat(b[sortField] || 0);
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

export function getMediaSrc(pathStr) {
  if (!pathStr) return null;
  const trimmed = String(pathStr).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}
