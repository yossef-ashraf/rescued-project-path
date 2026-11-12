'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { THEME, DASHBOARD, DRIVE_SYNC_STAGE } from '../constants/index.js';
import enMessages from '../locales/en.json';
import arMessages from '../locales/ar.json';

const dictionaries = {
    en: enMessages,
    ar: arMessages,
};

function getNestedTranslation(obj, path) {
    if (!obj || !path) return undefined;
    if (typeof obj[path] === 'string') return obj[path];
    const parts = String(path).split('.');
    let cur = obj;
    for (const part of parts) {
        if (cur && typeof cur === 'object' && part in cur) {
            cur = cur[part];
        } else {
            return undefined;
        }
    }
    return typeof cur === 'string' ? cur : undefined;
}

const AppContext = createContext();

function subscribeTheme(callback) {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('storage', callback);
    window.addEventListener('codex_theme_change', callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener('codex_theme_change', callback);
    };
}

function getThemeSnapshot() {
    try {
        const mdSaved = localStorage.getItem('md-theme');
        if (mdSaved === THEME.LIGHT || mdSaved === THEME.DARK) {
            return mdSaved;
        }
        const saved = localStorage.getItem('codex_theme');
        if (saved === THEME.LIGHT || saved === THEME.DARK) {
            return saved;
        }
    } catch (_) {}
    return THEME.DARK;
}

function getServerThemeSnapshot() {
    return THEME.DARK;
}

function applyThemeToDocument(themeValue) {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    const isLight = themeValue === THEME.LIGHT || themeValue === 'light' || themeValue === 'mode-light';
    root.classList.remove('dark', 'mode-light', 'mode-plus', 'light', 'mode-plus-plus');
    root.classList.toggle('dark', !isLight);
    if (isLight) {
        root.classList.add('mode-light');
    }
    root.dataset.theme = isLight ? 'light' : 'dark';
    root.dataset.scheme = isLight ? 'light' : 'dark';
}

export function AppProvider({ children }) {
    const storedTheme = React.useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
    const [overrideTheme, setOverrideTheme] = useState(null);
    const theme = overrideTheme ?? storedTheme;

    const setTheme = useCallback((newTheme) => {
        setOverrideTheme(newTheme);
        try {
            localStorage.setItem('md-theme', newTheme);
            localStorage.setItem('codex_theme', newTheme);
            if (typeof window !== 'undefined') {
                applyThemeToDocument(newTheme);
                window.dispatchEvent(new Event('codex_theme_change'));
            }
        } catch (_) {}
    }, []);

    const [lang, setLang] = useState('en');
    const [activeDashboard, setActiveDashboard] = useState(DASHBOARD.MONEY);

    const [driveSync, setDriveSync] = useState({
        active: false,
        stage: DRIVE_SYNC_STAGE.IDLE,
        filename: '',
        message: '',
        progress: 0
    });

    useEffect(() => {
        applyThemeToDocument(theme);
    }, [theme]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const root = window.document.documentElement;
        root.dir = lang === 'ar' ? 'rtl' : 'ltr';
        root.lang = lang;
    }, [lang]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => {
                    console.log('ME PWA ServiceWorker registered successfully.');
                })
                .catch(err => {
                    console.warn('ME ServiceWorker registration failed:', err);
                });
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
        setTheme(nextTheme);
    };
    const toggleLang = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

    const t = useCallback((keyOrEn, fallbackAr, params) => {
        const dict = dictionaries[lang] || dictionaries.en;
        
        // 1. Direct or nested key lookup in current language dictionary
        const found = getNestedTranslation(dict, keyOrEn);
        if (typeof found === 'string') {
            let res = found;
            if (params && typeof params === 'object') {
                Object.keys(params).forEach(k => {
                    res = res.replace(new RegExp(`{${k}}`, 'g'), String(params[k]));
                });
            }
            return res;
        }

        // 2. Fallback key lookup in English dictionary when in EN
        if (lang === 'en') {
            const foundEn = getNestedTranslation(dictionaries.en, keyOrEn);
            if (typeof foundEn === 'string') {
                let res = foundEn;
                if (params && typeof params === 'object') {
                    Object.keys(params).forEach(k => {
                        res = res.replace(new RegExp(`{${k}}`, 'g'), String(params[k]));
                    });
                }
                return res;
            }
        }

        // 3. Backward-compatible fallback for dual literal strings: t("English", "العربية")
        if (lang === 'ar') {
            return fallbackAr || keyOrEn;
        }
        return keyOrEn;
    }, [lang]);

    const startDriveSync = useCallback((filename = '', customMsg = '') => {
        setDriveSync({
            active: true,
            stage: DRIVE_SYNC_STAGE.UPLOADING,
            filename,
            message: customMsg,
            progress: 30
        });
    }, []);

    const updateDriveSync = useCallback((updates) => {
        setDriveSync(prev => ({ ...prev, ...updates }));
    }, []);

    const finishDriveSync = useCallback((successMsg = '') => {
        setDriveSync(prev => ({
            ...prev,
            active: true,
            stage: DRIVE_SYNC_STAGE.COMPLETED,
            progress: 100,
            message: successMsg
        }));
        setTimeout(() => {
            setDriveSync({
                active: false,
                stage: DRIVE_SYNC_STAGE.IDLE,
                filename: '',
                message: '',
                progress: 0
            });
        }, 4000);
    }, []);

    const failDriveSync = useCallback((errorMsg = '') => {
        setDriveSync(prev => ({
            ...prev,
            active: true,
            stage: DRIVE_SYNC_STAGE.ERROR,
            progress: 100,
            message: errorMsg
        }));
        setTimeout(() => {
            setDriveSync({
                active: false,
                stage: DRIVE_SYNC_STAGE.IDLE,
                filename: '',
                message: '',
                progress: 0
            });
        }, 5000);
    }, []);

    useEffect(() => {
        const handleStart = (e) => {
            const { filename, message } = e.detail || {};
            startDriveSync(filename, message);
        };
        const handleFinish = (e) => {
            const { message } = e.detail || {};
            finishDriveSync(message);
        };
        const handleFail = (e) => {
            const { message } = e.detail || {};
            failDriveSync(message);
        };

        window.addEventListener('drive-sync-start', handleStart);
        window.addEventListener('drive-sync-finish', handleFinish);
        window.addEventListener('drive-sync-fail', handleFail);

        return () => {
            window.removeEventListener('drive-sync-start', handleStart);
            window.removeEventListener('drive-sync-finish', handleFinish);
            window.removeEventListener('drive-sync-fail', handleFail);
        };
    }, [startDriveSync, finishDriveSync, failDriveSync]);

    return (
        <AppContext.Provider value={{
            theme, setTheme, toggleTheme,
            lang, setLang, toggleLang, t,
            activeDashboard, setActiveDashboard,
            driveSync, startDriveSync, updateDriveSync, finishDriveSync, failDriveSync
        }}>
            <div
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className={`min-h-screen ${
                    theme === THEME.LIGHT || theme === 'light' || theme === 'mode-light'
                        ? 'mode-light'
                        : 'dark'
                }`}
                suppressHydrationWarning
            >
                {children}
            </div>
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
