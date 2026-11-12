'use client';

import { apiClient } from '@/shared/http/apiClient.js';

const AUTH_CACHE_TTL_MS = 30 * 1000;
let _authCache = null;
let _authCacheTime = 0;
let _authFetchPromise = null;

export function getAuthSession() {
    if (_authCache && _authCache.authenticated && Date.now() - _authCacheTime < AUTH_CACHE_TTL_MS) {
        return Promise.resolve(_authCache);
    }
    if (_authFetchPromise) return _authFetchPromise;
    _authFetchPromise = apiClient('/api/auth/me')
        .then((data) => {
            if (data?.authenticated && data?.user) {
                _authCache = data;
                _authCacheTime = Date.now();
            } else {
                _authCache = null;
                _authCacheTime = 0;
            }
            return data || { authenticated: false, user: null };
        })
        .catch(() => {
            _authCache = null;
            _authCacheTime = 0;
            return { authenticated: false, user: null };
        })
        .finally(() => {
            _authFetchPromise = null;
        });
    return _authFetchPromise;
}

export function invalidateAuthCache() {
    _authCache = null;
    _authCacheTime = 0;
}
