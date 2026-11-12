export function getSafeRedirect(redirectParam) {
    if (!redirectParam || typeof redirectParam !== 'string') return '/';
    if (redirectParam === '/login' || redirectParam === '/features/auth/pages/login') return '/';
    if (redirectParam.startsWith('/') && !redirectParam.startsWith('//') && !redirectParam.includes('\\')) {
        return redirectParam;
    }
    return '/';
}
