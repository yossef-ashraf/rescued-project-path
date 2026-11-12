'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/shared/next-compat/image';
import { PortalFieldCollection } from '@/components/shared/threeui/NeuformBatchEffects';
import '@/components/shared/threeui/threeui.css';
import { useRouter, useSearchParams } from '@/shared/next-compat/navigation';
import { Mail, ArrowRight, ShieldCheck, AlertCircle, Send, CheckCircle2, RotateCcw, MessageSquare, Check } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';
import { getSafeRedirect } from '@/shared/utils/auth.logic.js';
import { checkAuthSession, sendOtp, verifyOtp } from '@/shared/api/auth.api.js';

export default function LoginView() {
    const { t, theme } = useApp();
    const isLight = theme === 'light' || theme === 'mode-light';
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = getSafeRedirect(searchParams?.get('redirect'));

    const [login, setLogin] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [channel, setChannel] = useState('telegram');
    const [targetDestination, setTargetDestination] = useState('');
    const [maskedDestination, setMaskedDestination] = useState('');

    const [otpStep, setOtpStep] = useState(1);
    const [resendTimer, setResendTimer] = useState(0);

    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        checkAuthSession()
            .then(data => {
                if (data?.authenticated) {
                    router.replace(redirectUrl);
                }
            })
            .catch(() => { });
    }, [redirectUrl, router]);

    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [resendTimer]);

    const handleSendOtp = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const { ok, data } = await sendOtp(login, channel);

            if (!ok) {
                setError(data.error || 'Failed to send OTP.');
                return;
            }

            setTargetDestination(data.targetDestination);
            setMaskedDestination(data.maskedDestination);
            setSuccessMessage(data.message || 'OTP sent successfully.');
            setOtpStep(2);
            setResendTimer(60);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { ok, data } = await verifyOtp({
                login,
                otp: otpCode,
                targetDestination,
                rememberMe
            });

            if (!ok) {
                setError(data.error || 'Verification failed.');
                return;
            }

            router.replace(redirectUrl);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen w-full ${isLight ? 'bg-white text-zinc-900' : 'bg-zinc-950 text-zinc-100'} grid grid-cols-1 lg:grid-cols-2 p-4 sm:p-6 lg:p-8 gap-6 items-center select-none font-sans transition-colors duration-300`}>
            {/* Left Column: Login Form */}
            <div className="w-full max-w-md mx-auto px-2 sm:px-6 space-y-6">
                <div className="space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                        {t("Welcome", "مرحباً بك")}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t("Access your account and continue your journey with us", "سجل دخولك لمتابعة أعمالك وإدارة نظامك الشخصي")}
                    </p>
                </div>

                {error && (
                    <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-200 flex items-center gap-2.5 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                        <span className="leading-snug font-medium">{error}</span>
                    </div>
                )}

                {successMessage && otpStep === 2 && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-200 flex items-center gap-2.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
                        <span className="leading-snug font-medium">{successMessage}</span>
                    </div>
                )}

                {otpStep === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                                {t("Username or Email Address", "اسم المستخدم أو البريد الإلكتروني")}
                            </label>
                            <input
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder={t("Enter your username or email", "أدخل اسم المستخدم أو البريد الإلكتروني")}
                                required
                                autoFocus
                                autoComplete="username"
                                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                                {t("Delivery Channel", "وسيلة الاستلام")}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setChannel('telegram')}
                                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                                        channel === 'telegram'
                                            ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                                            : 'bg-zinc-100/90 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <MessageSquare className="w-4 h-4 text-[#BC5C29]" />
                                    <span>{t("Telegram Bot", "بوت تيليجرام")}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setChannel('email')}
                                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                                        channel === 'email'
                                            ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                                            : 'bg-zinc-100/90 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <Mail className="w-4 h-4 text-[#BC5C29]" />
                                    <span>{t("Gmail OTP", "بريد جيميل")}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <button
                                type="button"
                                onClick={() => setRememberMe(prev => !prev)}
                                className="flex items-center gap-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                            >
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                                    rememberMe
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                                }`}>
                                    {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span>{t("Keep me signed in", "تذكر تسجيل الدخول")}</span>
                            </button>

                            <span className="text-xs font-medium text-[#BC5C29]">
                                {t("Zero-Cost OTP", "رمز دخول فوري")}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{t("Sign In", "تسجيل الدخول")}</span>
                                    <Send className="w-4 h-4 rtl:rotate-180" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                                {channel === 'telegram' ? (
                                    <MessageSquare className="w-3.5 h-3.5 text-[#BC5C29]" />
                                ) : (
                                    <Mail className="w-3.5 h-3.5 text-[#BC5C29]" />
                                )}
                                {maskedDestination && maskedDestination !== 'undefined'
                                    ? `${t("Sent to", "أُرسل إلى")} ${maskedDestination}`
                                    : (channel === 'telegram' ? t('Sent via Telegram Bot', 'أُرسل عبر بوت تيليجرام') : t('Sent to your email', 'أُرسل إلى بريدك'))}
                            </span>

                            <button
                                type="button"
                                onClick={() => { setOtpStep(1); setOtpCode(''); setError(''); }}
                                className="text-xs font-medium text-[#BC5C29] hover:underline cursor-pointer"
                            >
                                {t("Change Channel", "تغيير القناة")}
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                                {t("Enter 6-digit Verification Code", "أدخل الرمز المكون من 6 أرقام")}
                            </label>
                            <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                autoFocus
                                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 text-center tracking-[0.35em] sm:tracking-[0.5em] font-mono text-2xl text-zinc-900 dark:text-white placeholder-zinc-400 outline-none transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otpCode.length < 5}
                            className="w-full py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{t("Verify & Sign In", "تأكيد وتسجيل الدخول")}</span>
                                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center pt-1">
                            <button
                                type="button"
                                onClick={() => handleSendOtp()}
                                disabled={resendTimer > 0 || loading}
                                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-[#BC5C29]" />
                                <span>
                                    {resendTimer > 0
                                        ? t(`Resend code in ${resendTimer}s`, `إعادة الإرسال خلال ${resendTimer} ث`)
                                        : t('Resend verification code', 'إعادة إرسال الرمز')}
                                </span>
                            </button>
                        </div>
                    </form>
                )}

                <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-[#BC5C29]" />
                    <span>{t("Protected by Orbit Zero-Cost OTP & Audit Telemetry", "محمي بنظام التحقق الفوري وسجل الأمان")}</span>
                </div>
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
                                src="/logos/image.png"
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
