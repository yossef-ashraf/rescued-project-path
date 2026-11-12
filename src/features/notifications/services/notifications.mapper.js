

export function formatRelativeTime(dateValue) {
    if (!dateValue) return '';
    try {
        const date = new Date(dateValue);
        const diffMs = Date.now() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export function mapNotificationItem(raw) {
    if (!raw || typeof raw !== 'object') {
        return {
            id: '',
            title: '',
            message: '',
            type: 'info',
            link: '/tasks/todo',
            isRead: true,
            createdAt: null,
            relativeTime: ''
        };
    }

    const isRead = raw.is_read === 1 || raw.is_read === true || raw.isRead === true;

    return {
        id: String(raw.id ?? ''),
        title: String(raw.title || ''),
        message: String(raw.message || raw.body || ''),
        type: String(raw.type || 'info'),
        link: String(raw.link || raw.url || '/tasks/todo'),
        isRead: Boolean(isRead),
        createdAt: raw.created_at || raw.createdAt || null,
        relativeTime: formatRelativeTime(raw.created_at || raw.createdAt)
    };
}

export function mapNotificationList(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList.map(mapNotificationItem);
}
