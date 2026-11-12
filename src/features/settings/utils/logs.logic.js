import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    UserPlus,
    UserCheck,
    KeyRound
} from 'lucide-react';

export function getActionBadge(action) {
    switch (action) {
        case 'LOGIN_SUCCESS':
            return { label: 'Login Success', color: 'bg-[#BC5C29]/15 text-[#BC5C29] border-[#BC5C29]/30', icon: CheckCircle2 };
        case 'LOGIN_FAILED':
            return { label: 'Failed Password', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle };
        case 'LOGIN_BLOCKED':
            return { label: 'Suspended Access', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle };
        case 'LOGOUT':
            return { label: 'Logout', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', icon: KeyRound };
        case 'USER_CREATED':
            return { label: 'User Created', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: UserPlus };
        case 'USER_UPDATED':
            return { label: 'User Modified', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: UserCheck };
        case 'PASSWORD_CHANGED':
            return { label: 'Password Reset', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: KeyRound };
        default:
            return { label: action, color: 'bg-[#6E5A4E]/15 text-[#FBF3E9] border-[#BC5C29]/25', icon: Activity };
    }
}

export function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}
