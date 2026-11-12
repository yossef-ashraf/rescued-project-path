export const MONTH_ORDER_MAP = {
  'january': 1, 'jan': 1, 'يناير': 1,
  'february': 2, 'feb': 2, 'فبراير': 2,
  'march': 3, 'mar': 3, 'مارس': 3,
  'april': 4, 'apr': 4, 'أبريل': 4, 'ابريل': 4,
  'may': 5, 'مايو': 5,
  'june': 6, 'jun': 6, 'يونيو': 6, 'يونية': 6,
  'july': 7, 'jul': 7, 'يوليو': 7, 'يوليه': 7,
  'august': 8, 'aug': 8, 'أغسطس': 8, 'اغسطس': 8,
  'september': 9, 'sep': 9, 'سبتمبر': 9,
  'october': 10, 'oct': 10, 'أكتوبر': 10, 'اكتوبر': 10,
  'november': 11, 'nov': 11, 'نوفمبر': 11,
  'december': 12, 'dec': 12, 'ديسمبر': 12
};

export const CREDIT_TYPE_OPTIONS = [
  { value: '1', label: 'Salary', labelAr: 'راتب شهري' },
  { value: '2', label: 'Freelance', labelAr: 'عمل حر' },
  { value: '3', label: 'Fixed Revenue', labelAr: 'دخل ثابت' },
  { value: '4', label: 'Total Income', labelAr: 'إجمالي' },
  { value: '0', label: 'Other Revenue', labelAr: 'أخرى' }
];

export const DEFAULT_CREDIT_FORM = {
  name: '',
  amount: '',
  type: '1',
  note: '',
  monthId: '',
  monthName: 'July',
  year: '2026'
};
