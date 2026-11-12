'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { ProjectDetailView } from '@/features/operations/components/ProjectDetailView';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import {
    UserCheck,
    Search,
    Plus,
    Trash2,
    Edit3,
    MessageSquare,
    Paperclip,
    X,
    Check,
    Mail,
    Phone,
    Calendar,
    DollarSign,
    MapPin,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { Button } from '@/components/ui/button';
import {
    fetchLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    fetchLeadDetails,
    uploadFileToServer,
    addLeadAttachment,
    addLeadComment,
    deleteLeadComment,
    deleteLeadAttachment
} from '@/features/operations/api/leads.api.js';
import { parseNotesContent, assembleNotes, getLeadWhatsAppUrl, filterLeads, getLeadStatusStyle } from '@/features/operations/utils/leads.logic.js';
import { LEAD_STATUS_OPTIONS, LEAD_EDIT_STATUS_OPTIONS, DEFAULT_LEAD_FORM } from '@/features/operations/constants/leads.constants.js';

export default function LeadsCRMPage() {
    const { t } = useApp();

    const [leads, setLeads] = useState([]);
    const [leadSearch, setLeadSearch] = useState('');
    const [leadStatusFilter, setLeadStatusFilter] = useState('all');
    const [loadingLeads, setLoadingLeads] = useState(true);

    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
    const [leadName, setLeadName] = useState('');
    const [leadCompany, setLeadCompany] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadProjectType, setLeadProjectType] = useState('');
    const [leadBudget, setLeadBudget] = useState('');
    const [leadCountry, setLeadCountry] = useState('');
    const [leadStatus, setLeadStatus] = useState('new');
    const [leadNotes, setLeadNotes] = useState('');
    const [submittingLead, setSubmittingLead] = useState(false);

    const [selectedLead, setSelectedLead] = useState(null);
    const [leadComments, setLeadComments] = useState([]);
    const [newLeadComment, setNewLeadComment] = useState('');
    const [leadAttachments, setLeadAttachments] = useState([]);
    const [commentPendingFiles, setCommentPendingFiles] = useState([]);
    const [addingLeadComment, setAddingLeadComment] = useState(false);

    const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
    const [editLeadId, setEditLeadId] = useState(null);
    const [editLeadName, setEditLeadName] = useState('');
    const [editLeadCompany, setEditLeadCompany] = useState('');
    const [editLeadEmail, setEditLeadEmail] = useState('');
    const [editLeadPhone, setEditLeadPhone] = useState('');
    const [editLeadProjectType, setEditLeadProjectType] = useState('');
    const [editLeadBudget, setEditLeadBudget] = useState('');
    const [editLeadCountry, setEditLeadCountry] = useState('');
    const [editLeadStatus, setEditLeadStatus] = useState('new');
    const [editLeadNotes, setEditLeadNotes] = useState('');
    const [editLeadTimeline, setEditLeadTimeline] = useState('');
    const [editLeadFeatures, setEditLeadFeatures] = useState([]);
    const [editLeadPureNotes, setEditLeadPureNotes] = useState('');
    const [newFeatureInput, setNewFeatureInput] = useState('');
    const [updatingLead, setUpdatingLead] = useState(false);

    const [leadToDelete, setLeadToDelete] = useState(null);
    const [isDeletingLead, setIsDeletingLead] = useState(false);
    const [deleteRequest, setDeleteRequest] = useState(null);
    const [isDeletingRelated, setIsDeletingRelated] = useState(false);

    const loadLeads = useCallback(async () => {
        setLoadingLeads(true);
        try {
            const data = await fetchLeads();
            setLeads(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setLeads([]);
        } finally {
            setLoadingLeads(false);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;
        fetchLeads()
            .then(data => {
                if (!isCancelled) {
                    setLeads(Array.isArray(data) ? data : []);
                    setLoadingLeads(false);
                }
            })
            .catch(e => {
                console.error(e);
                if (!isCancelled) {
                    setLeads([]);
                    setLoadingLeads(false);
                }
            });
        return () => {
            isCancelled = true;
        };
    }, []);

    const handleCreateLead = async (e) => {
        e.preventDefault();
        setSubmittingLead(true);
        try {
            const data = await createLead({
                name: leadName,
                company: leadCompany,
                email: leadEmail,
                phone: leadPhone,
                project_type: leadProjectType,
                budget: leadBudget,
                country: leadCountry,
                status: leadStatus,
                notes: leadNotes
            });
            if (data?.success || data?.ok) {
                await loadLeads();
                setIsAddLeadOpen(false);
                setLeadName('');
                setLeadCompany('');
                setLeadEmail('');
                setLeadPhone('');
                setLeadNotes('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingLead(false);
        }
    };

    const handleOpenEditLead = (l) => {
        setEditLeadId(l.id);
        setEditLeadName(l.name || '');
        setEditLeadCompany(l.company || '');
        setEditLeadEmail(l.email || '');
        setEditLeadPhone(l.phone || '');
        setEditLeadProjectType(l.project_type || '');
        setEditLeadBudget(l.budget || '');
        setEditLeadCountry(l.country || '');
        setEditLeadStatus(l.status || 'new');
        setEditLeadNotes(l.notes || '');

        const { features, timeline, pureNotes } = parseNotesContent(l.notes);
        setEditLeadFeatures(features);
        setEditLeadTimeline(timeline);
        setEditLeadPureNotes(pureNotes);
        setNewFeatureInput('');
        setIsEditLeadOpen(true);
    };

    const handleUpdateLead = async (e) => {
        e.preventDefault();
        setUpdatingLead(true);
        try {
            const finalNotes = assembleNotes(editLeadFeatures, editLeadTimeline, editLeadPureNotes, editLeadNotes);

            const data = await updateLead({
                id: editLeadId,
                name: editLeadName,
                company: editLeadCompany,
                email: editLeadEmail,
                phone: editLeadPhone,
                project_type: editLeadProjectType,
                budget: editLeadBudget,
                country: editLeadCountry,
                status: editLeadStatus,
                notes: finalNotes
            });
            if (data?.success || data?.ok) {
                await loadLeads();
                if (selectedLead && selectedLead.id === editLeadId) {
                    setSelectedLead(prev => ({
                        ...prev,
                        name: editLeadName,
                        company: editLeadCompany,
                        email: editLeadEmail,
                        phone: editLeadPhone,
                        project_type: editLeadProjectType,
                        budget: editLeadBudget,
                        country: editLeadCountry,
                        status: editLeadStatus,
                        notes: finalNotes
                    }));
                }
                setIsEditLeadOpen(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingLead(false);
        }
    };

    const handleUpdateLeadStatus = async (leadId, newStatus) => {
        try {
            const data = await updateLeadStatus(leadId, newStatus);
            if (data?.success || data?.ok) {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleConfirmDelete = async () => {
        if (!leadToDelete) return;
        setIsDeletingLead(true);
        try {
            const data = await deleteLead(leadToDelete.id);
            if (data?.success || data?.ok) {
                setLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
                if (selectedLead?.id === leadToDelete.id) {
                    setSelectedLead(null);
                }
                setLeadToDelete(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeletingLead(false);
        }
    };

    const handleOpenLeadDetails = async (lead) => {
        setSelectedLead(lead);
        setLeadAttachments([]);
        setLeadComments([]);
        setCommentPendingFiles([]);
        try {
            const data = await fetchLeadDetails(lead.id);
            const leadData = data?.data || data;
            if (leadData && leadData.id) {
                setSelectedLead(prev => ({ ...prev, ...leadData }));
            }
            if (Array.isArray(leadData?.comments)) {
                setLeadComments(leadData.comments);
            } else {
                setLeadComments([]);
            }
            if (Array.isArray(leadData?.allAttachments)) {
                setLeadAttachments(leadData.allAttachments);
            } else if (Array.isArray(leadData?.attachments)) {
                setLeadAttachments(leadData.attachments);
            } else {
                setLeadAttachments([]);
            }
        } catch (e) {
            console.error('[handleOpenLeadDetails Error]:', e);
        }
    };

    const handleFileUploadToLead = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('entityType', 'leads');
            if (selectedLead) formData.append('entityName', selectedLead.name);
            try {
                const data = await uploadFileToServer(formData);
                if (data.success && selectedLead) {
                    const filePath = data.filePath || data.driveUrl || (data.filename ? `/uploads/${data.filename}` : '#');
                    await addLeadAttachment(selectedLead.id, file.name, filePath);
                }
            } catch (err) {
                console.error(err);
            }
        }
        if (selectedLead) {
            handleOpenLeadDetails(selectedLead);
        }
    };

    const handleAddLeadComment = async (e) => {
        e.preventDefault();
        if (!newLeadComment.trim() && commentPendingFiles.length === 0) return;
        setAddingLeadComment(true);
        try {
            const data = await addLeadComment(selectedLead.id, newLeadComment, commentPendingFiles);
            if (data.success) {
                setNewLeadComment('');
                setCommentPendingFiles([]);
                handleOpenLeadDetails(selectedLead);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAddingLeadComment(false);
        }
    };

    const handleDeleteLeadComment = async (commentId) => {
        setDeleteRequest({ type: 'comment', id: commentId });
    };

    const handleDeleteLeadAttachment = async (attachmentId) => {
        setDeleteRequest({ type: 'attachment', id: attachmentId });
    };

    const confirmDeleteRelated = async () => {
        if (!deleteRequest) return;
        setIsDeletingRelated(true);
        try {
            const data = deleteRequest.type === 'comment'
                ? await deleteLeadComment(deleteRequest.id)
                : await deleteLeadAttachment(deleteRequest.id);
            if (data.success) {
                handleOpenLeadDetails(selectedLead);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDeleteRequest(null);
            setIsDeletingRelated(false);
        }
    };

    const filteredLeads = filterLeads(leads, leadSearch, leadStatusFilter);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
                        <UserCheck className="text-[#BC5C29]" size={28} />
                        <span>{t("Leads & Clients CRM", "إدارة العملاء والطلبات CRM")}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                        {t("Manage client leads, meeting bookings, project proposals, files, and activity logs.", "متابعة استفسارات العملاء، طلبات المشاريع، وحجوزات المواعيد والملفات المرفقة.")}
                    </p>
                </div>

                <Button variant="default" size="default" onClick={() => setIsAddLeadOpen(true)} className="cursor-pointer shrink-0">
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("Add New Client Lead", "إضافة عميل جديد")}</span>
                </Button>
            </div>

            {/* Pipeline Quality KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {[
                    { label: t("Total Pipeline Leads", "إجمالي العملاء"), value: leads.length, tone: "text-zinc-900 dark:text-white" },
                    { label: t("New & Contacted", "جديد وقيد التواصل"), value: leads.filter(l => l.status === 'new' || l.status === 'contacted').length, tone: "text-sky-600 dark:text-sky-400" },
                    { label: t("Active Proposals", "عروض الأسعار النشطة"), value: leads.filter(l => l.status === 'proposal').length, tone: "text-violet-600 dark:text-violet-400" },
                    { label: t("Won Deals", "الصفقات المكتملة"), value: leads.filter(l => l.status === 'won').length, tone: "text-emerald-600 dark:text-emerald-400" },
                ].map((kpi, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[#E5E7EB] dark:border-zinc-800 bg-white dark:bg-[#1A1A1A] shadow-xs">
                        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">{kpi.label}</span>
                        <span className={`text-xl sm:text-2xl font-black font-mono tabular-nums mt-1 block ${kpi.tone}`}>{kpi.value}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-[#E5E7EB] dark:border-zinc-800">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <Search size={16} className="text-zinc-400 shrink-0" />
                        <input
                            type="text"
                            value={leadSearch}
                            onChange={e => setLeadSearch(e.target.value)}
                            placeholder={t("Search leads by client, company, or project...", "البحث عن عميل أو شركة أو نوع المشروع...")}
                            className="bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 min-h-[44px] px-3.5 py-2 rounded-xl text-xs flex-1 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-zinc-400 shrink-0">{t("Status Filter:", "تصفية الحالة:")}</span>
                        <select
                            value={leadStatusFilter}
                            onChange={e => setLeadStatusFilter(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                        >
                            <option value="all">{t("All Statuses", "جميع الحالات")}</option>
                            <option value="new">{t("New", "جديد")}</option>
                            <option value="contacted">{t("Contacted", "تم التواصل")}</option>
                            <option value="proposal">{t("Proposal", "عرض سعر")}</option>
                            <option value="won">{t("Won", "تم الاتفاق")}</option>
                            <option value="lost">{t("Lost", "ملغي")}</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
                    {/* Mobile Card View (md:hidden) */}
                    <div className="md:hidden space-y-3">
                        {loadingLeads ? (
                            <div className="py-8 text-center text-zinc-400 font-bold text-xs">
                                Loading clients &amp; leads...
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="py-8 text-center text-zinc-400 font-bold text-xs">
                                {t("No client leads found. Click '+ Add New Client Lead' to create one.", "لا توجد طلبات عملاء. اضغط '+ إضافة عميل جديد' لإنشاء طلب.")}
                            </div>
                        ) : (
                            filteredLeads.map(l => (
                                <div
                                    key={`mob-lead-${l.id}`}
                                    onClick={() => handleOpenLeadDetails(l)}
                                    className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-3 active:scale-99 transition cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-extrabold text-zinc-900 dark:text-white text-sm truncate">{l.name}</div>
                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">{l.company || 'Private Client'} · {l.country}</div>
                                        </div>
                                        <div className="text-end shrink-0">
                                            <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">{l.budget}</div>
                                            <div className="text-[10px] text-zinc-400 font-medium">{l.project_type}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                                        <div className="relative inline-flex items-center" onClick={e => e.stopPropagation()}>
                                            <select
                                                value={l.status}
                                                onChange={e => handleUpdateLeadStatus(l.id, e.target.value)}
                                                className={cn(
                                                    "text-[10.5px] font-extrabold uppercase px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition appearance-none pe-5",
                                                    l.status === 'won' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                                                        l.status === 'proposal' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' :
                                                            l.status === 'contacted' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' :
                                                                l.status === 'lost' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                                                                    'bg-[#BC5C29]/10 text-[#BC5C29] border-[#BC5C29]/30'
                                                )}
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="proposal">Proposal</option>
                                                <option value="won">Won</option>
                                                <option value="lost">Lost</option>
                                            </select>
                                            <span className="pointer-events-none absolute end-1.5 text-[8px] opacity-60">▼</span>
                                        </div>

                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                            {l.phone && (
                                                <a
                                                    href={getLeadWhatsAppUrl(l)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl border border-[#BC5C29]/30 bg-[#BC5C29]/10 text-[#BC5C29] transition active:scale-95"
                                                    title={`WhatsApp (${l.phone})`}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleOpenLeadDetails(l)}
                                                className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                                            >
                                                <Paperclip className="w-3 h-3 text-zinc-400" />
                                                <span>{t("Details", "التفاصيل")}</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditLead(l)}
                                                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 transition"
                                                title={t("Edit Lead", "تعديل")}
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setLeadToDelete(l)}
                                                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition"
                                                title={t("Delete Lead", "حذف")}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table (hidden md:block) */}
                    <div className="hidden md:block overflow-x-auto max-h-[640px]">
                        <table className="w-full min-w-[680px] text-start text-xs border-collapse">
                            <thead className="sticky top-0 z-10 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xs">
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10.5px] text-zinc-500 dark:text-zinc-400 font-bold uppercase">
                                    <th className="p-3.5 text-start">{t("Client", "العميل")}</th>
                                    <th className="p-3.5 text-start">{t("Project Type", "نوع المشروع")}</th>
                                    <th className="p-3.5 text-end">{t("Budget", "الميزانية")}</th>
                                    <th className="p-3.5 text-start">{t("Country", "الدولة")}</th>
                                    <th className="p-3.5 text-start">{t("Status", "الحالة")}</th>
                                    <th className="p-3.5 text-end">{t("Actions", "الإجراءات")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingLeads ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-zinc-400 font-bold">
                                            Loading clients &amp; leads...
                                        </td>
                                    </tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-zinc-400 font-bold">
                                            No client leads found. Click &quot;+ Add New Client Lead&quot; to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map(l => (
                                        <tr key={l.id} onClick={() => handleOpenLeadDetails(l)} className="border-b border-zinc-100 dark:border-zinc-850/60 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer">
                                            <td className="p-3.5">
                                                <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{l.name}</div>
                                                <div className="text-[10px] text-zinc-400 font-medium">{l.company || 'Private Client'}</div>
                                            </td>
                                            <td className="p-3.5 text-zinc-600 dark:text-zinc-300 font-semibold text-xs">{l.project_type}</td>
                                            <td className="p-3.5 text-right font-mono font-black text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                                                {l.budget}
                                            </td>
                                            <td className="p-3.5 text-xs text-zinc-600 dark:text-zinc-300">{l.country}</td>
                                            <td className="p-3.5">
                                                <div className="relative inline-flex items-center" onClick={e => e.stopPropagation()}>
                                                    <select
                                                        value={l.status}
                                                        onChange={e => handleUpdateLeadStatus(l.id, e.target.value)}
                                                        className={cn(
                                                            "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition appearance-none pe-5",
                                                            l.status === 'won' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                                                                l.status === 'proposal' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' :
                                                                    l.status === 'contacted' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' :
                                                                        l.status === 'lost' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                                                                            'bg-[#BC5C29]/10 text-[#BC5C29] border-[#BC5C29]/30'
                                                        )}
                                                    >
                                                        <option value="new" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">New</option>
                                                        <option value="contacted" className="bg-white dark:bg-zinc-900 text-[#BC5C29]">Contacted</option>
                                                        <option value="proposal" className="bg-white dark:bg-zinc-900 text-[#BC5C29]">Proposal</option>
                                                        <option value="won" className="bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400">Won</option>
                                                        <option value="lost" className="bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400">Lost</option>
                                                    </select>
                                                    <span className="pointer-events-none absolute end-1.5 text-[8px] opacity-60">▼</span>
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {l.phone && (
                                                        <a
                                                            href={getLeadWhatsAppUrl(l)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="p-1.5 rounded-xl border border-[#BC5C29]/30 bg-[#BC5C29]/10 hover:bg-[#BC5C29]/20 text-[#BC5C29] transition"
                                                            title={`WhatsApp Chat (${l.phone})`}
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenLeadDetails(l);
                                                        }}
                                                        className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer"
                                                        title={t("View Lead Details, Files & Comments", "عرض تفاصيل ومرفقات الطلب")}
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5 text-[#BC5C29]" />
                                                        <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{t("Details", "التفاصيل")}</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenEditLead(l);
                                                        }}
                                                        className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition cursor-pointer"
                                                        title={t("Edit Lead", "تعديل الطلب")}
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLeadToDelete(l);
                                                        }}
                                                        className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                                                        title={t("Delete Lead", "حذف الطلب")}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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
            </div>

            {isAddLeadOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsAddLeadOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-auto text-zinc-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Add New Client Lead", "إضافة عميل محتمل جديد")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Enter client contact details, project scope, and estimated budget.", "أدخل بيانات التواصل مع العميل ونطاق المشروع والميزانية المتوقعة.")}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddLeadOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLead} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Client Name <span className="text-red-500">*</span></label>
                                    <input type="text" required value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="e.g. John Doe" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Company</label>
                                    <input type="text" value={leadCompany} onChange={e => setLeadCompany(e.target.value)} placeholder="e.g. Acme Corp" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Email Address</label>
                                    <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="john@example.com" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Phone / WhatsApp</label>
                                    <input type="text" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="+966 50 123 4567" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Project Type</label>
                                    <input type="text" value={leadProjectType} onChange={e => setLeadProjectType(e.target.value)} placeholder="e.g. Next.js App" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Budget</label>
                                    <input type="text" value={leadBudget} onChange={e => setLeadBudget(e.target.value)} placeholder="$15,000" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Country</label>
                                    <input type="text" value={leadCountry} onChange={e => setLeadCountry(e.target.value)} placeholder="Saudi Arabia" className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Status</label>
                                    <select value={leadStatus} onChange={e => setLeadStatus(e.target.value)} className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition cursor-pointer">
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="proposal">Proposal</option>
                                        <option value="won">Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Notes &amp; Project Scope</label>
                                <textarea value={leadNotes} onChange={e => setLeadNotes(e.target.value)} rows={3} placeholder="Add initial notes or brief requirements..." className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition resize-none" />
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddLeadOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button type="submit" disabled={submittingLead} className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
                                    {submittingLead ? 'Saving Client Lead...' : 'Create Client Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditLeadOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsEditLeadOpen(false); }}
                >
                    <div
                        className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl my-auto animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 px-6 sm:px-8 pt-6 sm:pt-7 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                            {t("Edit Client Lead Details", "تعديل تفاصيل طلب العميل")}
                                        </h3>
                                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#BC5C29]/10 text-[#BC5C29] font-bold">
                                            #{editLeadId}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {editLeadName || t("Client", "عميل")} • {editLeadCompany || t("No Company", "بدون شركة")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditLeadOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateLead} className="px-6 sm:px-8 py-5 space-y-5 overflow-y-auto text-xs flex-1">
                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#BC5C29] uppercase tracking-wider">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>{t("1. Client & Contact Information", "١. بيانات العميل والتواصل")}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                            {t("Client Name", "اسم العميل")} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editLeadName}
                                            onChange={e => setEditLeadName(e.target.value)}
                                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                            {t("Company / Organization", "اسم الشركة / الجهة")}
                                        </label>
                                        <input
                                            type="text"
                                            value={editLeadCompany}
                                            onChange={e => setEditLeadCompany(e.target.value)}
                                            placeholder="e.g. MitchDesigns, Enterprise"
                                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                            {t("Email Address", "البريد الإلكتروني")}
                                        </label>
                                        <div className="relative">
                                            <Mail className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-400" />
                                            <input
                                                type="email"
                                                value={editLeadEmail}
                                                onChange={e => setEditLeadEmail(e.target.value)}
                                                placeholder="client@company.com"
                                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 pl-9 pr-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                            {t("Phone / WhatsApp", "رقم الهاتف / واتساب")}
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-400" />
                                            <input
                                                type="text"
                                                value={editLeadPhone}
                                                onChange={e => setEditLeadPhone(e.target.value)}
                                                placeholder="+2010..."
                                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 pl-9 pr-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#BC5C29] uppercase tracking-wider">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>{t("2. Project Scope & Commercials", "٢. مواصفات المشروع والتعاقد")}</span>
                                </div>
                                <div className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                            {t("Project Type / Scope of Work", "نوع المشروع / نطاق العمل")}
                                        </label>
                                        <input
                                            type="text"
                                            value={editLeadProjectType}
                                            onChange={e => setEditLeadProjectType(e.target.value)}
                                            placeholder="e.g. المنصات المخصصة، وأنظمة الـ SaaS"
                                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                {t("Estimated Budget", "الميزانية المتوقعة")}
                                            </label>
                                            <input
                                                type="text"
                                                value={editLeadBudget}
                                                onChange={e => setEditLeadBudget(e.target.value)}
                                                placeholder="$5,000 – $10,000"
                                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#BC5C29] focus:outline-none focus:border-[#BC5C29] transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                {t("Launch Timeline", "الجدول الزمني للإطلاق")}
                                            </label>
                                            <div className="relative">
                                                <Calendar className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    value={editLeadTimeline}
                                                    onChange={e => setEditLeadTimeline(e.target.value)}
                                                    placeholder="e.g. فوري (أقل من شهر)"
                                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 pl-9 pr-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                {t("Country / Region", "الدولة / الموقع")}
                                            </label>
                                            <div className="relative">
                                                <MapPin className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    value={editLeadCountry}
                                                    onChange={e => setEditLeadCountry(e.target.value)}
                                                    placeholder="Egypt, Saudi Arabia, UAE..."
                                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 pl-9 pr-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                {t("Lead Status", "حالة الطلب")}
                                            </label>
                                            <select
                                                value={editLeadStatus}
                                                onChange={e => setEditLeadStatus(e.target.value)}
                                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition cursor-pointer"
                                            >
                                                <option value="new">🆕 New</option>
                                                <option value="contacted">📞 Contacted</option>
                                                <option value="proposal">📝 Proposal Sent</option>
                                                <option value="won">🎉 Won / Closed</option>
                                                <option value="lost">❌ Lost</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#BC5C29] uppercase tracking-wider">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{t("3. Required Features & Deliverables", "٣. المميزات والخدمات المطلوبة")}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                        {editLeadFeatures.length} {t("Features", "ميزة")}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {editLeadFeatures.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                                            {editLeadFeatures.map((feat, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium group transition hover:border-[#BC5C29]/50"
                                                >
                                                    <Check className="w-3 h-3 text-[#BC5C29] shrink-0" />
                                                    <span className="break-words">{feat}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditLeadFeatures(prev => prev.filter((_, i) => i !== idx))}
                                                        className="text-zinc-400 hover:text-rose-500 font-bold ml-1 transition cursor-pointer"
                                                        title="Remove feature"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 text-center text-zinc-400 text-xs italic border border-zinc-200/60 dark:border-zinc-800/60">
                                            {t("No specific deliverables specified yet.", "لم يتم تحديد مميزات مخصصة بعد.")}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-1">
                                        <input
                                            type="text"
                                            value={newFeatureInput}
                                            onChange={e => setNewFeatureInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (newFeatureInput.trim()) {
                                                        setEditLeadFeatures(prev => [...prev, newFeatureInput.trim()]);
                                                        setNewFeatureInput('');
                                                    }
                                                }
                                            }}
                                            placeholder={t("Add a feature and press Enter or click Add...", "أضف ميزة جديدة واضغط Enter أو زر الإضافة...")}
                                            className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newFeatureInput.trim()) {
                                                    setEditLeadFeatures(prev => [...prev, newFeatureInput.trim()]);
                                                    setNewFeatureInput('');
                                                }
                                            }}
                                            className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs transition shrink-0 cursor-pointer"
                                        >
                                            + {t("Add", "إضافة")}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#BC5C29] uppercase tracking-wider">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{t("4. Client Brief & Custom Notes", "٤. موجز وملاحظات العميل الإضافية")}</span>
                                </div>
                                <textarea
                                    value={editLeadPureNotes}
                                    onChange={e => setEditLeadPureNotes(e.target.value)}
                                    rows={3}
                                    placeholder={t("Add notes, meeting summary, or client brief...", "أي ملاحظات إضافية من العميل أو تفاصيل الاتفاق...")}
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition leading-relaxed"
                                />
                            </div>

                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsEditLeadOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingLead}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    {updatingLead ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                            <span>{t("Saving Changes...", "جاري الحفظ...")}</span>
                                        </>
                                    ) : (
                                        <span>{t("Update Client Lead", "تحديث بيانات الطلب")}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedLead && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedLead(null); }}
                >
                    <div
                        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl animate-scale-up cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ProjectDetailView
                            breadcrumbs={[
                                { label: t("Leads & CRM", "إدارة العملاء والطلبات"), href: "/leads" },
                                { label: selectedLead.name, href: "#" }
                            ]}
                            title={`${selectedLead.name} - ${selectedLead.company || 'Client'}`}
                            status={selectedLead.status || "new"}
                            showAssignee={false}
                            showTable={false}
                            dateRange={{
                                start: selectedLead.created_at ? String(selectedLead.created_at).split('T')[0] : "2026-08-01",
                                end: t("Ongoing", "مستمر")
                            }}
                            tags={[
                                { label: `${t("Budget", "الميزانية")}: ${selectedLead.budget || 'N/A'}`, variant: "destructive" },
                                { label: selectedLead.project_type || "Web App", variant: "default" },
                                { label: selectedLead.country || "Saudi Arabia", variant: "secondary" }
                            ]}
                            description={selectedLead.notes || t("Client lead inquiry and budget deliverables.", "متابعة العميل وملاحظات الطلب.")}
                            attachments={(leadAttachments || []).map(att => ({
                                id: att.id,
                                name: att.file_name || att.name || att.filename || "",
                                file_name: att.file_name || att.name || att.filename || "",
                                path: att.file_path || att.path || "#",
                                file_path: att.file_path || att.path || "#",
                                size: att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : "File",
                                type: (att.file_name || att.name || "").endsWith('.pdf') ? 'pdf' : (att.file_name || att.name || "").endsWith('.fig') ? 'figma' : 'pdf'
                            }))}
                            commentsFeed={(leadComments || []).map(c => ({
                                id: c.id,
                                author: c.author || "Client Note",
                                date: c.created_at ? String(c.created_at).split('T')[0] : "2026",
                                text: c.comment || c.text || "CRM Note",
                                attachments: c.attachments || []
                            }))}
                            onClose={() => setSelectedLead(null)}
                            onEdit={() => {
                                handleOpenEditLead(selectedLead);
                                setSelectedLead(null);
                            }}
                            onDelete={() => setLeadToDelete(selectedLead)}
                            editLabel={t("Edit Lead", "تعديل بيانات العميل")}
                            deleteLabel={t("Delete Lead", "حذف العميل")}
                            customInfo={selectedLead && (
                                <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                                    <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
                                        <span className="font-extrabold text-[11px] text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <UserCheck className="w-3.5 h-3.5 text-[#BC5C29]" />
                                            {t("Client Contact & Project Specs", "بيانات التواصل ومواصفات الطلب")}
                                        </span>
                                        {selectedLead.company && (
                                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#BC5C29]/10 text-[#BC5C29] text-[10px]">
                                                {selectedLead.company}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                                        {selectedLead.email && (
                                            <a
                                                href={`mailto:${selectedLead.email}`}
                                                className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 hover:border-[#BC5C29] transition text-zinc-700 dark:text-zinc-300"
                                            >
                                                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                                <span className="truncate font-semibold">{selectedLead.email}</span>
                                            </a>
                                        )}
                                        {selectedLead.phone && (
                                            <a
                                                href={getLeadWhatsAppUrl(selectedLead) || `tel:${selectedLead.phone}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500 transition text-zinc-700 dark:text-zinc-300"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span className="truncate font-bold font-mono">{selectedLead.phone}</span>
                                            </a>
                                        )}
                                        {selectedLead.country && (
                                            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                <MapPin className="w-3.5 h-3.5 text-[#BC5C29] shrink-0" />
                                                <span className="truncate font-semibold">{selectedLead.country}</span>
                                            </div>
                                        )}
                                    </div>

                                    {(() => {
                                        const { features, timeline, pureNotes } = parseNotesContent(selectedLead.notes);
                                        return (
                                            <>
                                                {timeline && (
                                                    <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
                                                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{t("Target Timeline:", "الموعد المستهدف:")}</span>
                                                        <span className="font-medium">{timeline}</span>
                                                    </div>
                                                )}
                                                {features.length > 0 && (
                                                    <div className="pt-2 space-y-1.5">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("Requested Features / Deliverables:", "المميزات والخدمات المطلوبة:")}</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {features.map((f, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800 text-[11px] font-medium">
                                                                    <Check className="w-3 h-3 text-[#BC5C29]" />
                                                                    {f}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {pureNotes && (
                                                    <div className="pt-2 space-y-1">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("Additional Notes:", "ملاحظات إضافية:")}</span>
                                                        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                                                            {pureNotes}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                            onAddComment={handleAddLeadComment}
                            onUploadFile={handleFileUploadToLead}
                            onDeleteComment={handleDeleteLeadComment}
                            onDeleteAttachment={handleDeleteLeadAttachment}
                            newCommentText={newLeadComment}
                            setNewCommentText={setNewLeadComment}
                            addingComment={addingLeadComment}
                        />
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!leadToDelete}
                title={t("Delete Client Lead", "حذف بيانات العميل")}
                itemName={leadToDelete?.name || ''}
                message={t(
                    `Are you sure you want to delete "${leadToDelete?.name}"? All associated files, activity logs, and comments will be permanently removed.`,
                    `هل أنت متأكد من رغبتك في حذف العميل "${leadToDelete?.name}"؟ سيتم حذف جميع البيانات والملفات والملاحظات المرتبطة به نهائياً.`
                )}
                onClose={() => setLeadToDelete(null)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeletingLead}
            />
            <ConfirmDeleteModal
                isOpen={!!deleteRequest}
                title={deleteRequest?.type === 'comment' ? t("Delete comment", "حذف التعليق") : t("Delete attachment", "حذف الملف")}
                message={t("This item and its linked data will be removed permanently.", "سيتم حذف هذا العنصر والبيانات المرتبطة به نهائيًا.")}
                onClose={() => setDeleteRequest(null)}
                onConfirm={confirmDeleteRelated}
                isDeleting={isDeletingRelated}
            />
        </div>
    );
}
