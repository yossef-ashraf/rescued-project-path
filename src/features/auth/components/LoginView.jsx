'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/shared/next-compat/image';
import { PortalFieldCollection } from '@/components/shared/threeui/NeuformBatchEffects';
import '@/components/shared/threeui/threeui.css';
import { useRouter, useSearchParams } from '@/shared/next-compat/navigation';
import { Mail, ArrowRight, ShieldCheck, AlertCircle, Send, CheckCircle2, RotateCcw, MessageSquare, Check, Hourglass, LogOut, Loader2 } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { getSafeRedirect } from '@/shared/utils/auth.logic.js';
import { checkAuthSession, sendOtp, verifyOtp } from '@/shared/api/auth.api.js';
import { apiClient } from '@/shared/http/apiClient.js';
import { invalidateAuthCache } from '@/features/auth/services/sessionCache.js';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/shared/utils/utils.js';

const CODE_MAX = 8;

function ChannelOption({ active, onClick, icon: Icon, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn('ui-btn ui-btn-lg w-full', active ? 'ui-btn-solid' : 'ui-btn-gray')}
        >
            <Icon className={cn(!active && 'text-primary')} />
            <span>{label}</span>
        </button>
    );
}

function Notice({ tone, children }) {
    const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
    return (
        <div role={tone === 'error' ? 'alert' : 'status'} className={cn('ui-notice', tone === 'error' ? 'ui-notice-danger' : 'ui-notice-success')}>
            <Icon className="size-4 shrink-0" />
            <span>{children}</span>
        </div>
    );
}

export default function LoginView() {
    const { t, theme } = useApp();
    const isLight = theme === 'light' || theme === 'mode-light';
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = getSafeRedirect(searchParams?.get('redirect'));

    const [login, setLogin] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [channel, setChannel] = useState('email');
    const [maskedDestination, setMaskedDestination] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [otpStep, setOtpStep] = useState(1);
    const [resendTimer, setResendTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
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
            setOtpStep(3);
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

    useEffect(() => {
        if (resendTimer <= 0) return undefined;
        const id = setInterval(() => setResendTimer((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [resendTimer]);

    const handleSendOtp = async (e) => {
        e?.preventDefault?.();
        if (!login.trim()) return;
        setError(''); setSuccessMessage(''); setLoading(true);
        try {
            const { ok, data } = await sendOtp(login.trim(), channel);
            if (!ok) { setError(data.error || t('Could not send the code.', 'تعذر إرسال الرمز.')); return; }
            setIsPreview(Boolean(data.preview));
            setMaskedDestination(data.maskedDestination || '');
            setSuccessMessage(data.preview
                ? t('Preview sign-in: enter 000000.', 'دخول المعاينة: أدخل 000000.')
                : channel === 'email'
                    ? t('Check your inbox for the sign-in code (or tap the link in the email).', 'راجع بريدك لرمز الدخول (أو اضغط الرابط في الرسالة).')
                    : t('We sent a code to your Telegram.', 'أرسلنا الرمز إلى تيليجرام.'));
            setOtpCode('');
            setOtpStep(2);
            setResendTimer(data.preview ? 0 : 60);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const { ok, data } = await verifyOtp({ login: login.trim(), otp: otpCode, channel: isPreview ? 'preview' : channel });
            if (!ok || !data?.session) { setError(data?.error || t('Incorrect or expired code.', 'الرمز غير صحيح أو منتهي.')); return; }
            const { error: sessionError } = await supabase.auth.setSession(data.session);
            if (sessionError) { setError(sessionError.message); return; }
            apiClient.post('/api/auth/session-event', { event: 'LOGIN_SUCCESS', method: `otp_${channel}` }).catch(() => {});
            await routeAfterSession();
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        invalidateAuthCache();
        setOtpStep(1); setOtpCode(''); setError(''); setSuccessMessage('');
    };

    const backToStart = () => { setOtpStep(1); setOtpCode(''); setError(''); setSuccessMessage(''); };

    return (
        <div className="min-h-dvh w-full bg-surface text-ink grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 lg:p-8 lg:items-center">
            <div className="order-2 lg:order-1 w-full max-w-sm mx-auto space-y-7 py-2 sm:py-6">
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                        {otpStep === 3 ? t('Almost there', 'اقتربنا') : t('Welcome', 'مرحباً بك')}
                    </h1>
                    <p className="text-sm text-muted leading-relaxed">
                        {otpStep === 2
                            ? t('Enter the 6-digit code to finish signing in.', 'أدخل الرمز المكون من 6 أرقام لإكمال الدخول.')
                            : t('Access your account and continue your journey with us', 'سجل دخولك لمتابعة أعمالك وإدارة نظامك الشخصي')}
                    </p>
                </div>

                {error && <Notice tone="error">{error}</Notice>}
                {successMessage && otpStep === 2 && <Notice tone="success">{successMessage}</Notice>}

                {otpStep === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
                        <div className="ui-field">
                            <label htmlFor="login-id" className="ui-label">{t('Username or Email Address', 'اسم المستخدم أو البريد الإلكتروني')}</label>
                            <div className="ui-input-wrp">
                                <input
                                    id="login-id"
                                    type="text"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    placeholder={t('Enter your username or email', 'أدخل اسم المستخدم أو البريد الإلكتروني')}
                                    required
                                    autoFocus
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    autoComplete="username"
                                    className="ui-input"
                                />
                            </div>
                        </div>

                        <fieldset className="ui-field">
                            <legend className="ui-label">{t('Delivery Channel', 'وسيلة الاستلام')}</legend>
                            <div className="grid grid-cols-2 gap-2.5">
                                <ChannelOption active={channel === 'email'} onClick={() => setChannel('email')} icon={Mail} label={t('Email', 'البريد')} />
                                <ChannelOption active={channel === 'telegram'} onClick={() => setChannel('telegram')} icon={MessageSquare} label={t('Telegram Bot', 'بوت تيليجرام')} />
                            </div>
                        </fieldset>

                        <button type="submit" disabled={loading || !login.trim()} className="ui-btn ui-btn-primary ui-btn-xl w-full">
                            {loading ? <Loader2 className="animate-spin" /> : <Send className="rtl:-scale-x-100" />}
                            <span>{t('Send code', 'إرسال الرمز')}</span>
                        </button>
                    </form>
                )}

                {otpStep === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <span className="ui-badge">
                                {channel === 'telegram' && !isPreview ? <MessageSquare className="size-3.5" /> : <Mail className="size-3.5" />}
                                <span className="truncate">{maskedDestination ? `${t('Sent to', 'أُرسل إلى')} ${maskedDestination}` : t('Code sent', 'تم الإرسال')}</span>
                            </span>
                            <button type="button" onClick={backToStart} className="ui-btn ui-btn-link ui-btn-sm">
                                {t('Change', 'تغيير')}
                            </button>
                        </div>

                        <div className="ui-field">
                            <label htmlFor="login-code" className="ui-label">{t('Verification code', 'رمز التحقق')}</label>
                            <div className="ui-input-wrp">
                                <input
                                    id="login-code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, CODE_MAX))}
                                    placeholder="••••••"
                                    autoFocus
                                    dir="ltr"
                                    className="ui-input text-center font-mono text-xl tracking-[0.5em] h-12"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || otpCode.length < 6} className="ui-btn ui-btn-primary ui-btn-xl w-full">
                            {loading ? <Loader2 className="animate-spin" /> : <Check />}
                            <span>{t('Verify & Sign In', 'تأكيد وتسجيل الدخول')}</span>
                        </button>

                        {!isPreview && (
                            <div className="flex justify-center">
                                <button type="button" onClick={() => handleSendOtp()} disabled={resendTimer > 0 || loading} className="ui-btn ui-btn-ghost ui-btn-sm">
                                    <RotateCcw />
                                    <span>{resendTimer > 0 ? t(`Resend in ${resendTimer}s`, `إعادة الإرسال خلال ${resendTimer} ث`) : t('Resend code', 'إعادة إرسال الرمز')}</span>
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {otpStep === 3 && (
                    <div className="space-y-4">
                        <div className="ui-notice">
                            <Hourglass className="size-4 shrink-0 text-primary" />
                            <span>{t(`You're signed in as ${pendingEmail}, but this account doesn't have access yet. Ask an admin to approve you from Settings → Users.`,
                                `أنت مسجل باسم ${pendingEmail} لكن الحساب لا يملك صلاحية بعد. اطلب من المسؤول الموافقة من الإعدادات ← المستخدمون.`)}</span>
                        </div>
                        <button type="button" onClick={() => routeAfterSession()} className="ui-btn ui-btn-primary ui-btn-xl w-full">
                            <ArrowRight className="rtl:-scale-x-100" />{t('Check again', 'تحقق مجدداً')}
                        </button>
                        <button type="button" onClick={handleSignOut} className="ui-btn ui-btn-gray ui-btn-xl w-full">
                            <LogOut />{t('Use another account', 'استخدام حساب آخر')}
                        </button>
                    </div>
                )}

                <div className="pt-5 border-t border-line flex items-center justify-center gap-2 text-xs text-muted">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>{t('Protected by one-time codes & audit log', 'محمي برموز الدخول لمرة واحدة وسجل الأمان')}</span>
                </div>
            </div>

            <div className="order-1 lg:order-2 relative w-full h-[180px] sm:h-[300px] lg:h-[calc(100dvh-4rem)] rounded-3xl lg:rounded-[32px] overflow-hidden ring-1 ring-line shadow-xl flex flex-col">
                <div data-threeui-ready="" className="absolute inset-0 w-full h-full">
                    <PortalFieldCollection variant="flow-field" mode={isLight ? 'light' : 'dark'} speed={1} size={1} length={1} density={1} opacity={1} hue={0} saturation={1} brightness={1} className="w-full h-full block" />
                </div>
                <div className="relative z-10 mt-auto mx-auto mb-4 sm:mb-6 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-surface/40 backdrop-blur-xl ring-1 ring-surface/40 p-4 shadow-lg hidden sm:block">
                    <div className="flex items-start gap-3.5">
                        <div className="size-10 rounded-full bg-ink/40 ring-1 ring-surface/30 flex items-center justify-center shrink-0 overflow-hidden">
                            <Image src="/logo-mark.svg" alt="Orbit" width={28} height={28} priority className="size-6 object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-ink leading-tight">Orbit Systems</div>
                            <div className="text-xs text-ink2/80 font-medium mb-2">@orbit.core</div>
                            <p className="text-[13px] text-ink/90 leading-relaxed">
                                {t('Personal Operating System — Unified workspace for treasury, backbone tasks, evolution & knowledge.',
                                    'نظام التشغيل الشخصي — مساحة عمل موحدة لإدارة الخزينة والمهام والتطور المعرفي.')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
