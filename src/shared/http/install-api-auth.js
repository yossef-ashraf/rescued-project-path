// Attaches the signed-in user's Lovable Cloud session to every same-origin /api request
// (apiClient calls and the few direct fetch('/api/...') calls in the original components).
import { supabase } from '@/integrations/supabase/client';

let installed = false;

function isPrivateApiUrl(input) {
    try {
        const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
        if (!raw) return false;
        const url = new URL(raw, window.location.origin);
        return url.origin === window.location.origin && url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/public/');
    } catch {
        return false;
    }
}

export function installApiAuth() {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
        if (!isPrivateApiUrl(input)) return originalFetch(input, init);
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has('authorization')) {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            if (token) headers.set('authorization', `Bearer ${token}`);
        }
        return originalFetch(input, { ...init, headers });
    };
}

installApiAuth();
