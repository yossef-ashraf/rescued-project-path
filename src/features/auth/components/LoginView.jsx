'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/shared/next-compat/image';
import { PortalFieldCollection } from '@/components/shared/threeui/NeuformBatchEffects';
import '@/components/shared/threeui/threeui.css';
import { useRouter, useSearchParams } from '@/shared/next-compat/navigation';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound, Hourglass, LogOut } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { getSafeRedirect } from '@/shared/utils/auth.logic.js';
import { checkAuthSession } from '@/shared/api/auth.api.js';
import { apiClient } from '@/shared/http/apiClient.js';
import { invalidateAuthCache } from '@/features/auth/services/sessionCache.js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

const inputClass = 'w-full px-4 py-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none transition';
const primaryBtn = 'w-full py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryBtn = 'w-full py-3.5 px-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-900 dark:text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50';

export default function LoginView() {
    const { t, theme } = useApp();
    const isLight = theme === 'light' || theme === 'mode-light';
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = getSafeRedirect(searchParams?.get('redirect'));

    // signin | signup (first visit / new account) | forgot | pending | sent
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    const routeAfterSession = async () => {
        invalidateAuthCache();
        const data = await checkAuthSession();
        if (data?.authenticated) {
            router.replace(redirectUrl);
            return true;
        }
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
            setPendingEmail(sessionData.session.user?.email || '');
            setMode('pending');
        }
        return false;
    };

    useEffect(() => {
        let cancelled = false;
        supabase.auth.getSession().then(({ data }) => {
            if (!cancelled && data?.session) routeAfterSession();
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reset = (next) => { setError(''); setNotice(''); setMode(next); };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (err) {
                setError(/confirm/i.test(err.message)
                    ? t('Please confirm your email first — check your inbox for the verification link.', 'يرجى تأكيد بريدك الإلكتروني أولاً — راجع رسالة التحقق في بريدك.')
                    : t('Incorrect email or password. First time on the new system? Use “Set up my account”.', 'البريد أو كلمة المرور غير صحيحة. أول مرة على النظام الجديد؟ استخدم «إعداد حسابي».'));
                return;
            }
            apiClient.post('/api/auth/session-event', { event: 'LOGIN_SUCCESS', method: 'password' }).catch(() => {});
            await routeAfterSession();
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            if (password.length < 8) {
                setError(t('Choose a password with at least 8 characters.', 'اختر كلمة مرور من 8 أحرف على الأقل.'));
                return;
            }
            const { data, error: err } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: { emailRedirectTo: `${window.location.origin}/login`, data: name.trim() ? { name: name.trim() } : undefined },
            });
            if (err) { setError(err.message); return; }
            if (data?.session) { await routeAfterSession(); return; }
            setNotice(t('We sent a verification link to your email. Open it to activate your account, then sign in with your new password.',
                'أرسلنا رابط تحقق إلى بريدك. افتحه لتفعيل حسابك ثم سجّل الدخول بكلمة المرور الجديدة.'));
            setMode('sent');
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
            if (err) { setError(err.message); return; }
            setNotice(t('If an account exists for this email, a reset link is on its way.', 'إذا كان هناك حساب بهذا البريد فسيصلك رابط إعادة التعيين.'));
            setMode('sent');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/login` });
        if (result?.error) { setError(result.error.message || String(result.error)); return; }
        if (result?.redirected) return;
        await routeAfterSession();
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        invalidateAuthCache();
        reset('signin');
    };

    const titles = {
        signin: [t('Welcome', 'مرحباً بك'), t('Sign in with your email and password', 'سجّل دخولك بالبريد الإلكتروني وكلمة المرور')],
        signup: [t('Set up your account', 'إعداد حسابك'), t('Existing members: use your usual email and choose a new password. We will verify your email first.', 'الأعضاء الحاليون: استخدم بريدك المعتاد واختر كلمة مرور جديدة. سنتحقق من بريدك أولاً.')],
        forgot: [t('Reset password', 'إعادة تعيين كلمة المرور'), t('We will email you a link to choose a new password.', 'سنرسل لك رابطاً لاختيار كلمة مرور جديدة.')],
        sent: [t('Check your email', 'تحقق من بريدك'), ''],
        pending: [t('Almost there', 'اقتربنا'), ''],
    };

    return (
        <div className={`min-h-screen w-full ${isLight ? 'bg-white text-zinc-900' : 'bg-zinc-950 text-zinc-100'} grid grid-cols-1 lg:grid-cols-2 p-4 sm:p-6 lg:p-8 gap-6 items-center font-sans transition-colors duration-300`}>
            <div className="w-full max-w-md mx-auto px-2 sm:px-6 space-y-6">
                <div className="space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white">{titles[mode][0]}</h1>
                    {titles[mode][1] && <p className="text-sm text-zinc-500 dark:text-zinc-400">{titles[mode][1]}</p>}
                </div>

                {error && (
                    <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-200 flex items-center gap-2.5 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                        <span className="leading-snug font-medium">{error}</span>
                    </div>
                )}
                {notice && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-200 flex items-center gap-2.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
                        <span className="leading-snug font-medium">{notice}</span>
                    </div>
                )}

                {mode === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('Email address', 'البريد الإلكتروني')}</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" className={inputClass} placeholder="name@example.com" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('Password', 'كلمة المرور')}</label>
                                <button type="button" onClick={() => reset('forgot')} className="text-xs font-medium text-[#BC5C29] hover:underline cursor-pointer">{t('Forgot password?', 'نسيت كلمة المرور؟')}</button>
                            </div>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={inputClass} />
                        </div>
                        <button type="submit" disabled={loading} className={primaryBtn}>
                            {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><span>{t('Sign In', 'تسجيل الدخول')}</span><ArrowRight className="w-4 h-4 rtl:rotate-180" /></>}
                        </button>
                        <button type="button" onClick={handleGoogle} className={secondaryBtn}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>
                            <span>{t('Continue with Google', 'المتابعة باستخدام Google')}</span>
                        </button>
                        <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                            {t('First time on the new system?', 'أول مرة على النظام الجديد؟')}{' '}
                            <button type="button" onClick={() => reset('signup')} className="font-semibold text-[#BC5C29] hover:underline cursor-pointer">{t('Set up my account', 'إعداد حسابي')}</button>
                        </div>
                    </form>
                )}

                {mode === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('Your name (new members)', 'اسمك (للأعضاء الجدد)')}</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('Email address', 'البريد الإلكتروني')}</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" className={inputClass} placeholder="name@example.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('Choose a new password', 'اختر كلمة مرور جديدة')}</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} />
                        </div>
                        <button type="submit" disabled={loading} className={primaryBtn}>
                            {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><KeyRound className="w-4 h-4" /><span>{t('Verify email & set password', 'تحقق من البريد واضبط كلمة المرور')}</span></>}
                        </button>
                        <button type="button" onClick={() => reset('signin')} className="w-full text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer">{t('Back to sign in', 'العودة لتسجيل الدخول')}</button>
                    </form>
                )}

                {mode === 'forgot' && (
                    <form onSubmit={handleForgot} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('Email address', 'البريد الإلكتروني')}</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" className={inputClass} />
                        </div>
                        <button type="submit" disabled={loading} className={primaryBtn}>
                            {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><Mail className="w-4 h-4" /><span>{t('Send reset link', 'إرسال رابط إعادة التعيين')}</span></>}
                        </button>
                        <button type="button" onClick={() => reset('signin')} className="w-full text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer">{t('Back to sign in', 'العودة لتسجيل الدخول')}</button>
                    </form>
                )}

                {mode === 'sent' && (
                    <button type="button" onClick={() => { setNotice(''); setMode('signin'); }} className={primaryBtn}>{t('Back to sign in', 'العودة لتسجيل الدخول')}</button>
                )}

                {mode === 'pending' && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 flex items-start gap-3 text-sm">
                            <Hourglass className="w-5 h-5 text-[#BC5C29] shrink-0 mt-0.5" />
                            <span>{t(`You're signed in as ${pendingEmail}, but this account doesn't have access to the workspace yet. Ask an admin to grant you access from Settings → Users.`,
                                `أنت مسجل باسم ${pendingEmail} لكن هذا الحساب لا يملك صلاحية الوصول بعد. اطلب من المسؤول منحك الصلاحية من الإعدادات ← المستخدمون.`)}</span>
                        </div>
                        <button type="button" onClick={() => routeAfterSession()} className={primaryBtn}>{t('Check again', 'تحقق مجدداً')}</button>
                        <button type="button" onClick={handleSignOut} className={secondaryBtn}><LogOut className="w-4 h-4" />{t('Use another account', 'استخدام حساب آخر')}</button>
                    </div>
                )}
            </div>

            {/* Right Column: Rounded Box with data-threeui-ready */}
            <div className="relative w-full h-[240px] sm:h-[380px] lg:h-[calc(100vh-4rem)] rounded-[32px] overflow-hidden border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl flex flex-col">
                <div data-threeui-ready="" className="absolute inset-0 w-full h-full">
                    <PortalFieldCollection
                        variant="flow-field"
                        mode={isLight ? 'light' : 'dark'}
                        speed={1.00}
                        size={1.00}
                        length={1.00}
                        density={1.00}
                        opacity={1.00}
                        hue={0}
                        saturation={1.00}
                        brightness={1.00}
                        className="w-full h-full block"
                    />
                </div>

                {/* Frosted Glass Card at Bottom */}
                <div className="relative z-10 mt-auto mx-auto mb-6 w-[88%] max-w-sm rounded-3xl bg-white/25 dark:bg-black/35 backdrop-blur-xl border border-white/30 dark:border-white/15 p-5 text-white shadow-lg">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-black/40 border border-white/30 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            <Image
                                src="/logo-mark.svg"
                                alt="Orbit Logo"
                                width={28}
                                height={28}
                                priority
                                className="w-6 h-6 object-contain"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                                Orbit Systems
                            </div>
                            <div className="text-xs text-zinc-700/80 dark:text-white/70 font-medium mb-2">
                                @orbit.core
                            </div>
                            <p className="text-xs sm:text-[13px] text-zinc-900/90 dark:text-white/90 leading-relaxed">
                                {t(
                                    "Personal Operating System — Unified workspace for treasury, backbone tasks, evolution & knowledge.",
                                    "نظام التشغيل الشخصي — مساحة عمل موحدة لإدارة الخزينة والمهام والتطور المعرفي."
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
