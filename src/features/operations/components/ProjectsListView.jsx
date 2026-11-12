'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ProjectDetailView } from '@/features/operations/components/ProjectDetailView';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { PageDashboardSkeleton } from '@/components/ui/Skeleton';
import { useApp } from '@/shared/context/AppContext.js';
import { Edit2, Trash2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchProjects, createProject, updateProject, addProjectComment, deleteProject } from '@/features/operations/api/projects.api.js';
import { extractProjectDescriptionAndPath, parseProjectAttachments, parseProjectComments } from '@/features/operations/utils/projects.logic.js';

export default function ProjectsListView() {
    const { t, setActiveDashboard } = useApp();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [description, setDescription] = useState('');
    const [techStack, setTechStack] = useState('');
    const [status, setStatus] = useState('active');
    const [submitting, setSubmitting] = useState(false);

    const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCompany, setEditCompany] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editTechStack, setEditTechStack] = useState('');
    const [editStatus, setEditStatus] = useState('active');
    const [updatingProject, setUpdatingProject] = useState(false);

    const [selectedProject, setSelectedProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'company' | 'freelance' | 'learning' | 'personal'
    const [projectSearch, setProjectSearch] = useState('');

    const loadProjects = useCallback(async () => {
        try {
            const data = await fetchProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setActiveDashboard('tasks');
        fetchProjects()
            .then(data => {
                setProjects(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [setActiveDashboard]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await createProject({
                name,
                company,
                start_date: startDate,
                end_date: endDate,
                description,
                tech_stack: techStack,
                status
            });
            if (data?.success || data?.ok || data?.id) {
                await loadProjects();
                setName('');
                setCompany('');
                setStartDate('');
                setEndDate('');
                setDescription('');
                setTechStack('');
                setIsAddProjectOpen(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEditModal = (p) => {
        setEditingId(p.id);
        setEditName(p.name || '');
        setEditCompany(p.company || '');
        setEditStartDate(p.start_date ? String(p.start_date).split('T')[0] : '');
        setEditEndDate(p.end_date ? String(p.end_date).split('T')[0] : '');
        setEditDescription(p.description || '');
        setEditTechStack(p.tech_stack || '');
        setEditStatus(p.status || 'active');
        setIsEditProjectOpen(true);
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        setUpdatingProject(true);
        try {
            const data = await updateProject({
                id: editingId,
                name: editName,
                company: editCompany,
                start_date: editStartDate || null,
                end_date: editEndDate || null,
                description: editDescription,
                tech_stack: editTechStack,
                status: editStatus
            });
            if (data && (data.success || data.id || !data.error)) {
                await loadProjects();
                setIsEditProjectOpen(false);
                if (selectedProject && selectedProject.id === editingId) {
                    setSelectedProject(prev => ({
                        ...prev,
                        name: editName,
                        company: editCompany,
                        start_date: editStartDate,
                        end_date: editEndDate,
                        description: editDescription,
                        tech_stack: editTechStack,
                        status: editStatus
                    }));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingProject(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete?.id) return;
        setIsDeleting(true);
        try {
            const data = await deleteProject(projectToDelete.id);
            if (data && (data.success || !data.error)) {
                await loadProjects();
                if (selectedProject && selectedProject.id === projectToDelete.id) {
                    setSelectedProject(null);
                }
                setProjectToDelete(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProjects = projects.filter(p => {
        const companyStr = (p.company || '').toLowerCase();
        const matchesCategory =
            categoryFilter === 'all' ? true :
                categoryFilter === 'freelance' ? (companyStr.includes('freelance') || p.company?.includes('فريلانس')) :
                    categoryFilter === 'company' ? (companyStr.includes('oncreation') || companyStr.includes('mitch') || companyStr.includes('dayeri') || p.company?.includes('شركة') || companyStr.includes('ecom')) :
                        categoryFilter === 'personal' ? (companyStr.includes('personal') || p.company?.includes('خاص') || companyStr.includes('orbit') || companyStr.includes('codex')) :
                            categoryFilter === 'learning' ? (companyStr.includes('learning') || p.company?.includes('تعلم') || (p.name || '').startsWith('CS -')) : true;

        const matchesSearch = !projectSearch.trim() ||
            (p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
            companyStr.includes(projectSearch.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
            (p.tech_stack || '').toLowerCase().includes(projectSearch.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    if (loading && projects.length === 0) {
        return <PageDashboardSkeleton kpiCount={4} />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-24 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-zinc-900 dark:text-white leading-tight flex items-center gap-2.5">
                        <span>{t("Projects Management", "إدارة المشاريع")}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                            {filteredProjects.length}
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-normal">
                        {t("All local projects categorized by company, freelance, learning, and personal projects.", "كافة المشاريع المحلية مصنفة بدقة: شركات، فريلانس، تعلم، وخاص.")}
                    </p>
                </div>

                <Button variant="default" size="default" onClick={() => setIsAddProjectOpen(true)} className="cursor-pointer shrink-0">
                    <span className="font-bold text-base leading-none">+</span>
                    <span>{t("Create New Project", "إضافة مشروع جديد")}</span>
                </Button>
            </div>

            {/* Filter Pills & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-[#E5E7EB] dark:border-zinc-800">
                    {[
                        { id: 'all', label: t('All Projects', 'الكل'), count: projects.length },
                        { id: 'company', label: t('Companies', 'شركات'), count: projects.filter(p => (p.company || '').toLowerCase().includes('oncreation') || (p.company || '').toLowerCase().includes('mitch') || (p.company || '').toLowerCase().includes('dayeri') || (p.company || '').includes('شركة') || (p.company || '').toLowerCase().includes('ecom')).length },
                        { id: 'freelance', label: t('Freelance', 'فريلانس'), count: projects.filter(p => (p.company || '').toLowerCase().includes('freelance') || (p.company || '').includes('فريلانس')).length },
                        { id: 'personal', label: t('Personal', 'خاص'), count: projects.filter(p => (p.company || '').toLowerCase().includes('personal') || (p.company || '').includes('خاص') || (p.company || '').toLowerCase().includes('orbit') || (p.company || '').toLowerCase().includes('codex')).length },
                        { id: 'learning', label: t('Learning', 'تعلم'), count: projects.filter(p => (p.company || '').toLowerCase().includes('learning') || (p.company || '').includes('تعلم') || (p.name || '').startsWith('CS -')).length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setCategoryFilter(tab.id)}
                            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${categoryFilter === tab.id
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        placeholder={t('Search projects or tech...', 'بحث في المشاريع أو التقنيات...')}
                        className="bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 rounded-xl min-h-[44px] px-4 py-2 text-xs text-zinc-900 dark:text-white outline-none w-full sm:w-64 focus:border-primary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/40 dark:bg-zinc-900/40 space-y-2">
                        <Folder className="w-10 h-10 mx-auto text-zinc-400" />
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            {t("No projects found", "لا توجد مشاريع مطابقة")}
                        </p>
                    </div>
                ) : (
                    filteredProjects.map((p, idx) => {
                        const parsedFiles = parseProjectAttachments(p.attachments || p.files);
                        const parsedComments = parseProjectComments(p.comments);
                        const { cleanText, localPath } = extractProjectDescriptionAndPath(p?.description);

                        return (
                            <div
                                key={p.id || idx}
                                className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#BC5C29] block mb-0.5">
                                                🏢 {p.company || t('Client Project', 'مشروع عميل')}
                                            </span>
                                            <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-snug">
                                                {p.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                                                p.status === 'in_progress' ? 'bg-[#BC5C29]/20 text-[#BC5C29] dark:text-[#BC5C29] border border-[#BC5C29]/30' :
                                                    p.status === 'on_hold' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                                                        'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                                }`}>
                                                {p.status === 'on_hold' ? t('ON HOLD', 'معلق') :
                                                    p.status === 'in_progress' ? t('IN PROGRESS', 'قيد التنفيذ') :
                                                        p.status === 'completed' ? t('COMPLETED', 'مكتمل') :
                                                            t('ACTIVE', 'نشط')}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenEditModal(p);
                                                }}
                                                className="text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
                                                title={t("Edit Project", "تعديل المشروع")}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProjectToDelete(p);
                                                }}
                                                className="text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition font-bold cursor-pointer"
                                                title={t("Delete Project", "حذف المشروع")}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                            {cleanText}
                                        </p>
                                        {localPath && (
                                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 text-[11px] font-mono">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Folder className="w-3.5 h-3.5 text-[#BC5C29] shrink-0" />
                                                    <span className="truncate text-zinc-700 dark:text-zinc-300" title={localPath}>
                                                        {localPath.split(/[/\\]/).slice(-2).join('/')}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard?.writeText(localPath);
                                                    }}
                                                    className="text-[10px] font-bold text-[#BC5C29] shrink-0 px-2 py-0.5 rounded bg-[#BC5C29]/10 dark:bg-[#BC5C29]/20 transition cursor-pointer"
                                                    title={t("Copy directory path", "نسخ مسار المجلد")}
                                                >
                                                    {t("Copy Path", "نسخ المسار")}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                        <div>
                                            <span className="text-[9px] text-zinc-400 uppercase font-bold block">{t("Start Date", "تاريخ البدء")}</span>
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                                {p.start_date ? String(p.start_date).split('T')[0] : 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-zinc-400 uppercase font-bold block">{t("End Date", "تاريخ النهاية")}</span>
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                                🏁 {p.end_date ? String(p.end_date).split('T')[0] : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                    <span className="text-[10px] text-zinc-400 font-bold">
                                        {(parsedFiles.length > 0 || parsedComments.length > 0) ? (
                                            <>
                                                {parsedFiles.length > 0 && <span>📎 {parsedFiles.length} {parsedFiles.length === 1 ? t('file', 'ملف') : t('files', 'ملفات')}</span>}
                                                {parsedFiles.length > 0 && parsedComments.length > 0 && <span> • </span>}
                                                {parsedComments.length > 0 && <span>💬 {parsedComments.length} {parsedComments.length === 1 ? t('note', 'ملاحظة') : t('notes', 'ملاحظات')}</span>}
                                            </>
                                        ) : (
                                            <span className="text-zinc-400/50 font-medium">{t("No attachments yet", "لا توجد مرفقات بعد")}</span>
                                        )}
                                    </span>
                                    <button
                                        onClick={() => setSelectedProject(p)}
                                        className="text-xs font-bold text-[#BC5C29] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>{t("Details & Files", "التفاصيل والملفات")}</span> &rarr;
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {isAddProjectOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsAddProjectOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-white my-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Folder className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{t("Create New Project", "إضافة مشروع جديد")}</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Define project scope, timeline, tech stack, and client details.", "حدد نطاق المشروع والجدول الزمني والتقنيات المستخدمة.")}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddProjectOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject} className="space-y-4 font-sans">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Project Name", "اسم المشروع")} <span className="text-red-500">*</span></label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t("e.g. Next.js SaaS", "مثال: منصة ساس")} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Company / Client", "الشركة / العميل")}</label>
                                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder={t("e.g. Acme Corp", "مثال: شركة أكوا")} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Start Date", "تاريخ البدء")}</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("End Date", "تاريخ النهاية")}</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Status", "الحالة")}</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition cursor-pointer">
                                    <option value="active">{t("Active", "نشط")}</option>
                                    <option value="in_progress">{t("In Progress", "قيد التنفيذ")}</option>
                                    <option value="on_hold">{t("On Hold", "معلق")}</option>
                                    <option value="completed">{t("Completed", "مكتمل")}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Tech Stack", "التقنيات المستخدمة")}</label>
                                <input type="text" value={techStack} onChange={e => setTechStack(e.target.value)} placeholder="Next.js, Node.js, PostgreSQL..." className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Description", "الوصف")}</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder={t("Brief description or project requirements...", "وصف مختصر أو متطلبات المشروع...")} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition resize-none" />
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddProjectOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
                                    {submitting ? t("Saving...", "جاري الحفظ...") : t("Save Project", "حفظ المشروع")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditProjectOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsEditProjectOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-white my-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Edit2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{t("Edit Project Details", "تعديل بيانات المشروع")}</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Update project status, dates, technologies, and overview.", "تحديث حالة المشروع والتواريخ والتقنيات والوصف.")}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditProjectOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProject} className="space-y-4 font-sans">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Project Name", "اسم المشروع")} <span className="text-red-500">*</span></label>
                                    <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Company / Client", "الشركة / العميل")}</label>
                                    <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Start Date", "تاريخ البدء")}</label>
                                    <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("End Date", "تاريخ النهاية")}</label>
                                    <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Status", "الحالة")}</label>
                                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition cursor-pointer">
                                    <option value="active">{t("Active", "نشط")}</option>
                                    <option value="in_progress">{t("In Progress", "قيد التنفيذ")}</option>
                                    <option value="on_hold">{t("On Hold", "معلق")}</option>
                                    <option value="completed">{t("Completed", "مكتمل")}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Tech Stack", "التقنيات المستخدمة")}</label>
                                <input type="text" value={editTechStack} onChange={e => setEditTechStack(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Description", "الوصف")}</label>
                                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows="3" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition resize-none" />
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsEditProjectOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button type="submit" disabled={updatingProject} className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
                                    {updatingProject ? t("Updating...", "جاري التحديث...") : t("Update Project", "تحديث المشروع")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedProject && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedProject(null); }}
                >
                    <div
                        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl animate-scale-up cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ProjectDetailView
                            breadcrumbs={[
                                { label: t("Projects Overview", "إدارة المشاريع"), href: "/projects" },
                                { label: selectedProject.name, href: "#" }
                            ]}
                            title={selectedProject.name}
                            status={selectedProject.status || "Active"}
                            showAssignee={false}
                            showTable={false}
                            dateRange={{
                                start: selectedProject.start_date ? String(selectedProject.start_date).split('T')[0] : "2026-01-01",
                                end: selectedProject.end_date ? String(selectedProject.end_date).split('T')[0] : "Ongoing"
                            }}
                            tags={[
                                { label: selectedProject.company || "FreeLance", variant: "default" },
                                { label: selectedProject.tech_stack || "Next.js", variant: "secondary" }
                            ]}
                            description={selectedProject.description || t("High impact project deliverable.", "مشروع تطوير رئيسي بالسيستم.")}
                            attachments={parseProjectAttachments(selectedProject.attachments)}
                            commentsFeed={parseProjectComments(selectedProject.comments)}
                            onClose={() => setSelectedProject(null)}
                            onEdit={() => {
                                handleOpenEditModal(selectedProject);
                                setSelectedProject(null);
                            }}
                            onDelete={() => setProjectToDelete(selectedProject)}
                        />
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!projectToDelete}
                title={t("Delete Project", "حذف المشروع")}
                itemName={projectToDelete?.name || ''}
                message={t(
                    `Are you sure you want to delete "${projectToDelete?.name}"? All associated files, briefs, and comments will be permanently removed.`,
                    `هل أنت متأكد من رغبتك في حذف مشروع "${projectToDelete?.name}"؟ سيتم حذف كافة البيانات والملفات والملاحظات المرتبطة به نهائياً.`
                )}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
