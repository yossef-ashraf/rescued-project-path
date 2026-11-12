'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/shared/context/AppContext.js';
import { Printer, X, FileText, Calendar, Globe } from 'lucide-react';

export default function ComprehensivePdfModal({
    isOpen,
    onClose,
    initialYear = '2026',
    selectedYear,
    initialMonth = 'all'
}) {
    const { language: appLang } = useApp();
    const [customLang, setCustomLang] = useState(null);
    const [year, setYear] = useState(selectedYear || initialYear);
    const [month, setMonth] = useState(initialMonth);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const reportLang = customLang || (appLang === 'ar' ? 'ar' : 'en');
    const isAr = reportLang === 'ar';

    useEffect(() => {
        if (!isOpen) return;
        let ignore = false;

        let url = `/api/reports/analytics?year=${year || '2026'}`;
        if (month && month !== 'all') {
            url += `&month=${encodeURIComponent(month)}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(resData => {
                if (!ignore) {
                    setData(resData);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                if (!ignore) setLoading(false);
            });

        return () => { ignore = true; };
    }, [isOpen, year, month]);

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const currencySymbol = isAr ? ' ج.م' : ' EGP';

    const formatMoney = (val) => {
        const num = parseFloat(val) || 0;
        return num.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }) + currencySymbol;
    };

    const finance = data?.finance;
    const tasks = data?.tasks;
    const courses = data?.courses;
    const availableMonths = data?.availableMonths || [];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto animate-fade-in">

            <div className="bg-white text-zinc-900 rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-zinc-200 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">

                <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#BC5C29]/10 text-[#BC5C29] flex items-center justify-center font-bold">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900">
                                {isAr ? 'تقرير التحليلات والإحصائيات الشامل (PDF)' : 'Comprehensive Analytics & Performance Report (PDF)'}
                            </h2>
                            <p className="text-[11px] text-zinc-500 font-mono">
                                {isAr ? 'تقرير رسمي معتمد خالٍ من أي لغة دخيلة' : 'Certified Official Report strictly in English'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                        <div className="flex items-center rounded-xl bg-zinc-100 p-1 border border-zinc-200">
                            <button
                                type="button"
                                onClick={() => setCustomLang('ar')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${isAr ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                            >
                                عربي
                            </button>
                            <button
                                type="button"
                                onClick={() => setCustomLang('en')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${!isAr ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                            >
                                English
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 rounded-xl px-2.5 py-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
                            >
                                <option value="all">{isAr ? 'كامل العام (كل الشهور)' : 'Full Year (All Months)'}</option>
                                {availableMonths.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="bg-[#BC5C29] hover:bg-[#d0633b] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{isAr ? 'طباعة وحفظ كـ PDF' : 'Print / Save as PDF'}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-8 sm:p-12 space-y-9 print:p-8 font-sans" dir={isAr ? 'rtl' : 'ltr'}>

                    <div className="border-b-2 border-zinc-900 pb-6 flex items-start justify-between">
                        <div>
                            <div className="inline-block px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded-md uppercase tracking-wider mb-2.5">
                                {isAr ? 'وثيقة إدارية رسمية معتمدة' : 'OFFICIAL EXECUTIVE DOCUMENT'}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                                {isAr ? 'تقرير الأداء الشامل والتحليلات المالية والتعليمية' : 'Comprehensive Performance, Financial & Educational Analytics'}
                            </h1>
                            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                                {isAr
                                    ? 'سجل تحليلي مدقق لحركة التدفقات النقدية، إنجاز المهام والتوقيت، ومؤشرات دراسة المواد المعرفية.'
                                    : 'Audited analytical record covering cash flow, task completion timeliness, and knowledge learning progress.'}
                            </p>
                        </div>

                        <div className={`text-xs font-mono text-zinc-500 ${isAr ? 'text-left' : 'text-right'} space-y-1`}>
                            <div>
                                <span className="text-zinc-400">{isAr ? 'الفترة الزمنية: ' : 'Reporting Period: '}</span>
                                <strong className="text-zinc-900 font-bold">{month !== 'all' ? `${month} ${year}` : year}</strong>
                            </div>
                            <div>
                                <span className="text-zinc-400">{isAr ? 'تاريخ الإصدار: ' : 'Issue Date: '}</span>
                                <span className="text-zinc-700">{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-zinc-400 text-xs">
                            {isAr ? 'جاري استخراج وتجميع الإحصائيات...' : 'Compiling analytics report...'}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className={`flex items-center gap-2 border-zinc-900 ${isAr ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>
                                    <h2 className="text-base sm:text-lg font-black text-zinc-900">
                                        {isAr ? 'أولاً: تقرير السيولة النقدية والميزانية' : '1. Financial Liquidity & Budget Ledger'}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-zinc-500 block mb-1">
                                            {isAr ? 'رصيد بداية الفترة (الافتتاحي)' : 'Initial Opening Balance'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-zinc-900 font-mono">
                                            {formatMoney(finance?.periodOpening)}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                                            {isAr ? 'إجمالي الأموال الواردة (الدخل)' : 'Total Inflows (Credits)'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                                            +{formatMoney(finance?.periodInflows)}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-rose-800 block mb-1">
                                            {isAr ? 'إجمالي الأموال المنصرفة (المسحوبات)' : 'Total Outflows (Debts)'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-rose-700 font-mono">
                                            -{formatMoney(finance?.periodOutflows)}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-sky-800 block mb-1">
                                            {isAr ? 'صافي الرصيد المتبقي (الختامي)' : 'Net Remaining Balance'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-sky-800 font-mono">
                                            {formatMoney(finance?.periodClosing)}
                                        </span>
                                    </div>
                                </div>

                                {(!month || month === 'all') && finance?.monthlyFinance && (
                                    <div className="border border-zinc-200 rounded-2xl overflow-hidden mt-3">
                                        <div className="bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700">
                                            {isAr ? 'حركة السيولة شهراً بشهر خلال العام:' : 'Monthly Cashflow Progression:'}
                                        </div>
                                        <table className="w-full text-xs">
                                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono">
                                                <tr>
                                                    <th className="p-3 text-start">{isAr ? 'الشهر' : 'Month'}</th>
                                                    <th className="p-3 text-start">{isAr ? 'رصيد أول الشهر' : 'Opening'}</th>
                                                    <th className="p-3 text-start text-emerald-700">{isAr ? 'الوارد' : 'Inflows'}</th>
                                                    <th className="p-3 text-start text-rose-700">{isAr ? 'المنصرف' : 'Outflows'}</th>
                                                    <th className="p-3 text-start">{isAr ? 'صافي التدفق' : 'Net Flow'}</th>
                                                    <th className="p-3 text-start font-bold">{isAr ? 'الرصيد الختامي' : 'Closing'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200 font-mono">
                                                {finance.monthlyFinance.map((m, idx) => (
                                                    <tr key={idx} className="hover:bg-zinc-50/50">
                                                        <td className="p-3 font-bold font-sans text-zinc-900">{m.monthName}</td>
                                                        <td className="p-3">{formatMoney(m.openingBalance)}</td>
                                                        <td className="p-3 text-emerald-700">+{formatMoney(m.inflows)}</td>
                                                        <td className="p-3 text-rose-700">-{formatMoney(m.outflows)}</td>
                                                        <td className={`p-3 font-bold ${m.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {m.netCashFlow >= 0 ? '+' : ''}{formatMoney(m.netCashFlow)}
                                                        </td>
                                                        <td className="p-3 font-bold bg-zinc-50/50 text-zinc-900">{formatMoney(m.closingBalance)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {month && month !== 'all' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div className="border border-emerald-200 rounded-2xl overflow-hidden">
                                            <div className="bg-emerald-100/70 px-4 py-2 text-xs font-bold text-emerald-900">
                                                {isAr ? 'بيان المداخيل والإيداعات:' : 'Itemized Revenue & Inflows:'}
                                            </div>
                                            <table className="w-full text-xs">
                                                <thead className="bg-emerald-50 text-emerald-800 border-b border-emerald-200">
                                                    <tr>
                                                        <th className="p-2.5 text-start">{isAr ? 'البند' : 'Item'}</th>
                                                        <th className="p-2.5 text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-emerald-100">
                                                    {finance?.itemizedCredits && finance.itemizedCredits.length > 0 ? (
                                                        finance.itemizedCredits.map((c, i) => (
                                                            <tr key={i} className="hover:bg-emerald-50/30">
                                                                <td className="p-2.5 text-zinc-800 font-medium">{c.name}</td>
                                                                <td className="p-2.5 font-mono text-emerald-700 font-bold">+{formatMoney(c.amount)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="2" className="p-4 text-center text-zinc-400">{isAr ? 'لا توجد بنود إيداع مسجلة' : 'No credit entries found'}</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="border border-rose-200 rounded-2xl overflow-hidden">
                                            <div className="bg-rose-100/70 px-4 py-2 text-xs font-bold text-rose-900">
                                                {isAr ? 'بيان المصروفات والالتزامات:' : 'Itemized Expenses & Outflows:'}
                                            </div>
                                            <table className="w-full text-xs">
                                                <thead className="bg-rose-50 text-rose-800 border-b border-rose-200">
                                                    <tr>
                                                        <th className="p-2.5 text-start">{isAr ? 'البند' : 'Item'}</th>
                                                        <th className="p-2.5 text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-rose-100">
                                                    {finance?.itemizedDebts && finance.itemizedDebts.length > 0 ? (
                                                        finance.itemizedDebts.map((d, i) => (
                                                            <tr key={i} className="hover:bg-rose-50/30">
                                                                <td className="p-2.5 text-zinc-800 font-medium">{d.name}</td>
                                                                <td className="p-2.5 font-mono text-rose-700 font-bold">-{formatMoney(d.amount)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="2" className="p-4 text-center text-zinc-400">{isAr ? 'لا توجد بنود مصروفات مسجلة' : 'No expense entries found'}</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-6 border-t border-zinc-200">
                                <div className={`flex items-center gap-2 border-zinc-900 ${isAr ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>
                                    <h2 className="text-base sm:text-lg font-black text-zinc-900">
                                        {isAr ? 'ثانياً: مؤشرات إنجاز المهام والالتزام بالمواعيد' : '2. Task Execution & Timeliness Metrics'}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-zinc-500 block mb-1">
                                            {isAr ? 'إجمالي المهام المسجلة' : 'Total Recorded Tasks'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-zinc-900 font-mono">
                                            {(tasks?.totalTasksCount || 0) + (tasks?.totalTodosCount || 0)}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                                            {isAr ? 'المهام المكتملة بنجاح' : 'Completed Tasks'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                                            {tasks?.completedTasksCount || tasks?.onTimeTasksCount || 0}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-amber-800 block mb-1">
                                            {isAr ? 'مهام متأخرة عن موعدها' : 'Overdue & Delayed Tasks'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-amber-700 font-mono">
                                            {tasks?.overdueTasksCount || 0}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-indigo-800 block mb-1">
                                            {isAr ? 'نسبة الإنجاز الكلية' : 'Overall Completion Rate'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-indigo-700 font-mono">
                                            {tasks?.completionRate || 0}%
                                        </span>
                                    </div>
                                </div>

                                {tasks?.overdueTasksList && tasks.overdueTasksList.length > 0 && (
                                    <div className="border border-amber-200 rounded-2xl overflow-hidden bg-amber-50/10 mt-3">
                                        <div className="bg-amber-100/70 px-4 py-2 text-xs font-bold text-amber-900">
                                            {isAr ? 'بيان بالمهام المتأخرة وعدد أيام التأخير:' : 'Log of Delayed Tasks & Days Overdue:'}
                                        </div>
                                        <table className="w-full text-xs">
                                            <thead className="bg-amber-50/80 border-b border-amber-200 text-zinc-600">
                                                <tr>
                                                    <th className="p-2.5 text-start">{isAr ? 'عنوان المهمة' : 'Task Title'}</th>
                                                    <th className="p-2.5 text-start">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                                    <th className="p-2.5 text-start text-rose-700">{isAr ? 'فترة التأخير' : 'Delay Duration'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-amber-100">
                                                {tasks.overdueTasksList.map((ot, idx) => (
                                                    <tr key={idx} className="hover:bg-amber-50/30">
                                                        <td className="p-2.5 font-bold text-zinc-900">{ot.title}</td>
                                                        <td className="p-2.5 font-mono text-zinc-600">{ot.dueDate || (isAr ? 'غير محدد' : 'Unspecified')}</td>
                                                        <td className="p-2.5 font-mono font-bold text-rose-700">
                                                            {isAr ? `+${ot.overdueDays} يوم` : `+${ot.overdueDays} days`}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-6 border-t border-zinc-200">
                                <div className={`flex items-center gap-2 border-zinc-900 ${isAr ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>
                                    <h2 className="text-base sm:text-lg font-black text-zinc-900">
                                        {isAr ? 'ثالثاً: سجل الدورات التدريبية والمكتبة المعرفية' : '3. Courses Progress & Knowledge Materials'}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-zinc-500 block mb-1">
                                            {isAr ? 'إجمالي الدورات المرئية' : 'Total Video Courses'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-zinc-900 font-mono">
                                            {courses?.totalCourses || 0}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                                            {isAr ? 'المقاطع التي تم إتمامها' : 'Watched Lessons'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                                            {courses?.completedVideos || 0} / {courses?.totalVideos || 0}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-teal-800 block mb-1">
                                            {isAr ? 'مواد علمية تمت قراءتها' : 'Materials Fully Read'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-teal-700 font-mono">
                                            {courses?.readCount || 0}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
                                        <span className="text-[11px] font-bold text-purple-800 block mb-1">
                                            {isAr ? 'مواد قيد القراءة حالياً' : 'Materials In Progress'}
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-purple-700 font-mono">
                                            {courses?.inProgressCount || 0}
                                        </span>
                                    </div>
                                </div>

                                {courses?.readList && courses.readList.length > 0 && (
                                    <div className="border border-teal-200 rounded-2xl overflow-hidden bg-teal-50/10 mt-3">
                                        <div className="bg-teal-100/70 px-4 py-2 text-xs font-bold text-teal-900">
                                            {isAr ? 'بيان بالكتب والمواد المعرفية التي تمت قراءتها:' : 'Catalog of Read Books & Materials:'}
                                        </div>
                                        <div className="p-3 space-y-2 text-xs">
                                            {courses.readList.map((m, idx) => (
                                                <div key={idx} className="flex items-start justify-between border-b border-teal-100/50 pb-1.5 last:border-none">
                                                    <span className="font-bold text-zinc-900">{m.title}</span>
                                                    {m.notes && (
                                                        <span className="text-zinc-500 text-[11px] italic max-w-xs truncate">
                                                            {m.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-zinc-200 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                                <span>{isAr ? 'منصة كودكس • كافة الحقوق محفوظة' : 'Codex Platform • All Rights Reserved'}</span>
                                <span>{isAr ? 'نظام التقارير الإدارية الذكي' : 'Automated Executive Reporting System'}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
