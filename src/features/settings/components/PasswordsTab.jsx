'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Key, Plus, Trash2, Edit2, Eye, EyeOff,
    Copy, Check, ExternalLink, Globe, User, Search, RefreshCw, Lock, Unlock
} from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { fetchVaultPasswords, saveVaultPassword, deleteVaultPassword } from '@/features/settings/api/settings.api.js';

export default function PasswordsTab() {
    const { t } = useApp();

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isKeyPromptOpen, setIsKeyPromptOpen] = useState(true);
    const [keyInput, setKeyInput] = useState('');
    const [activeMasterKey, setActiveMasterKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    const [passwords, setPasswords] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [revealedPasswords, setRevealedPasswords] = useState({});
    const [copiedField, setCopiedField] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formSiteName, setFormSiteName] = useState('');
    const [formSiteUrl, setFormSiteUrl] = useState('');
    const [formUserData, setFormUserData] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formEncryptionKey, setFormEncryptionKey] = useState('');
    const [formShowPassword, setFormShowPassword] = useState(false);
    const [formShowKey, setFormShowKey] = useState(false);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchPasswords = useCallback(async (keyToUse) => {
        setLoadingList(true);
        try {
            const data = await fetchVaultPasswords(keyToUse ?? '');
            if (data && data.success) {
                setPasswords(data.passwords || []);
            }
        } catch (err) {
            console.error('[PasswordsTab] Error loading passwords:', err);
        } finally {
            setLoadingList(false);
        }
    }, []);

    const handleKeySubmit = (e) => {
        if (e) e.preventDefault();
        const enteredKey = keyInput;
        setActiveMasterKey(enteredKey);
        setIsKeyPromptOpen(false);
        fetchPasswords(enteredKey);
    };

    const copyToClipboard = (text, fieldId) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const toggleRevealPassword = (id) => {
        setRevealedPasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const generateStrongPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=~';
        let pass = '';
        for (let i = 0; i < 20; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormPassword(pass);
        setFormShowPassword(true);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormSiteName('');
        setFormSiteUrl('');
        setFormUserData('');
        setFormPassword('');
        setFormEncryptionKey(activeMasterKey);
        setFormShowPassword(false);
        setFormShowKey(false);
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormSiteName(item.site_name || '');
        setFormSiteUrl(item.site_url || '');
        setFormUserData(item.user_data || '');
        setFormPassword(item.password || '');
        setFormEncryptionKey(activeMasterKey);
        setFormShowPassword(false);
        setFormShowKey(false);
        setFormError('');
        setIsModalOpen(true);
    };

    const handleSaveForm = async (e) => {
        if (e) e.preventDefault();
        if (!formSiteName.trim() || !formUserData.trim() || !formPassword.trim()) {
            setFormError(t('Please fill all required fields', 'يرجى ملء الحقول المطلوبة'));
            return;
        }

        setFormSaving(true);
        setFormError('');

        try {
            const action = editingItem ? 'update' : 'create';
            const payload = {
                action,
                masterKey: activeMasterKey,
                encryptionKey: formEncryptionKey,
                id: editingItem?.id,
                site_name: formSiteName.trim(),
                site_url: formSiteUrl.trim(),
                user_data: formUserData.trim(),
                password: formPassword.trim()
            };

            const data = await saveVaultPassword(payload);
            if (data?.success) {
                setIsModalOpen(false);
                fetchPasswords(activeMasterKey);
            } else {
                setFormError(data?.error || t('Failed to save password', 'فشل حفظ كلمة المرور'));
            }
        } catch (err) {
            setFormError(err.message || t('Error saving data', 'حدث خطأ أثناء الحفظ'));
        } finally {
            setFormSaving(false);
        }
    };

    const handleDelete = (id, siteName) => {
        setDeleteTarget({ id, siteName });
    };

    const confirmDeletePassword = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteVaultPassword(deleteTarget.id);
            fetchPasswords(activeMasterKey);
            setDeleteTarget(null);
        } catch (err) {
            console.error('[PasswordsTab] Error deleting password:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredPasswords = passwords.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const site = (p.site_name || '').toLowerCase();
        const url = (p.site_url || '').toLowerCase();
        const user = (p.user_data || '').toLowerCase();
        return site.includes(q) || url.includes(q) || user.includes(q);
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#BC5C29]/15 border border-[#BC5C29]/30 text-[#BC5C29] flex items-center justify-center font-bold">
                        <Key className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                                {t("Password Vault", "خزنة كلمات المرور")}
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BC5C29]/15 text-[#BC5C29] border border-[#BC5C29]/30 font-mono">
                                AES-256-GCM
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {activeMasterKey
                                ? t(`Decryption Key active: "${activeMasterKey.slice(0, 3)}***"`, `مفتاح فك التشفير الحالي: "${activeMasterKey.slice(0, 3)}***"`)
                                : t("No key entered (viewing raw/default state)", "لم يتم إدخال مفتاح (عرض الحالة الافتراضية)")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        onClick={openAddModal}
                        className="bg-[#BC5C29] hover:bg-[#9C4D31] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>{t("Add Password", "إضافة كلمة مرور")}</span>
                    </button>

                    <button
                        onClick={() => {
                            setKeyInput(activeMasterKey);
                            setIsKeyPromptOpen(true);
                        }}
                        className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Key className="w-3.5 h-3.5" />
                        <span>{t("Change Key", "تغيير المفتاح")}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t("Search by site name, url, or username...", "ابحث باسم الموقع، الرابط، أو اسم المستخدم...")}
                        className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 px-2">
                    <span>{t("Total Passwords:", "إجمالي الباسوردات:")}</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-[11px] border border-zinc-300 dark:border-zinc-700">
                        {passwords.length}
                    </span>
                </div>
            </div>

            {loadingList ? (
                <div className="py-16 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#BC5C29] mx-auto" />
                    <p className="text-xs text-zinc-400">{t("Processing passwords with AES-256-GCM...", "جاري معالجة وفك تشفير البيانات...")}</p>
                </div>
            ) : filteredPasswords.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                    <Key className="w-8 h-8 text-zinc-400 mx-auto stroke-[1.5]" />
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-white">
                        {searchQuery ? t("No passwords matching search query", "لا توجد نتائج مطابقة للبحث") : t("Your Password Vault is Empty", "خزنة كلمات المرور فارغة حالياً")}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                        {t("Add your first website credential with its custom encryption key.", "أضف موقعك الأول وحدد المفتاح في الخانة الخامسة ليتم تشفيره وحفظه.")}
                    </p>
                    <button
                        onClick={openAddModal}
                        className="mt-2 bg-[#BC5C29] hover:bg-[#9C4D31] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>{t("Add First Password", "إضافة أول كلمة مرور")}</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPasswords.map((item) => {
                        const isRevealed = Boolean(revealedPasswords[item.id]);

                        return (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4 shadow-xs hover:border-[#BC5C29]/50 transition group"
                            >
                                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-[#BC5C29]/15 text-[#BC5C29] flex items-center justify-center font-black text-xs uppercase">
                                                {item.site_name.slice(0, 2)}
                                            </div>
                                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                {item.site_name}
                                            </h3>
                                        </div>

                                        {item.site_url ? (
                                            <a
                                                href={item.site_url.startsWith('http') ? item.site_url : `https://${item.site_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] text-[#BC5C29] dark:text-[#BC5C29] hover:underline flex items-center gap-1 font-mono line-clamp-1"
                                            >
                                                <Globe className="w-3 h-3 shrink-0" />
                                                <span>{item.site_url.replace(/^https?:\/\//, '')}</span>
                                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                            </a>
                                        ) : (
                                            <span className="text-[11px] text-zinc-400 font-mono italic">No URL linked</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditModal(item)}
                                            className="p-1.5 text-zinc-400 hover:text-[#BC5C29] rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                            title={t("Edit", "تعديل")}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.site_name)}
                                            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                            title={t("Delete", "حذف")}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{t("Username / Email", "اليوزر داتا / الحساب")}</span>
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(item.user_data, `user-${item.id}`)}
                                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer font-sans"
                                        >
                                            {copiedField === `user-${item.id}` ? (
                                                <span className="text-emerald-500 flex items-center gap-0.5">
                                                    <Check className="w-2.5 h-2.5" /> {t("Copied!", "تم النسخ!")}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-0.5">
                                                    <Copy className="w-2.5 h-2.5" /> {t("Copy", "نسخ")}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 select-all break-all">
                                        {item.user_data}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        <span className="flex items-center gap-1">
                                            <Key className="w-3 h-3" />
                                            <span>{t("Password", "الباسورد")}</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleRevealPassword(item.id)}
                                                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer font-sans"
                                            >
                                                {isRevealed ? (
                                                    <span className="flex items-center gap-0.5 text-amber-600 dark:text-[#BC5C29]">
                                                        <EyeOff className="w-2.5 h-2.5" /> {t("Hide", "إخفاء")}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-0.5">
                                                        <Eye className="w-2.5 h-2.5" /> {t("Show", "إظهار")}
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(item.password, `pass-${item.id}`)}
                                                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer font-sans"
                                            >
                                                {copiedField === `pass-${item.id}` ? (
                                                    <span className="text-emerald-500 flex items-center gap-0.5">
                                                        <Check className="w-2.5 h-2.5" /> {t("Copied!", "تم النسخ!")}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-0.5">
                                                        <Copy className="w-2.5 h-2.5" /> {t("Copy", "نسخ")}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                                        <span className="select-all tracking-wider break-all">
                                            {isRevealed ? item.password : '••••••••••••••••'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isKeyPromptOpen && (
                <div
                    className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsKeyPromptOpen(false); }}
                >
                    <div
                        className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Enter Decryption Key", "أدخل مفتاح فك التشفير")}
                                    </h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Any key you enter will pass and be used to decrypt your passwords in real-time.", "أي مفتاح تدخله سيُقبل فوراً وسيُستخدم لمعالجة وفك تشفير كلمات المرور.")}
                                    </p>
                                </div>
                            </div>
                            {activeMasterKey && (
                                <button
                                    type="button"
                                    onClick={() => setIsKeyPromptOpen(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0 text-lg leading-none"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleKeySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Decryption Key", "مفتاح التشفير")}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showKeyInput ? 'text' : 'password'}
                                        autoFocus
                                        value={keyInput}
                                        onChange={e => setKeyInput(e.target.value)}
                                        placeholder={t("Enter key (or leave empty)...", "أدخل المفتاح هنا...")}
                                        className="w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 ps-4 pe-12 py-2.5 rounded-2xl text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKeyInput(prev => !prev)}
                                        className="absolute end-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition cursor-pointer p-1"
                                    >
                                        {showKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                                {activeMasterKey && (
                                    <button
                                        type="button"
                                        onClick={() => setIsKeyPromptOpen(false)}
                                        className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                                    >
                                        {t("Cancel", "إلغاء")}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Unlock className="w-4 h-4" />
                                    <span>{t("Continue to Vault", "دخول ومتابعة للخزنة")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                >
                    <div
                        className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {editingItem ? t("Edit Password Credentials", "تعديل بيانات كلمة المرور") : t("Add New Encrypted Password", "إضافة كلمة مرور مشفرة جديدة")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("5-Field AES-256-GCM Entry", "نموذج بـ 5 خانات متكاملة مع مفتاح التشفير")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSaveForm} className="space-y-4 font-sans text-xs">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("1. Site / Service Name *", "الخانة الأولى: اسم الموقع *")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formSiteName}
                                    onChange={e => setFormSiteName(e.target.value)}
                                    placeholder="e.g. GitHub, Google, AWS"
                                    className="w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("2. Site Link / URL", "الخانة الثانية: لينك الموقع")}
                                </label>
                                <input
                                    type="text"
                                    value={formSiteUrl}
                                    onChange={e => setFormSiteUrl(e.target.value)}
                                    placeholder="https://github.com/login"
                                    className="w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("3. User Data (Username / Email) *", "الخانة الثالثة: اليوزر داتا *")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formUserData}
                                    onChange={e => setFormUserData(e.target.value)}
                                    placeholder="user@example.com / username"
                                    className="w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-mono font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                        {t("4. Password *", "الخانة الرابعة: الباسورد *")}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={generateStrongPassword}
                                        className="text-[11px] font-semibold text-[#BC5C29] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>🎲 {t("Generate Strong", "توليد باسورد قوي")}</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={formShowPassword ? 'text' : 'password'}
                                        required
                                        value={formPassword}
                                        onChange={e => setFormPassword(e.target.value)}
                                        placeholder="••••••••••••••••"
                                        className="w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 ps-4 pe-10 py-2.5 rounded-2xl text-xs sm:text-sm font-mono font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormShowPassword(prev => !prev)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition cursor-pointer p-1"
                                    >
                                        {formShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                                <label className="block text-xs font-semibold text-[#BC5C29]">
                                    {t("5. Encryption Key *", "الخانة الخامسة: مفتاح التشفير الخاص بهذا الباسورد *")}
                                </label>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {t("This key encrypts this specific password in the database and is NEVER saved.", "هذا المفتاح يُشفر هذا الباسورد في قاعدة البيانات ولا يُخزن إطلاقاً.")}
                                </p>
                                <div className="relative">
                                    <input
                                        type={formShowKey ? 'text' : 'password'}
                                        required
                                        value={formEncryptionKey}
                                        onChange={e => setFormEncryptionKey(e.target.value)}
                                        placeholder={t("Enter encryption key for this entry...", "أدخل المفتاح الذي تريد تشفير هذا الباسورد به...")}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ps-4 pe-10 py-2.5 rounded-2xl text-xs sm:text-sm font-mono font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormShowKey(prev => !prev)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition cursor-pointer p-1"
                                    >
                                        {formShowKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 mt-5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSaving}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {formSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{formSaving ? t("Encrypting & Saving...", "جاري التشفير والحفظ...") : t("Save Encrypted Password", "تشفير وحفظ في الـ Database")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeletePassword}
                itemName={deleteTarget?.siteName || ''}
                isDeleting={isDeleting}
            />
        </div>
    );
}
