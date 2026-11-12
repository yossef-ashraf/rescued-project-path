export class ApiError extends Error {
    constructor(message, status = 500, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

let activeMutationsCount = 0;
let lastClickedButton = null;
let lastClickedTimestamp = 0;

if (typeof window !== 'undefined') {
    const captureButtonInteraction = (event) => {
        const target = event?.target;
        if (target && typeof target.closest === 'function') {
            const btn = target.closest('button, [role="button"]');
            if (btn) {
                lastClickedButton = btn;
                lastClickedTimestamp = Date.now();
            }
        }
    };
    window.addEventListener('pointerdown', captureButtonInteraction, true);
    window.addEventListener('click', captureButtonInteraction, true);
}

function resolveTriggerButton() {
    if (typeof document === 'undefined') return null;
    if (
        lastClickedButton &&
        Date.now() - lastClickedTimestamp < 650 &&
        document.contains(lastClickedButton)
    ) {
        return lastClickedButton;
    }
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'BUTTON' || activeEl.getAttribute('role') === 'button')) {
        return activeEl;
    }
    if (activeEl && typeof activeEl.closest === 'function') {
        const closestBtn = activeEl.closest('button, [role="button"]');
        if (closestBtn) return closestBtn;
        const parentForm = activeEl.closest('form');
        if (parentForm) {
            return parentForm.querySelector('button[type="submit"], button:not([type="button"])');
        }
    }
    return null;
}

function notifyMutationActivity(delta, meta = {}) {
    if (typeof window === 'undefined') return;
    activeMutationsCount = Math.max(0, activeMutationsCount + delta);
    window.dispatchEvent(
        new CustomEvent('codex:api-activity', {
            detail: {
                activeCount: activeMutationsCount,
                busy: activeMutationsCount > 0,
                ...meta
            }
        })
    );
}

export async function apiClient(url, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const isObject = typeof options.body === 'object' && options.body !== null && !isFormData;

    const defaultHeaders = isFormData
        ? {}
        : { 'Content-Type': 'application/json' };

    const body = isObject ? JSON.stringify(options.body) : options.body;
    const method = String(options.method || 'GET').toUpperCase();
    const urlStr = typeof url === 'string' ? url : '';
    const isBackgroundPoll =
        urlStr.includes('/api/auth/me') ||
        urlStr.includes('/api/notifications');
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !isBackgroundPoll;
    const candidateBtn = isMutation ? resolveTriggerButton() : null;
    const isTrackedAction = isMutation;

    let triggerBtn = null;
    if (isTrackedAction && typeof document !== 'undefined') {
        triggerBtn = candidateBtn;
        if (triggerBtn) {
            triggerBtn.setAttribute('data-action-busy', 'true');
            triggerBtn.setAttribute('aria-busy', 'true');
        }
        notifyMutationActivity(1, { method, url: urlStr });
    }

    try {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            body,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status === 401 && typeof window !== 'undefined') {
                const isLoginAttempt = (
                    urlStr.includes('/api/auth/login') ||
                    urlStr.includes('/api/auth/send-otp')
                );
                if (!isLoginAttempt && !window.location.pathname.startsWith('/login')) {
                    const current = window.location.pathname + window.location.search;
                    const redirectTarget = current && current !== '/'
                        ? `/login?redirect=${encodeURIComponent(current)}`
                        : '/login';
                    window.location.href = redirectTarget;
                }
            }
            const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
            throw new ApiError(errorMsg, response.status, data?.details);
        }

        if (data && typeof data === 'object') {
            if (data.ok === undefined) {
                Object.defineProperty(data, 'ok', {
                    value: true,
                    enumerable: false,
                    configurable: true,
                    writable: true
                });
            }
            if (typeof data.json !== 'function') {
                Object.defineProperty(data, 'json', {
                    value: async () => data,
                    enumerable: false,
                    configurable: true,
                    writable: true
                });
            }
        }

        return data;
    } finally {
        if (isTrackedAction) {
            if (triggerBtn) {
                triggerBtn.removeAttribute('data-action-busy');
                triggerBtn.removeAttribute('aria-busy');
            }
            notifyMutationActivity(-1, { method, url: urlStr });
        }
    }
}

apiClient.get = (url, options = {}) => apiClient(url, { ...options, method: 'GET' });
apiClient.post = (url, body, options = {}) => apiClient(url, { ...options, method: 'POST', body });
apiClient.put = (url, body, options = {}) => apiClient(url, { ...options, method: 'PUT', body });
apiClient.patch = (url, body, options = {}) => apiClient(url, { ...options, method: 'PATCH', body });
apiClient.delete = (url, options = {}) => apiClient(url, { ...options, method: 'DELETE' });

export function toResponseEnvelope(promise) {
    return promise
        .then(data => ({
            ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : { data }),
            ok: true,
            status: 200,
            json: async () => data
        }))
        .catch(err => ({
            ok: false,
            status: err.status || 500,
            json: async () => ({ error: err.message, details: err.details }),
            error: err.message
        }));
}

export default apiClient;
