// Next.js navigation hooks implemented on TanStack Router, so the original components work unchanged.
import { useMemo } from 'react';
import { useRouter as useTanRouter, useLocation, useParams as useTanParams } from '@tanstack/react-router';

export function useRouter() {
    const router = useTanRouter();
    return useMemo(() => ({
        push: (href, opts) => router.navigate({ href: String(href), resetScroll: opts?.scroll !== false }),
        replace: (href, opts) => router.navigate({ href: String(href), replace: true, resetScroll: opts?.scroll !== false }),
        back: () => router.history.back(),
        forward: () => router.history.forward(),
        refresh: () => router.invalidate(),
        prefetch: () => Promise.resolve(),
    }), [router]);
}

export function usePathname() {
    return useLocation({ select: (l) => l.pathname });
}

export function useSearchParams() {
    const searchStr = useLocation({ select: (l) => l.searchStr || '' });
    return useMemo(() => new URLSearchParams(searchStr), [searchStr]);
}

export function useParams() {
    const params = useTanParams({ strict: false }) || {};
    return useMemo(() => {
        const out = { ...params };
        if (out._splat !== undefined) {
            out.slug = String(out._splat).split('/').filter(Boolean);
            delete out._splat;
        }
        return out;
    }, [params]);
}

// Next's redirect() aborts rendering; here the page suspends while the browser moves to the new address.
const pendingRedirect = new Promise(() => {});
export function redirect(href) {
    if (typeof window !== 'undefined') window.location.replace(href);
    throw pendingRedirect;
}

export const permanentRedirect = redirect;

export function notFound() {
    const err = new Error('NEXT_NOT_FOUND');
    err.digest = 'NEXT_NOT_FOUND';
    throw err;
}

export function useSelectedLayoutSegment() { return null; }
export function useSelectedLayoutSegments() { return []; }
