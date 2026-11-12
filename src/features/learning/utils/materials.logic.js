import { STANDARD_PREFIXES, PREFIX_PRIORITY_ORDER } from '../constants/materials.constants.js';

export function getFileTypeCategory(item) {
    if (!item) return 'doc';
    const explicitType = (item.file_type || '').toLowerCase();
    if (explicitType === 'note') return 'note';
    if (explicitType === 'link') return 'link';
    if (explicitType === 'pdf') return 'pdf';

    const name = (item.file_name || '').toLowerCase();
    const url = (item.file_url || '').toLowerCase();
    const full = (name + ' ' + url).trim();

    if (url.startsWith('data:text/')) return 'note';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'link';
    if (full.endsWith('.pdf') || full.includes('.pdf')) return 'pdf';
    if (full.endsWith('.doc') || full.endsWith('.docx') || full.endsWith('.txt') || full.endsWith('.md')) return 'doc';
    if (full.endsWith('.xls') || full.endsWith('.xlsx') || full.endsWith('.csv')) return 'doc';
    if (full.endsWith('.mp4') || full.endsWith('.mov') || full.endsWith('.webm') || full.endsWith('.mkv') || full.endsWith('.mp3')) return 'media';
    if (full.endsWith('.png') || full.endsWith('.jpg') || full.endsWith('.jpeg') || full.endsWith('.svg') || full.endsWith('.webp')) return 'media';
    if (full.endsWith('.zip') || full.endsWith('.tar') || full.endsWith('.gz') || full.endsWith('.rar') || full.endsWith('.7z')) return 'code';
    if (full.endsWith('.js') || full.endsWith('.jsx') || full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.py') || full.endsWith('.json') || full.endsWith('.html') || full.endsWith('.css')) return 'code';
    return 'doc';
}

export function isLinkItem(item) {
    const cat = getFileTypeCategory(item);
    if (cat === 'pdf' || cat === 'doc' || cat === 'media' || cat === 'code' || cat === 'note') {
        return false;
    }
    return cat === 'link' || (item?.file_url && (item.file_url.startsWith('http://') || item.file_url.startsWith('https://')) && !item.file_url.includes('drive.google.com') && !item.file_url.includes('googleusercontent.com'));
}

export function getDownloadUrl(item) {
    if (!item || !item.file_url) return '#';
    if (item.file_url.includes('drive.google.com/file/d/')) {
        const match = item.file_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }
    return item.file_url;
}

export function decodeHtmlEntities(str) {
    if (!str || typeof str !== 'string') return str || '';
    return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

export function cleanTitleForSort(str) {
    if (!str) return '';
    let decoded = decodeHtmlEntities(str).trim();
    while (decoded.length > 0 && ['[', '(', '«', '"', "'", '“', '”', '`', '#', '<', '>', ':', '-', '_', '.', '/', '\\', '&'].includes(decoded[0])) {
        decoded = decoded.substring(1).trim();
    }
    return decoded;
}

export function getLetterKey(str) {
    if (!str) return '#';
    const trimmed = cleanTitleForSort(str);
    if (!trimmed) return '#';
    const first = trimmed[0];
    if (/^[a-zA-Z]$/.test(first)) {
        return first.toUpperCase();
    }
    if (/^[\u0600-\u06FF]$/.test(first)) {
        if (['أ', 'إ', 'آ', 'ٱ', 'ا'].includes(first)) return 'أ';
        return first;
    }
    return '#';
}

export function filterMaterials(files = [], { searchQuery = '', selectedCategory = 'all', typeFilter = 'all', statusFilter = 'all', courseFilter = 'all', itemTypeFilter = 'all' } = {}) {
    return files.filter(item => {
        if (itemTypeFilter && itemTypeFilter !== 'all') {
            const currentItemType = item.item_type || 'material';
            if (currentItemType !== itemTypeFilter) return false;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = (item.file_name || '').toLowerCase().includes(q);
            const matchDesc = (item.description || '').toLowerCase().includes(q);
            const matchCategory = (item.category_name || '').toLowerCase().includes(q);
            const matchNotes = (item.notes || '').toLowerCase().includes(q);
            const matchCourse = (item.course_title || '').toLowerCase().includes(q);
            const matchUrl = (item.file_url || '').toLowerCase().includes(q);
            if (!matchName && !matchDesc && !matchCategory && !matchNotes && !matchCourse && !matchUrl) return false;
        }

        if (selectedCategory !== 'all') {
            if (String(item.category_name || '').trim().toLowerCase() !== String(selectedCategory).trim().toLowerCase()) return false;
        }

        if (typeFilter !== 'all') {
            const cat = getFileTypeCategory(item);
            if (cat !== typeFilter) return false;
        }

        if (statusFilter !== 'all') {
            const s = item.reading_status || 'unread';
            if (statusFilter === 'read' && s !== 'read' && s !== 'completed') return false;
            if (statusFilter === 'in_progress' && s !== 'in_progress') return false;
            if (statusFilter === 'unread' && s !== 'unread') return false;
        }

        if (courseFilter !== 'all') {
            if (courseFilter === 'unlinked') {
                if (item.course_id) return false;
            } else if (courseFilter === 'linked') {
                if (!item.course_id) return false;
            } else {
                if (String(item.course_id) !== String(courseFilter)) return false;
            }
        }

        return true;
    });
}

export function extractPrefixes(files = []) {
    const set = new Set(STANDARD_PREFIXES);
    files.forEach(f => {
        const match = f.file_name?.match(/^([A-Za-z0-9\u0600-\u06FF\s._-]+?)\s*[:\-]\s+/);
        if (match) {
            const p = match[1].trim();
            if (p.length > 0 && p.length <= 25) {
                const normalized = /^[A-Za-z0-9\s._-]+$/.test(p) ? p.toUpperCase() : p;
                set.add(normalized + ':');
            }
        }
    });

    const getPriority = (prefix) => {
        const norm = (prefix || '').trim().replace(/[:\-]$/, '').toLowerCase();
        const index = PREFIX_PRIORITY_ORDER.findIndex(
            p => p.replace(/[:\-]$/, '').toLowerCase() === norm
        );
        return index !== -1 ? index : 999;
    };

    return Array.from(set).sort((a, b) => {
        const prioA = getPriority(a);
        const prioB = getPriority(b);
        if (prioA !== prioB) {
            return prioA - prioB;
        }
        return a.localeCompare(b, ['ar', 'en'], { sensitivity: 'base' });
    });
}

export function compareLetterKeys(a, b) {
    if (a === b) return 0;
    if (a === '#') return -1;
    if (b === '#') return 1;
    const isArA = /^[\u0600-\u06FF]$/.test(a);
    const isArB = /^[\u0600-\u06FF]$/.test(b);
    if (isArA && !isArB) return -1;
    if (!isArA && isArB) return 1;
    return a.localeCompare(b, ['ar', 'en'], { sensitivity: 'base' });
}

export function sortMaterials(files = []) {
    return [...files].sort((a, b) => {
        const cleanA = cleanTitleForSort(a.file_name);
        const cleanB = cleanTitleForSort(b.file_name);
        return cleanA.localeCompare(cleanB, ['ar', 'en'], { sensitivity: 'base', numeric: true });
    });
}

export function getItemTag(item) {
    if (item?.tags && String(item.tags).trim()) {
        return decodeHtmlEntities(String(item.tags).trim());
    }
    const rawName = decodeHtmlEntities(item?.file_name || '').trim();
    if (!rawName) return 'Other';

    // 1. Check for [TAG]
    const bracketMatch = rawName.match(/^\[([^\]]+)\]/);
    if (bracketMatch) return decodeHtmlEntities(bracketMatch[1].trim());

    // 2. Check for PREFIX: or PREFIX -
    const prefixMatch = rawName.match(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*[:\-]\s+/);
    if (prefixMatch) {
        const p = prefixMatch[1].trim();
        if (p.length > 0 && p.length <= 25) {
            return decodeHtmlEntities(p);
        }
    }

    // 3. Fallback to first word
    const firstWord = rawName.split(/\s+/)[0] || 'Other';
    return decodeHtmlEntities(firstWord.replace(/[:\-.,_]+$/, '') || 'Other');
}

export function groupItemsBySubTag(items = []) {
    const map = new Map();
    for (const it of items) {
        const tag = getItemTag(it);
        if (!map.has(tag)) {
            map.set(tag, []);
        }
        map.get(tag).push(it);
    }
    return Array.from(map.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([tag, subItems]) => ({
            tag,
            count: subItems.length,
            items: subItems
        }));
}

export function getGroupSubTags(items = []) {
    const counts = {};
    items.forEach(it => {
        const tag = getItemTag(it);
        if (tag) {
            counts[tag] = (counts[tag] || 0) + 1;
        }
    });

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count }));
}

export function groupMaterialsByLetter(sortedFiles = []) {
    const map = new Map();
    for (const item of sortedFiles) {
        const letter = getLetterKey(item.file_name);
        if (!map.has(letter)) {
            map.set(letter, []);
        }
        map.get(letter).push(item);
    }
    return Array.from(map.entries())
        .sort(([letterA], [letterB]) => compareLetterKeys(letterA, letterB))
        .map(([letter, items]) => {
            const subGroups = groupItemsBySubTag(items);
            return {
                letter,
                items,
                subGroups,
                subTags: subGroups.map(sg => ({ tag: sg.tag, count: sg.count }))
            };
        });
}
