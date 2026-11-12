const SECTION_BOUNDARY_LOOKAHEAD = '(?=\\n\\s*\\[(?:Features|Required Features|Timeline|Target Launch Timeline|Notes|Client Brief)\\]:|$)';

export function parseNotesContent(notesRaw) {
    if (!notesRaw) return { features: [], timeline: '', pureNotes: '' };

    if (typeof notesRaw === 'object') {
        return {
            features: Array.isArray(notesRaw.features) ? notesRaw.features.map(String).filter(Boolean) : [],
            timeline: typeof notesRaw.timeline === 'string' ? notesRaw.timeline.trim() : '',
            pureNotes: typeof (notesRaw.pureNotes ?? notesRaw.notes) === 'string' ? (notesRaw.pureNotes ?? notesRaw.notes).trim() : ''
        };
    }

    const rawStr = String(notesRaw);
    const trimmed = rawStr.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
                return {
                    features: Array.isArray(parsed.features) ? parsed.features.map(String).filter(Boolean) : [],
                    timeline: typeof parsed.timeline === 'string' ? parsed.timeline.trim() : '',
                    pureNotes: typeof (parsed.pureNotes ?? parsed.notes) === 'string' ? (parsed.pureNotes ?? parsed.notes).trim() : ''
                };
            }
        } catch {
            // Fall through to structured tag parsing
        }
    }

    let features = [];
    let timeline = '';
    let pureNotes = '';

    const featRegex = new RegExp(`\\[(?:Features|Required Features)\\]:([\\s\\S]*?)${SECTION_BOUNDARY_LOOKAHEAD}`, 'i');
    const featMatch = rawStr.match(featRegex);
    if (featMatch) {
        features = featMatch[1]
            .split('\n')
            .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
            .filter(Boolean);
    }

    const timeMatch = rawStr.match(/\[(?:Timeline|Target Launch Timeline)\]:\s*([^\n]+)/i);
    if (timeMatch) {
        timeline = timeMatch[1].trim();
    }

    const notesRegex = new RegExp(`\\[(?:Notes|Client Brief)\\]:([\\s\\S]*?)${SECTION_BOUNDARY_LOOKAHEAD}`, 'i');
    const notesMatch = rawStr.match(notesRegex);
    if (notesMatch) {
        pureNotes = notesMatch[1].trim();
    } else if (!featMatch && !timeMatch) {
        pureNotes = trimmed;
    }

    return { features, timeline, pureNotes };
}

export function assembleNotes(features = [], timeline = '', pureNotes = '', fallbackNotes = '') {
    const safeFeatures = Array.isArray(features)
        ? features.map(f => String(f || '').trim()).filter(Boolean)
        : [];
    const safeTimeline = String(timeline || '').trim();
    const safePureNotes = String(pureNotes || '').trim();

    const parts = [
        safeFeatures.length > 0 ? `[Features]:\n${safeFeatures.map(f => `• ${f}`).join('\n')}` : '',
        safeTimeline ? `[Timeline]: ${safeTimeline}` : '',
        safePureNotes ? `[Notes]: ${safePureNotes}` : ''
    ].filter(Boolean);

    return parts.length > 0 ? parts.join('\n\n') : String(fallbackNotes || '').trim();
}

export function getLeadWhatsAppUrl(l) {
    if (!l?.phone) return null;
    const cleanPhone = l.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return null;
    const msg = `Hi ${l.name}, this is User regarding your project inquiry for "${l.project_type || 'Platform Architecture'}".`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

export function getLeadStatusStyle(status) {
    switch (status) {
        case 'won':
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
        case 'lost':
            return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
        case 'negotiation':
            return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
        case 'proposal':
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
        case 'contacted':
            return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
        case 'new':
            return 'bg-[#BC5C29]/10 text-[#BC5C29] border-[#BC5C29]/30';
        default:
            return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
    }
}

export function filterLeads(leads = [], searchQuery = '', statusFilter = 'all') {
    const q = (searchQuery || '').toLowerCase();
    return leads.filter(l => {
        const matchesSearch = !q || (
            (l.name && l.name.toLowerCase().includes(q)) ||
            (l.company && l.company.toLowerCase().includes(q)) ||
            (l.project_type && l.project_type.toLowerCase().includes(q))
        );
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
}
