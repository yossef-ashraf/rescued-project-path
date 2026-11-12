export function getYoutubeEmbed(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function sortHierarchyItems(list = []) {
    return [...list].sort((a, b) => {
        const orderA = (a?.sort_order !== undefined && a?.sort_order !== null && a?.sort_order !== '') ? Number(a.sort_order) : 999999;
        const orderB = (b?.sort_order !== undefined && b?.sort_order !== null && b?.sort_order !== '') ? Number(b.sort_order) : 999999;
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        const isCatA = (a?.type?.toLowerCase() === 'category' || a?.resource_type?.toLowerCase() === 'category') ? 1 : 0;
        const isCatB = (b?.type?.toLowerCase() === 'category' || b?.resource_type?.toLowerCase() === 'category') ? 1 : 0;
        if (isCatA !== isCatB) {
            return isCatB - isCatA;
        }

        const titleA = String(a?.title || '').trim();
        const titleB = String(b?.title || '').trim();
        const titleCompare = titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
        if (titleCompare !== 0) {
            return titleCompare;
        }

        return String(a?.id || '').localeCompare(String(b?.id || ''));
    });
}

export function computeRootNodes(itemsMap = {}) {
    const roots = Object.values(itemsMap).filter(item =>
        !item.parent_id ||
        item.parent_id === null ||
        item.parent_id === 'null' ||
        item.parent_id === 'none' ||
        item.parent_id === 0 ||
        item.parent_id === '0' ||
        String(item.parent_id) === String(item.id) ||
        !itemsMap[item.parent_id]
    );
    return sortHierarchyItems(roots);
}

export function computeDescendantCategoryIds(catList = []) {
    const catMap = {};
    catList.forEach(cat => {
        const descendantCatIds = new Set([String(cat.id)]);
        const queue = [String(cat.id)];
        while (queue.length > 0) {
            const cur = queue.shift();
            catList.forEach(c => {
                if (String(c.parent_id) === cur && !descendantCatIds.has(String(c.id))) {
                    descendantCatIds.add(String(c.id));
                    queue.push(String(c.id));
                }
            });
        }
        catMap[cat.id] = descendantCatIds;
    });
    return catMap;
}
