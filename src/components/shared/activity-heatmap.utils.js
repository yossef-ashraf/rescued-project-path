export function calculateHeatmapIntensity(value, maxValue = 10) {
    const numericVal = Number(value) || 0;
    if (numericVal <= 0) return 0;
    if (!maxValue || maxValue <= 0) return 1;

    const ratio = numericVal / maxValue;
    if (ratio >= 0.75) return 4;
    if (ratio >= 0.50) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
}

export function normalizeActivityPoints(points = []) {
    if (!Array.isArray(points)) return [];

    return points
        .filter((item) => item && (item.date || item.day))
        .map((item) => {
            const dateStr = String(item.date || item.day).split('T')[0];
            const value = Number(item.count ?? item.value ?? item.points ?? 0);
            return {
                date: dateStr,
                value: isNaN(value) ? 0 : Math.max(0, value),
                label: item.label || dateStr
            };
        })
        .sort((a, b) => (a.date > b.date ? 1 : -1));
}
