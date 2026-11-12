export const LEAD_STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses', labelAr: 'جميع الحالات' },
    { value: 'new', label: 'New', labelAr: 'جديد' },
    { value: 'contacted', label: 'Contacted', labelAr: 'تم التواصل' },
    { value: 'proposal', label: 'Proposal', labelAr: 'عرض سعر' },
    { value: 'won', label: 'Won', labelAr: 'تم التعاقد' },
    { value: 'lost', label: 'Lost', labelAr: 'ملغي' }
];

export const LEAD_EDIT_STATUS_OPTIONS = [
    { value: 'new', label: '✨ New' },
    { value: 'contacted', label: '📞 Contacted' },
    { value: 'proposal', label: '📑 Proposal Sent' },
    { value: 'won', label: '🎉 Won / Closed' },
    { value: 'lost', label: '❌ Lost' }
];

export const DEFAULT_LEAD_FORM = {
    projectType: 'Next.js Full-Stack App',
    budget: '$15,000',
    country: '🇸🇦 Saudi Arabia',
    status: 'new'
};
