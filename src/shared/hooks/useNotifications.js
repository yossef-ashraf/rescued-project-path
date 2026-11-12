'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { mapNotificationList } from '@/features/notifications/services/notifications.mapper';
import {
    fetchNotificationsApi,
    markNotificationAsReadApi,
    markAllNotificationsAsReadApi
} from '@/features/notifications/services/notifications.api';

const NOTIFIED_STORAGE_KEY = 'codex_notified_notification_ids';
const MAX_STORED_IDS = 100;
const FRESHNESS_THRESHOLD_MS = 5 * 60 * 1000;

const POLL_INTERVAL_MS = 5 * 60 * 1000;

const CLIENT_DEDUP_MS = 4 * 60 * 1000;

function getNotifiedIds() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function markIdAsNotified(id) {
    if (typeof window === 'undefined' || !id) return;
    try {
        const ids = getNotifiedIds();
        const strId = String(id);
        if (!ids.includes(strId)) {
            const updated = [strId, ...ids].slice(0, MAX_STORED_IDS);
            localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(updated));
        }
    } catch { }
}

function markMultipleIdsAsNotified(ids) {
    if (typeof window === 'undefined' || !Array.isArray(ids)) return;
    try {
        const current = getNotifiedIds();
        const combined = Array.from(new Set([...ids.map(String), ...current])).slice(0, MAX_STORED_IDS);
        localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(combined));
    } catch { }
}

export const triggerNativeNotification = async (title, body, url = '/tasks/todo', notifId = null) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const tag = notifId ? `codex-notif-${notifId}` : 'codex-notification';
    const options = {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag,
        renotify: false,
        vibrate: [200, 100, 200],
        data: { url }
    };

    try {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
                await reg.showNotification(title, options);
                return;
            }
        }
    } catch (err) {
        console.warn('SW showNotification fallback:', err);
    }

    try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
            window.focus();
            window.location.href = url;
            notif.close();
        };
    } catch (e) {
        console.error('Notification error:', e);
    }
};

const SERVER_NOTIFICATIONS_STATE = Object.freeze({
    rawNotifications: [],
    unreadCount: 0,
    lastFetchedAt: 0,
    isInitialLoadComplete: false,
    status: 'idle'
});

let sharedState = { ...SERVER_NOTIFICATIONS_STATE };

const subscribers = new Set();
let globalPollInterval = null;
let isFetchingPromise = null;
let visibilityListenerAttached = false;

function subscribeNotifications(callback) {
    subscribers.add(callback);
    return () => {
        subscribers.delete(callback);
        if (subscribers.size === 0 && globalPollInterval) {
            clearInterval(globalPollInterval);
            globalPollInterval = null;
        }
    };
}

function getNotificationsSnapshot() {
    return sharedState;
}

function getServerNotificationsSnapshot() {
    return SERVER_NOTIFICATIONS_STATE;
}

function ensureVisibilityListener() {
    if (visibilityListenerAttached || typeof document === 'undefined') return;
    visibilityListenerAttached = true;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            void fetchGlobalNotifications();
        }
    });
}

function publishSharedState(nextState) {
    sharedState = nextState;
    subscribers.forEach(callback => {
        try {
            callback();
        } catch { }
    });
}

async function fetchGlobalNotifications(force = false) {
    const now = Date.now();
    if (!force && (now - sharedState.lastFetchedAt) < CLIENT_DEDUP_MS && sharedState.lastFetchedAt > 0) {
        return sharedState;
    }

    if (isFetchingPromise) {
        return isFetchingPromise;
    }

    isFetchingPromise = (async () => {
        try {
            publishSharedState({ ...sharedState, status: 'loading' });
            const data = await fetchNotificationsApi();
            if (data && !data.error) {
                const list = Array.isArray(data.notifications) ? data.notifications : [];
                const newUnreadCount = data.unreadCount || 0;

                const isInitial = !sharedState.isInitialLoadComplete;

                if (isInitial) {
                    const existingIds = list.map(n => n.id).filter(Boolean);
                    markMultipleIdsAsNotified(existingIds);
                    sharedState.isInitialLoadComplete = true;
                } else {
                    const notifiedIds = getNotifiedIds();
                    const unreadFreshItems = list.filter(n => {
                        const isUnread = n.is_read === 0 || !n.is_read;
                        const notYetNotified = !notifiedIds.includes(String(n.id));
                        return isUnread && notYetNotified;
                    });

                    if (unreadFreshItems.length > 0) {
                        const newest = unreadFreshItems[0];
                        const notifTime = newest.created_at ? new Date(newest.created_at).getTime() : Date.now();
                        const isFresh = (Date.now() - notifTime) < FRESHNESS_THRESHOLD_MS;

                        if (isFresh) {
                            markIdAsNotified(newest.id);
                            triggerNativeNotification(newest.title, newest.message, newest.link || '/tasks/todo', newest.id);
                        } else {
                            markIdAsNotified(newest.id);
                        }
                    }
                }

                publishSharedState({
                    ...sharedState,
                    rawNotifications: list,
                    unreadCount: newUnreadCount,
                    lastFetchedAt: Date.now(),
                    status: 'success'
                });
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
            publishSharedState({ ...sharedState, status: 'error' });
        } finally {
            isFetchingPromise = null;
        }
        return sharedState;
    })();

    return isFetchingPromise;
}

export function useNotifications({ limit = null } = {}) {
    const state = useSyncExternalStore(
        subscribeNotifications,
        getNotificationsSnapshot,
        getServerNotificationsSnapshot
    );

    useEffect(() => {
        ensureVisibilityListener();
        void fetchGlobalNotifications();

        if (!globalPollInterval) {
            globalPollInterval = setInterval(() => {
                if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
                void fetchGlobalNotifications();
            }, POLL_INTERVAL_MS);
        }
    }, []);

    const notifications = useMemo(() => {
        const mapped = mapNotificationList(state.rawNotifications);
        if (typeof limit === 'number' && limit > 0) {
            return mapped.slice(0, limit);
        }
        return mapped;
    }, [state.rawNotifications, limit]);

    const refresh = useCallback((force = true) => {
        return fetchGlobalNotifications(force);
    }, []);

    const markAsRead = useCallback(async (id) => {
        try {
            await markNotificationAsReadApi(id);
            publishSharedState({
                ...sharedState,
                unreadCount: Math.max(0, sharedState.unreadCount - 1),
                rawNotifications: sharedState.rawNotifications.map(n =>
                    String(n.id) === String(id) ? { ...n, is_read: 1 } : n
                )
            });
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await markAllNotificationsAsReadApi();
            publishSharedState({
                ...sharedState,
                unreadCount: 0,
                rawNotifications: sharedState.rawNotifications.map(n => ({ ...n, is_read: 1 }))
            });
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    }, []);

    return {
        notifications,
        rawNotifications: state.rawNotifications,
        unreadCount: state.unreadCount,
        status: state.status,
        refresh,
        markAsRead,
        markAllAsRead
    };
}

let isDrawerOpenGlobal = false;
const drawerSubscribers = new Set();

function subscribeDrawer(callback) {
    drawerSubscribers.add(callback);
    return () => {
        drawerSubscribers.delete(callback);
    };
}

function getDrawerSnapshot() {
    return isDrawerOpenGlobal;
}

function getServerDrawerSnapshot() {
    return false;
}

export function setNotificationDrawerOpen(val) {
    const nextVal = typeof val === 'function' ? val(isDrawerOpenGlobal) : Boolean(val);
    isDrawerOpenGlobal = nextVal;
    drawerSubscribers.forEach(cb => {
        try { cb(); } catch { }
    });
}

export function useNotificationDrawer() {
    const isOpen = useSyncExternalStore(
        subscribeDrawer,
        getDrawerSnapshot,
        getServerDrawerSnapshot
    );

    const toggleDrawer = useCallback(() => {
        setNotificationDrawerOpen(!isDrawerOpenGlobal);
    }, []);

    const openDrawer = useCallback(() => {
        setNotificationDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setNotificationDrawerOpen(false);
    }, []);

    return {
        isOpen,
        setIsOpen: setNotificationDrawerOpen,
        toggleDrawer,
        openDrawer,
        closeDrawer
    };
}

