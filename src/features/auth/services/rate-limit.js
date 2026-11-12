const rateLimitMap = new Map();

let lastPrune = 0;
// Hosted server code may not start timers at load time, so stale entries are pruned during calls.
function pruneStale(now) {
    if (now - lastPrune < 300000) return;
    lastPrune = now;
    for (const [key, timestamps] of rateLimitMap.entries()) {
        const valid = timestamps.filter(t => t > now - 900000);
        if (valid.length === 0) rateLimitMap.delete(key);
        else rateLimitMap.set(key, valid);
    }
}

export function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    pruneStale(now);
    const windowStart = now - windowMs;

    const existing = rateLimitMap.get(key) || [];
    const valid = existing.filter(t => t > windowStart);

    if (valid.length >= maxRequests) {
        return false;
    }

    valid.push(now);
    rateLimitMap.set(key, valid);
    return true;
}

export function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const forwarded = req.headers?.get?.('x-forwarded-for') || req.headers?.['x-forwarded-for'];
    if (forwarded) {
        return String(forwarded).split(',')[0].trim();
    }
    const realIp = req.headers?.get?.('x-real-ip') || req.headers?.['x-real-ip'];
    if (realIp) return String(realIp).trim();
    const cfIp = req.headers?.get?.('cf-connecting-ip') || req.headers?.['cf-connecting-ip'];
    if (cfIp) return String(cfIp).trim();
    return '127.0.0.1';
}
