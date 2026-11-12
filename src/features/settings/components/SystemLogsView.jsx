'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search,
    RefreshCw
} from 'lucide-react';
import { fetchAuthLogs } from '@/features/settings/api/logs.api.js';
import { getActionBadge, formatDate } from '@/features/settings/utils/logs.logic.js';

const TABS = [
    { value: 'all', label: 'All' },
    { value: 'added', label: 'Added' },
    { value: 'improved', label: 'Improved' },
    { value: 'fixed', label: 'Fixed' }
];

function getLogCategory(log) {
    const action = (log.action || '').toUpperCase();
    const status = (log.status || '').toLowerCase();

    if (
        status === 'failed' ||
        status === 'warning' ||
        action === 'LOGIN_FAILED' ||
        action === 'LOGIN_BLOCKED'
    ) {
        return 'Fixed';
    }

    if (
        action === 'USER_UPDATED' ||
        action === 'PASSWORD_CHANGED' ||
        action === 'LOGOUT'
    ) {
        return 'Improved';
    }

    return 'Added';
}

function getPillClass(category) {
    if (category === 'Added') {
        return 'bg-zinc-900 text-white dark:bg-[#BC5C29] dark:text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold';
    }
    if (category === 'Improved') {
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold';
    }
    return 'border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold';
}

export default function SystemLogsView() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ totalToday: 0, successToday: 0, failedToday: 0, activeUsers: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '30',
                action: 'all',
                status: 'all',
                search: search.trim()
            });

            const data = await fetchAuthLogs(params);
            if (data?.success || data?.ok) {
                setLogs(data.logs || data.data?.logs || []);
                setPagination(data.pagination || data.data?.pagination || { page: 1, limit: 30, total: 0, totalPages: 1 });
                setStats(data.stats || data.data?.stats || { totalToday: 0, successToday: 0, failedToday: 0, activeUsers: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const params = new URLSearchParams({
            page: '1',
            limit: '30',
            action: 'all',
            status: 'all',
            search: search.trim()
        });

        fetchAuthLogs(params)
            .then(data => {
                if (data?.success || data?.ok) {
                    setLogs(data.logs || data.data?.logs || []);
                    setPagination(data.pagination || data.data?.pagination || { page: 1, limit: 30, total: 0, totalPages: 1 });
                    setStats(data.stats || data.data?.stats || { totalToday: 0, successToday: 0, failedToday: 0, activeUsers: 0 });
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch logs:', err);
                setLoading(false);
            });
    }, [search]);

    const filteredLogs = useMemo(() => {
        if (activeTab === 'all') return logs;
        return logs.filter(log => getLogCategory(log).toLowerCase() === activeTab);
    }, [logs, activeTab]);

    return (
        <div className="max-w-4xl mx-auto py-4 space-y-6 pb-16">
            {/* Header */}
            <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                        Changelog &amp; Telemetry Logs
                    </h1>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                            Today: <strong className="text-zinc-900 dark:text-white">{stats.totalToday}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#BC5C29]/10 text-[#BC5C29] border border-[#BC5C29]/20">
                            Active: <strong>{stats.activeUsers}</strong>
                        </span>
                    </div>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Everything logged across your workspace, filterable by event type.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 self-start">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setActiveTab(tab.value)}
                                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                                    isActive
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search user, IP, or client..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchLogs(pagination.page)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#BC5C29] ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Entries List */}
            <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 border-t border-zinc-200/80 dark:border-zinc-800/80">
                {loading ? (
                    <div className="py-16 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#BC5C29]" />
                        <span>Streaming telemetry &amp; security events...</span>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="py-16 text-center text-sm text-zinc-400">
                        No log entries found matching your filter criteria.
                    </div>
                ) : (
                    filteredLogs.map((log, idx) => {
                        const badge = getActionBadge(log.action);
                        const category = getLogCategory(log);
                        const pillClass = getPillClass(category);
                        const versionTag = log.id ? `2.4.${log.id}` : `2.4.${idx}`;

                        return (
                            <div
                                key={log.id || idx}
                                className="py-6 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-12 transition"
                            >
                                {/* Left column: Version/ID + Date */}
                                <div className="sm:w-36 shrink-0">
                                    <div className="font-mono text-xs font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                                        {versionTag}
                                    </div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {formatDate(log.created_at)}
                                    </div>
                                </div>

                                {/* Right column: Badge + Title + Description */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className={pillClass}>
                                            {category}
                                        </span>
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                            {badge.label} — {log.username || 'System'}
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Event recorded from origin IP <span className="font-mono text-zinc-700 dark:text-zinc-300">{log.ip_address || '127.0.0.1'}</span> with status <span className="font-semibold text-[#BC5C29] uppercase">{log.status || 'logged'}</span> · Client: {log.user_agent || 'System Telemetry Agent'}.
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                        Page <strong className="text-zinc-900 dark:text-white">{pagination.page}</strong> of {pagination.totalPages} ({pagination.total} entries)
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={pagination.page <= 1}
                            onClick={() => fetchLogs(pagination.page - 1)}
                            className="px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchLogs(pagination.page + 1)}
                            className="px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
