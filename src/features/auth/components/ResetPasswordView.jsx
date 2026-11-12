'use client';

import React, { useEffect, useState } from 'react';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { useRouter } from '@/shared/next-compat/navigation';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/shared/http/apiClient.js';

export default function ResetPasswordView() {
    const { t } = useApp();
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        const isRecovery = window.location.hash.includes('type=recovery');
        const { data } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
        });
        supabase.auth.getSession().then(({ data: s }) => {
            if (s?.session || isRecovery) setReady(Boolean(s?.session) || isRecovery);
        });
        return () => data.subscription.unsubscribe();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) { setError(t('Use at least 8 characters.', 'استخدم 8 أحرف على الأقل.')); return; }
        if (password !== confirm) { setError(t('The passwords do not match.', 'كلمتا المرور غير متطابقتين.')); return; }
        setLoading(true);
        const { error: err } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (err) { setError(err.message); return; }
        apiClient.post('/api/auth/session-event', { event: 'PASSWORD_SET' }).catch(() => {});
        setDone(true);
        setTimeout(() => router.replace('/'), 1200);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6">
            <form onSubmit={submit} className="w-full max-w-md space-y-5">
                <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">{t('Choose a new password', 'اختر كلمة مرور جديدة')}</h1>
                {!ready && !done && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('Open this page from the reset link in your email.', 'افتح هذه الصفحة من رابط إعادة التعيين في بريدك.')}</p>
                )}
                {error && (
                    <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-200 flex items-center gap-2.5 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
                    </div>
                )}
                {done ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-200 flex items-center gap-2.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{t('Password updated. Taking you to your workspace…', 'تم تحديث كلمة المرور. جارٍ نقلك إلى مساحة العمل…')}</span>
                    </div>
                ) : (
                    <>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('New password', 'كلمة المرور الجديدة')} autoComplete="new-password" disabled={!ready}
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white outline-none" />
                        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('Confirm password', 'تأكيد كلمة المرور')} autoComplete="new-password" disabled={!ready}
                            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white outline-none" />
                        <button type="submit" disabled={!ready || loading}
                            className="w-full py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                            <KeyRound className="w-4 h-4" />{t('Save password', 'حفظ كلمة المرور')}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
