'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Key, Trash2, CheckCircle, XCircle, ShieldCheck, UserCheck, Shield, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { fetchUsers, addUser, updateUser, changeUserPassword, deleteUser, logoutAllSessions } from '@/features/settings/api/settings.api.js';

export default function UsersTab() {
    const { t } = useApp();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showGlobalLogoutModal, setShowGlobalLogoutModal] = useState(false);
    const [revokeUserTarget, setRevokeUserTarget] = useState(null);
    const [isRevoking, setIsRevoking] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'admin',
        status: 'active'
    });
    const [userActionLoading, setUserActionLoading] = useState(false);
    const [userMessage, setUserMessage] = useState(null);

    const loadUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const data = await fetchUsers();
            if (data?.success) {
                setUsersList(data.users || []);
            }
        } catch (e) {
            console.error('[UsersTab] Failed to fetch users:', e);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        fetchUsers()
            .then(data => {
                if (isMounted && data?.success) {
                    setUsersList(data.users || []);
                }
            })
            .catch(e => {
                console.error('[UsersTab] Failed to fetch users:', e);
            });
        return () => { isMounted = false; };
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setUserActionLoading(true);
        setUserMessage(null);
        try {
            await addUser(userForm);
            setUserMessage({ type: 'success', text: `User ${userForm.username} created successfully!` });
            setShowCreateUserModal(false);
            setUserForm({ name: '', email: '', username: '', password: '', role: 'admin', status: 'active' });
            loadUsers();
        } catch (err) {
            setUserMessage({ type: 'error', text: err.message || 'Failed to create user' });
        } finally {
            setUserActionLoading(false);
        }
    };

    const handleUpdateUserStatus = async (user, newStatus) => {
        try {
            await updateUser({ id: user.id, status: newStatus });
            loadUsers();
        } catch (e) {
            console.error('[UsersTab] Error updating status:', e);
        }
    };

    const handleUpdateUserRole = async (user, newRole) => {
        try {
            await updateUser({ id: user.id, role: newRole });
            loadUsers();
        } catch (e) {
            console.error('[UsersTab] Error updating role:', e);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!selectedUser || !newPasswordValue) return;
        setUserActionLoading(true);
        try {
            await changeUserPassword(selectedUser.id, newPasswordValue);
            setShowPasswordModal(false);
            setNewPasswordValue('');
            setSelectedUser(null);
            setUserMessage({ type: 'success', text: 'Password reset successfully!' });
        } catch (e) {
            console.error('[UsersTab] Error resetting password:', e);
            setUserMessage({ type: 'error', text: e.message || 'Failed to reset password' });
        } finally {
            setUserActionLoading(false);
        }
    };

    const handleDeleteUser = (userId, userName = '') => {
        setDeleteTarget({ id: userId, name: userName });
    };

    const confirmDeleteUser = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteUser(deleteTarget.id);
            loadUsers();
            setDeleteTarget(null);
        } catch (e) {
            console.error('[UsersTab] Error deleting user:', e);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleGlobalLogout = async () => {
        setIsRevoking(true);
        try {
            await logoutAllSessions({ all: true });
            window.location.href = '/login';
        } catch (e) {
            setUserMessage({ type: 'error', text: e.message || 'Failed to terminate all sessions' });
            setIsRevoking(false);
            setShowGlobalLogoutModal(false);
        }
    };

    const handleRevokeUser = async () => {
        if (!revokeUserTarget) return;
        setIsRevoking(true);
        try {
            await logoutAllSessions({ userId: revokeUserTarget.id });
            setUserMessage({
                type: 'success',
                text: t(
                    `All active sessions for @${revokeUserTarget.username} were terminated across all devices.`,
                    `تم تسجيل خروج @${revokeUserTarget.username} من جميع أجهزته وهواتفه بنجاح.`
                )
            });
            setRevokeUserTarget(null);
            loadUsers();
        } catch (e) {
            setUserMessage({ type: 'error', text: e.message || 'Failed to revoke user sessions' });
        } finally {
            setIsRevoking(false);
        }
    };

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 14; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {userMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
                    userMessage.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                    <span>{userMessage.text}</span>
                    <button onClick={() => setUserMessage(null)} className="text-xs opacity-60 hover:opacity-100">&times;</button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#2E0025]/80 border border-[#BC5C29]/25 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#BC5C29]" />
                        <h2 className="text-sm sm:text-base font-black uppercase text-zinc-900 dark:text-[#FBF3E9]">
                            {t("User Accounts & Role Permissions", "إدارة حسابات المستخدمين وصلاحيات الأدمن")}
                        </h2>
                    </div>
                    <p className="text-xs font-mono text-[#6E5A4E] mt-1">
                        {t("Manage system administrators, editors, passwords, and active session privileges.", "إدارة الحسابات المسجلة وتعيين الأدوار وكلمات المرور المشفرة بـ Scrypt.")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setShowGlobalLogoutModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-xs font-black shadow-xs transition cursor-pointer"
                        title={t("Log out all active sessions on all devices for all users", "تسجيل الخروج من كافة الأجهزة لجميع المستخدمين")}
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{t("Logout All Devices", "خروج من كل الأجهزة للجميع")}</span>
                    </button>
                    <button
                        onClick={loadUsers}
                        disabled={loadingUsers}
                        className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                        title="Refresh Users"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowCreateUserModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#BC5C29] hover:bg-[#9C4D31] text-white text-xs font-black shadow-sm transition cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>{t("Add New User", "إضافة مستخدم جديد")}</span>
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                                <th className="px-5 py-3.5 text-start">{t("User Profile", "المستخدم")}</th>
                                <th className="px-4 py-3.5 text-start">{t("Email / Username", "البريد / المعرف")}</th>
                                <th className="px-4 py-3.5 text-start">{t("Role", "الصلاحية")}</th>
                                <th className="px-4 py-3.5 text-start">{t("Status", "الحالة")}</th>
                                <th className="px-4 py-3.5 text-start">{t("Last Active", "آخر نشاط")}</th>
                                <th className="px-5 py-3.5 text-end">{t("Actions", "إجراءات")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                            {loadingUsers && usersList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                                        <div className="inline-block w-5 h-5 border-2 border-[#BC5C29] border-t-transparent rounded-full animate-spin mb-2" />
                                        <p>{t("Loading user directory...", "جاري تحميل قائمة المستخدمين...")}</p>
                                    </td>
                                </tr>
                            ) : usersList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                                        {t("No users found. Create your first administrative account.", "لا يوجد مستخدمين مسجلين بعد.")}
                                    </td>
                                </tr>
                            ) : (
                                usersList.map(u => (
                                    <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#BC5C29]/20 border border-[#BC5C29]/40 flex items-center justify-center font-bold text-[#BC5C29] text-xs">
                                                    {u.name ? u.name.charAt(0).toUpperCase() : u.username?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{u.name || u.username}</p>
                                                    <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">ID #{u.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-mono text-zinc-800 dark:text-zinc-200">{u.email}</p>
                                            <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">@{u.username}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <select
                                                value={u.role || 'viewer'}
                                                onChange={e => handleUpdateUserRole(u, e.target.value)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white cursor-pointer focus:outline-none focus:border-[#BC5C29]"
                                            >
                                                <option value="super_admin">Super Admin</option>
                                                <option value="admin">Admin</option>
                                                <option value="editor">Editor</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                onClick={() => handleUpdateUserStatus(u, u.status === 'active' ? 'suspended' : 'active')}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5 ${
                                                    u.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                                        : 'bg-red-500/10 text-red-500 border border-red-500/30'
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                <span>{u.status === 'active' ? 'Active' : 'Suspended'}</span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5 text-zinc-500 font-mono text-[11px]">
                                            {u.last_login_at
                                                ? new Date(u.last_login_at).toLocaleString()
                                                : t("Never logged in", "لم يسجل بعد")}
                                        </td>
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setRevokeUserTarget(u)}
                                                    className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                                                    title={t(`Log out @${u.username} from all devices`, `تسجيل خروج @${u.username} من كافة أجهزته وهواتفه`)}
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setNewPasswordValue(generateRandomPassword());
                                                        setShowPasswordModal(true);
                                                    }}
                                                    className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-[#BC5C29] hover:bg-[#BC5C29]/10 transition cursor-pointer"
                                                    title="Reset Password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.name || u.username)}
                                                    className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreateUserModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowCreateUserModal(false); }}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in text-zinc-900 dark:text-zinc-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Create Administrative User", "إضافة مستخدم جديد")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Invite a new team member and assign access permissions.", "إنشاء حساب جديد وتحديد صلاحياته.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateUserModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    required
                                    className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        value={userForm.username}
                                        onChange={e => setUserForm({ ...userForm, username: e.target.value.toLowerCase() })}
                                        placeholder="johndoe"
                                        required
                                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Role</label>
                                    <select
                                        value={userForm.role}
                                        onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition cursor-pointer"
                                    >
                                        <option value="super_admin">Super Admin</option>
                                        <option value="admin">Admin</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                    className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => setUserForm({ ...userForm, password: generateRandomPassword() })}
                                        className="text-[11px] font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                    >
                                        Generate Strong Password
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder="Min 8 characters..."
                                    required
                                    className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white font-mono placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div className="pt-4 mt-5 flex items-center justify-end gap-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateUserModal(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={userActionLoading}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs cursor-pointer shadow-sm transition disabled:opacity-50"
                                >
                                    {userActionLoading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPasswordModal && selectedUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in text-zinc-900 dark:text-zinc-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        Reset Password
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        Resetting password for <strong className="text-zinc-900 dark:text-white">@{selectedUser.username}</strong> ({selectedUser.email}).
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">New Password</label>
                                    <button
                                        type="button"
                                        onClick={() => setNewPasswordValue(generateRandomPassword())}
                                        className="text-[11px] font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                    >
                                        Generate
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={newPasswordValue}
                                    onChange={e => setNewPasswordValue(e.target.value)}
                                    placeholder="Enter new password..."
                                    required
                                    className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white font-mono placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div className="pt-4 mt-5 flex items-center justify-end gap-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={userActionLoading || !newPasswordValue}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs cursor-pointer shadow-sm transition disabled:opacity-50"
                                >
                                    {userActionLoading ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showGlobalLogoutModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget && !isRevoking) setShowGlobalLogoutModal(false); }}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in text-zinc-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Terminate All Active Sessions?", "إنهاء جميع الجلسات والخروج من كل الأجهزة؟")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t("Security Force Logout", "تسجيل خروج إجباري عام")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => setShowGlobalLogoutModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {t(
                                "This will instantly terminate all active sessions across all devices, phones, tablets, and browsers for ALL users. Everyone (including yourself) will be required to log in again.",
                                "سيتم فوراً طرد وتسجيل خروج جميع المستخدمين من كل الأجهزة والهواتف والمتصفحات وإلغاء صلاحية جميع الرموز المفتوحة فوراً. سيتطلب الدخول مجدداً."
                            )}
                        </p>

                        <div className="pt-4 mt-5 flex items-center justify-end gap-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => setShowGlobalLogoutModal(false)}
                                className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={handleGlobalLogout}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer shadow-sm transition disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{isRevoking ? t("Terminating...", "جاري الخروج...") : t("Yes, Logout All Devices", "نعم، خروج من كل الأجهزة")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {revokeUserTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget && !isRevoking) setRevokeUserTarget(null); }}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in text-zinc-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Log Out User Everywhere?", "تسجيل خروج المستخدم من كل أجهزته؟")}
                                    </h3>
                                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        @{revokeUserTarget.username}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => setRevokeUserTarget(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {t(
                                `Are you sure you want to terminate all active sessions for @${revokeUserTarget.username}? They will be immediately logged out on all their phones and computers.`,
                                `هل أنت متأكد من إنهاء جلسات @${revokeUserTarget.username}؟ سيتم طرده وتسجيل خروجه فوراً من جميع هواتفه وأجهزته.`
                            )}
                        </p>

                        <div className="pt-4 mt-5 flex items-center justify-end gap-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => setRevokeUserTarget(null)}
                                className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={handleRevokeUser}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs cursor-pointer shadow-sm transition disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{isRevoking ? t("Logging Out...", "جاري إنهاء الجلسات...") : t("Confirm Log Out", "تأكيد تسجيل الخروج")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteUser}
                itemName={deleteTarget?.name || ''}
                isDeleting={isDeleting}
            />
        </div>
    );
}
