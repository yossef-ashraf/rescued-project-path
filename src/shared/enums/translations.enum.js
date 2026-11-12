/**
 * Orbit Architecture v2 — Translation & i18n Keys Enum
 * Centralized, typed, frozen constants for structured multi-language dictionary keys.
 */

export const I18N_KEYS = Object.freeze({
    // Common
    COMMON_ALL: 'common.all',
    COMMON_SAVE: 'common.save',
    COMMON_CANCEL: 'common.cancel',
    COMMON_DELETE: 'common.delete',
    COMMON_EDIT: 'common.edit',
    COMMON_LOADING: 'common.loading',
    COMMON_SEARCH: 'common.search',
    COMMON_FILTER: 'common.filter',
    COMMON_ACTIONS: 'common.actions',
    COMMON_CONFIRM: 'common.confirm',
    COMMON_CLOSE: 'common.close',
    COMMON_BACK: 'common.back',
    COMMON_NEXT: 'common.next',
    COMMON_TOTAL: 'common.total',
    COMMON_STATUS: 'common.status',
    COMMON_CREATED_AT: 'common.created_at',
    COMMON_UPDATED_AT: 'common.updated_at',
    COMMON_SELECT_PERIOD: 'common.select_period',

    // Navigation
    NAV_PULSE: 'nav.pulse',
    NAV_TIMELINE: 'nav.timeline',
    NAV_STREAMS: 'nav.streams',
    NAV_TERMS: 'nav.terms',
    NAV_RESERVES: 'nav.reserves',
    NAV_VALUATION: 'nav.valuation',
    NAV_INTELLIGENCE: 'nav.intelligence',
    NAV_MISSION_CONTROL: 'nav.mission_control',
    NAV_SPRINT_BOARD: 'nav.sprint_board',
    NAV_DAILY_FOCUS: 'nav.daily_focus',
    NAV_EVOLUTION_RADAR: 'nav.evolution_radar',
    NAV_SKILL_TOPOLOGY: 'nav.skill_topology',
    NAV_COURSE_CATALOG: 'nav.course_catalog',
    NAV_LEARNING_NOTES: 'nav.learning_notes',
    NAV_KNOWLEDGE_LIBRARY: 'nav.knowledge_library',
    NAV_EXECUTIVE_PROFILE: 'nav.executive_profile',
    NAV_PROJECTS_PORTFOLIO: 'nav.projects_portfolio',
    NAV_SYSTEM_SETTINGS: 'nav.system_settings',

    // Learning
    LEARNING_LECTURES_COMPLETE: 'learning.lectures_complete',
    LEARNING_LECTURES_PARTIAL: 'learning.lectures_partial',
    LEARNING_NO_LECTURES_IN_DATABASE: 'learning.no_lectures_in_database',
    LEARNING_COURSE_OVERVIEW: 'learning.course_overview',
    LEARNING_ALL_LECTURES: 'learning.all_lectures',
    LEARNING_ADD_COURSE: 'learning.add_course',
    LEARNING_ADD_CATEGORY: 'learning.add_category',
    LEARNING_EDIT_COURSE: 'learning.edit_course',
    LEARNING_DELETE_COURSE: 'learning.delete_course',
    LEARNING_COURSE_HIERARCHY: 'learning.course_hierarchy',
    LEARNING_INTERACTIVE_BOOK: 'learning.interactive_book',
    LEARNING_STUDY_BOOK_SUBTITLE: 'learning.study_book_subtitle',
    LEARNING_EXPORT_PDF: 'learning.export_pdf',
    LEARNING_OPEN_PDF_VIEW: 'learning.open_pdf_view',
    LEARNING_PDF_READ_INSTRUCTION: 'learning.pdf_read_instruction',
    LEARNING_LECTURES_COUNT: 'learning.lectures_count',
    LEARNING_UNITS_COUNT: 'learning.units_count',

    // Treasury
    TREASURY_MONTHLY_LEDGER: 'treasury.monthly_ledger',
    TREASURY_GOLD_AND_ASSETS: 'treasury.gold_and_assets',
    TREASURY_REVENUE: 'treasury.revenue',
    TREASURY_DEBTS: 'treasury.debts',
    TREASURY_INVESTMENTS: 'treasury.investments',
    TREASURY_CASH_FLOW: 'treasury.cash_flow',
    TREASURY_BY_TYPE: 'treasury.by_type',
    TREASURY_REV: 'treasury.rev',
    TREASURY_DEBTS_SHORT: 'treasury.debts_short',
    TREASURY_INVEST_SHORT: 'treasury.invest_short',
    TREASURY_OTHER_SHORT: 'treasury.other_short',
    TREASURY_SIX_MONTHS: 'treasury.six_months',
    TREASURY_TWELVE_MONTHS: 'treasury.twelve_months',
    TREASURY_ALL_TIME: 'treasury.all_time',
    TREASURY_GLOBAL_OVERVIEW: 'treasury.global_overview',
    TREASURY_BALANCE_SHEET_SUBTITLE: 'treasury.balance_sheet_subtitle',

    // Tasks
    TASKS_MISSION_CONTROL: 'tasks.mission_control',
    TASKS_SPRINT_BOARD: 'tasks.sprint_board',
    TASKS_DAILY_FOCUS: 'tasks.daily_focus',
    TASKS_PENDING: 'tasks.pending',
    TASKS_DONE: 'tasks.done',
    TASKS_MISSED: 'tasks.missed',
    TASKS_ADD_TASK: 'tasks.add_task',
    TASKS_TASK_TITLE: 'tasks.task_title',
});

const serviceExports = {
    I18N_KEYS,
};

export default serviceExports;
