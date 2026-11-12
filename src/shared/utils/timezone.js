export function getEgyptDateStr(dateObj = new Date()) {
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Africa/Cairo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(dateObj);
    } catch {
        return dateObj.toISOString().split('T')[0];
    }
}

export function getEgyptTimeStr(dateObj = new Date()) {
    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Africa/Cairo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(dateObj);
    } catch {
        const h = String(dateObj.getHours()).padStart(2, '0');
        const m = String(dateObj.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }
}

export function getEgyptFormattedTime(dateObj = new Date()) {
    try {
        return new Intl.DateTimeFormat('ar-EG', {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(dateObj);
    } catch {
        return getEgyptTimeStr(dateObj);
    }
}

export function getEgyptNowMins(dateObj = new Date()) {
    const [h, m] = getEgyptTimeStr(dateObj).split(':');
    return parseInt(h || 0) * 60 + parseInt(m || 0);
}
