'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from '@/shared/next-compat/link';
import { useRouter, useSearchParams } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import {
    FileText,
    Upload,
    Search,
    ExternalLink,
    Trash2,
    LayoutGrid,
    Table as TableIcon,
    Plus,
    FileCode,
    FileCheck,
    Video,
    PlayCircle,
    FolderPlus,
    X,
    Eye,
    Download,
    Edit3,
    Maximize2,
    Minimize2,
    BookOpen,
    Globe,
    Code2,
    FileQuestion,
    SlidersHorizontal,
    ArrowUp,
    StickyNote,
    CheckCircle2,
    Clock3,
    CircleDashed,
    ChevronLeft,
    ChevronRight,
    Tag,
    ChevronDown,
    ChevronsUpDown,
    GraduationCap,
    ArrowRightLeft,
    Sparkles,
    Loader2,
    Brain,
    FolderGit2,
    Wrench,
    Copy,
    Check,
    Link2,
    Layers
} from 'lucide-react';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import FileTypeIllustration, { resolveFileIllustrationType } from '@/components/ui/file-type-illustration';
import { CodeBlock, SmartCommentBlock, formatCodeSubmission } from '@/components/ui/code-block';
import { uploadFileWithSync } from '@/shared/storage/upload-helper.js';
import {
    fetchMaterialsData,
    addMaterialCategory,
    addMaterialFile,
    updateMaterialFile,
    updateReadingStatus,
    deleteMaterialFile,
    changeItemType,
    bulkTransferLetterFiles,
    transferMaterialToLesson
} from '@/features/learning/api/materials.api.js';
import { fetchCourseLessons, createLesson } from '@/features/learning/api/lessons.api.js';
import {
    getFileTypeCategory,
    isLinkItem,
    getDownloadUrl,
    filterMaterials,
    extractPrefixes,
    sortMaterials,
    groupMaterialsByLetter,
    decodeHtmlEntities
} from '@/features/learning/utils/materials.logic.js';

const ALL_DESTINATIONS = {
    material: {
        type: 'material',
        labelEn: 'Materials & Files',
        labelAr: 'الماتريال والملفات',
        icon: '📚',
        descEn: 'Move this item into Materials & Files library',
        descAr: 'نقل هذا العنصر إلى قسم الماتريال والمكتبة التعليمية',
        themeClass: 'hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
    },
    summary: {
        type: 'summary',
        labelEn: 'Summaries & Notes',
        labelAr: 'الملخصات والملاحظات',
        icon: '📝',
        descEn: 'Move this item into Course Summaries and study notes',
        descAr: 'نقل هذا العنصر إلى قسم الملخصات والملاحظات الدراسية',
        themeClass: 'hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
    },
    onlymind: {
        type: 'onlymind',
        labelEn: 'OnlyMind',
        labelAr: 'OnlyMind',
        icon: '🧠',
        descEn: 'Move this item into OnlyMind deep mental models & insights',
        descAr: 'نقل هذا العنصر إلى قسم OnlyMind للأفكار العميقة والنماذج الفكرية',
        themeClass: 'hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400'
    },
    tools: {
        type: 'tools',
        labelEn: 'Tools & Utilities',
        labelAr: 'الأدوات والبرمجيات المساعدة',
        icon: '🛠️',
        descEn: 'Move this item into Tools & Utilities Hub',
        descAr: 'نقل هذا العنصر إلى قسم الأدوات والبرمجيات المساعدة',
        themeClass: 'hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400'
    }
};

const TYPE_CONFIG = {
    material: {
        type: 'material',
        titleEn: 'Course Materials & Knowledge Library',
        titleAr: 'المواد والمراجع والمكتبة التعليمية',
        subtitleEn: 'Comprehensive library of PDF books, guides, repositories, external documentation, and interactive study notes.',
        subtitleAr: 'المكتبة الشاملة للكتب والملفات ووثائق ومستودعات المراجع والملاحظات الدراسية مع المعاينة والتحميل المباشر.',
        icon: '📚',
        addBtnEn: 'Add Resource',
        addBtnAr: 'إضافة مورد / كتاب',
        badgeColor: 'emerald',
        destinations: [ALL_DESTINATIONS.summary, ALL_DESTINATIONS.onlymind, ALL_DESTINATIONS.tools]
    },
    summary: {
        type: 'summary',
        titleEn: 'Course Summaries & Notes',
        titleAr: 'الملخصات والملاحظات المركزة',
        subtitleEn: 'Structured takeaways, chapter briefs, and curated review summaries from your courses.',
        subtitleAr: 'الملخصات المركزة، النقاط الجوهرية، والملاحظات المستفادة لمراجعة المواد والكورسات.',
        icon: '📝',
        addBtnEn: 'Add Summary',
        addBtnAr: 'إضافة ملخص / ملاحظة',
        badgeColor: 'indigo',
        destinations: [ALL_DESTINATIONS.material, ALL_DESTINATIONS.onlymind, ALL_DESTINATIONS.tools]
    },
    onlymind: {
        type: 'onlymind',
        titleEn: 'OnlyMind Knowledge Base',
        titleAr: 'ملاحظات وأفكار OnlyMind',
        subtitleEn: 'Curated thoughts, mental models, high-leverage insights, and personal reflections.',
        subtitleAr: 'المساحة الحصرية للأفكار العميقة، النماذج الفكرية، والملاحظات الخاصة المرتبطة بالتعلم والمعرفة.',
        icon: '🧠',
        addBtnEn: 'Add to OnlyMind',
        addBtnAr: 'إضافة إلى OnlyMind',
        badgeColor: 'amber',
        destinations: [ALL_DESTINATIONS.material, ALL_DESTINATIONS.summary, ALL_DESTINATIONS.tools]
    },
    tools: {
        type: 'tools',
        titleEn: 'Tools & Utilities Hub',
        titleAr: 'الأدوات والبرمجيات المساعدة',
        subtitleEn: 'Curated developer tools, CLI utilities, scripts, templates, and productivity resources.',
        subtitleAr: 'مكتبة الأدوات، الإضافات، السكربتات، والبرمجيات المساعدة لتسريع العمل والتعلم.',
        icon: '🛠️',
        addBtnEn: 'Add Tool',
        addBtnAr: 'إضافة أداة',
        badgeColor: 'sky',
        destinations: [ALL_DESTINATIONS.material, ALL_DESTINATIONS.summary, ALL_DESTINATIONS.onlymind]
    }
};

export default function UnifiedMaterialsView({ pageType = 'material' }) {
    const config = TYPE_CONFIG[pageType] || TYPE_CONFIG.material;
    const { t, lang, setActiveDashboard } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [materialsData, setMaterialsData] = useState({ files: [], categories: [], courses: [] });
    const [loading, setLoading] = useState(true);

    const initialItemType = searchParams.get('type') || searchParams.get('item_type') || (pageType !== 'material' ? pageType : 'all');
    const [itemTypeFilter, setItemTypeFilter] = useState(initialItemType);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [activeLetter, setActiveLetter] = useState('');
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [uploadCourseId, setUploadCourseId] = useState('');
    const [editCourseId, setEditCourseId] = useState('');

    const categoryTabsRef = useRef(null);
    const typeTabsRef = useRef(null);
    const [isDraggingTabs, setIsDraggingTabs] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftPos, setScrollLeftPos] = useState(0);
    const [hasDraggedTabs, setHasDraggedTabs] = useState(false);

    const handleTabsWheel = (e) => {
        if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };

    const handleTabsMouseDown = (e) => {
        if (!categoryTabsRef.current) return;
        setIsDraggingTabs(true);
        setHasDraggedTabs(false);
        setStartX(e.pageX - categoryTabsRef.current.offsetLeft);
        setScrollLeftPos(categoryTabsRef.current.scrollLeft);
    };

    const handleTabsMouseMove = (e) => {
        if (!isDraggingTabs || !categoryTabsRef.current) return;
        const x = e.pageX - categoryTabsRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 12) {
            setHasDraggedTabs(true);
        }
        categoryTabsRef.current.scrollLeft = scrollLeftPos - walk;
    };

    const handleTabsMouseUp = () => {
        setIsDraggingTabs(false);
    };

    const scrollCategoryTabs = (direction) => {
        if (!categoryTabsRef.current) return;
        const offset = direction === 'left' ? -260 : 260;
        categoryTabsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    // Category modal
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#10B981');
    const [savingCat, setSavingCat] = useState(false);

    // Add / Upload modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadType, setUploadType] = useState('file');
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [customCategoryInput, setCustomCategoryInput] = useState('');
    const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [customFileName, setCustomFileName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Preview / Reader modal
    const [previewItem, setPreviewItem] = useState(null);
    const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

    // Reading status filter
    const [statusFilter, setStatusFilter] = useState('all');

    // Notes modal
    const [notesModalItem, setNotesModalItem] = useState(null);
    const [notesModalText, setNotesModalText] = useState('');
    const [notesInputMode, setNotesInputMode] = useState('text');
    const [notesCodeTitle, setNotesCodeTitle] = useState('snippet.ts');
    const [savingNotes, setSavingNotes] = useState(false);
    const fileInputRef = useRef(null);
    const [noteUploadMode, setNoteUploadMode] = useState('text');
    const [noteUploadCodeFile, setNoteUploadCodeFile] = useState('snippet.ts');

    // Reading status on upload
    const [uploadReadingStatus, setUploadReadingStatus] = useState('unread');
    const [uploadNotes, setUploadNotes] = useState('');

    // Edit item modal
    const [editItem, setEditItem] = useState(null);
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editFileType, setEditFileType] = useState('link');
    const [editDesc, setEditDesc] = useState('');
    const [editCat, setEditCat] = useState('');
    const [editReadingStatus, setEditReadingStatus] = useState('unread');
    const [editNotes, setEditNotes] = useState('');
    const [editTargetItemType, setEditTargetItemType] = useState(pageType);
    const [savingEdit, setSavingEdit] = useState(false);

    // Transfer letter group modal
    const [transferLetterGroup, setTransferLetterGroup] = useState(null);
    const [targetLetterCat, setTargetLetterCat] = useState('');
    const [customLetterCat, setCustomLetterCat] = useState('');
    const [isCustomLetterCat, setIsCustomLetterCat] = useState(false);
    const [targetLetterItemType, setTargetLetterItemType] = useState(pageType);
    const [isTransferringLetter, setIsTransferringLetter] = useState(false);

    // Move destination modal
    const [moveModalItem, setMoveModalItem] = useState(null);
    const [movingItem, setMovingItem] = useState(false);

    // Transfer to Lesson Modal
    const [lessonTransferItem, setLessonTransferItem] = useState(null);
    const [transferTargetCourseId, setTransferTargetCourseId] = useState('');
    const [transferTargetLessonId, setTransferTargetLessonId] = useState('');
    const [courseLessonsList, setCourseLessonsList] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [isTransferringToLesson, setIsTransferringToLesson] = useState(false);
    const [transferMode, setTransferMode] = useState('create_new'); // 'create_new' | 'attach'
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [creatingLesson, setCreatingLesson] = useState(false);

    // Delete item modal
    const [deleteItem, setDeleteItem] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [userCollapsedMap, setUserCollapsedMap] = useState({});
    const [collapsedSubGroups, setCollapsedSubGroups] = useState(new Set());
    const [copiedId, setCopiedId] = useState(null);

    const handleCopyUrl = async (item, e) => {
        e?.stopPropagation?.();
        const targetUrl = item?.file_url || (typeof window !== 'undefined' ? window.location.href : '');
        try {
            await navigator.clipboard.writeText(targetUrl);
            setCopiedId(item.id);
            setTimeout(() => setCopiedId(null), 2000);
            announceMatteAlert({
                tone: 'success',
                title: t("Copied", "تم النسخ"),
                description: t("Resource URL copied to clipboard.", "تم نسخ رابط المورد إلى الحافظة.")
            });
        } catch {
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to copy URL.", "تعذر نسخ الرابط.")
            });
        }
    };

    const toggleSubGroupCollapse = useCallback((key) => {
        setCollapsedSubGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const scrollToSubGroup = useCallback((letter, tag, e) => {
        if (e) e.stopPropagation();
        setUserCollapsedMap(prev => {
            if (prev[letter] === true) {
                return { ...prev, [letter]: false };
            }
            return prev;
        });
        const subKey = `${letter}-${tag}`;
        setCollapsedSubGroups(prev => {
            if (prev.has(subKey)) {
                const next = new Set(prev);
                next.delete(subKey);
                return next;
            }
            return prev;
        });
        setActiveLetter(letter);
        const targetId = `subgroup-${encodeURIComponent(letter)}-${encodeURIComponent(tag)}`;
        setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    }, []);

    const renderResourceTitle = (fileName) => {
        if (!fileName) return '';
        const decoded = decodeHtmlEntities(fileName);
        const bracketMatch = decoded.match(/^\[([^\]]+)\]\s*(.*)$/);
        if (bracketMatch) {
            return (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] border border-[#BC5C29]/30 shadow-2xs shrink-0">
                        {bracketMatch[1].trim()}
                    </span>
                    <span>{bracketMatch[2].trim()}</span>
                </span>
            );
        }
        const colonMatch = decoded.match(/^([A-Za-z0-9\u0600-\u06FF\s._&/]+?)\s*:\s+(.*)$/);
        if (colonMatch && colonMatch[1].trim().length <= 25) {
            const prefix = colonMatch[1].trim();
            const rest = colonMatch[2].trim();
            return (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] border border-[#BC5C29]/30 shadow-2xs shrink-0">
                        {prefix}
                    </span>
                    <span>{rest}</span>
                </span>
            );
        }
        const dashMatch = decoded.match(/^([A-Za-z0-9\u0600-\u06FF\s._]+?)\s*-\s+(.*)$/);
        if (dashMatch && dashMatch[1].trim().length <= 15) {
            const prefix = dashMatch[1].trim();
            const rest = dashMatch[2].trim();
            return (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] border border-[#BC5C29]/30 shadow-2xs shrink-0">
                        {prefix}
                    </span>
                    <span>{rest}</span>
                </span>
            );
        }
        return decoded;
    };

    const resetUploadModal = () => {
        setUploadType('file');
        setUploadFile(null);
        setCustomFileName('');
        setItemDescription('');
        setLinkUrl('');
        setLinkTitle('');
        setNoteContent('');
        setNoteTitle('');
        setSelectedCategoryName('');
        setCustomCategoryInput('');
        setUploadReadingStatus('unread');
        setUploadNotes('');
        setUploadCourseId('');
        setIsAddingCustomCat(false);
        setIsUploadModalOpen(false);
    };

    const fetchMaterials = useCallback((silent = false) => {
        if (!silent) setLoading(true);
        fetchMaterialsData(null)
            .then(payload => {
                setMaterialsData({
                    files: payload.files || [],
                    categories: payload.categories || [],
                    courses: payload.courses || []
                });
                if (!silent) setLoading(false);
            })
            .catch(err => {
                console.error(`Error fetching ${pageType} materials:`, err);
                if (!silent) setLoading(false);
            });
    }, [pageType]);

    useEffect(() => {
        setActiveDashboard('courses');
        let ignore = false;
        fetchMaterialsData(null)
            .then(payload => {
                if (!ignore) {
                    setMaterialsData({
                        files: payload.files || [],
                        categories: payload.categories || [],
                        courses: payload.courses || []
                    });
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(`Error fetching ${pageType} materials:`, err);
                if (!ignore) setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, [pageType, setActiveDashboard]);

    // Handle item type query param
    useEffect(() => {
        const typeParam = searchParams.get('type') || searchParams.get('item_type');
        if (typeParam) {
            queueMicrotask(() => setItemTypeFilter(typeParam));
        }
    }, [searchParams]);

    // Handle course query param
    useEffect(() => {
        const courseParam = searchParams.get('course_id');
        if (courseParam) {
            queueMicrotask(() => {
                setSelectedCourseFilter(courseParam);
            });
        }
    }, [searchParams]);

    const sortedCategories = useMemo(() => {
        return [...(materialsData.categories || [])].sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
    }, [materialsData.categories]);

    const sortedCourses = useMemo(() => {
        return [...(materialsData.courses || [])].sort((a, b) => {
            return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
        });
    }, [materialsData.courses]);

    const currentCourseInfo = useMemo(() => {
        if (selectedCourseFilter === 'linked') {
            const count = (materialsData.files || []).filter(f => !!f.course_id).length;
            return {
                label: t('Linked to a Course', 'مرتبط بكورس'),
                count,
                isActive: true
            };
        }
        if (selectedCourseFilter === 'unlinked') {
            const count = (materialsData.files || []).filter(f => !f.course_id).length;
            return {
                label: t('Unlinked', 'غير مرتبط'),
                count,
                isActive: true
            };
        }
        if (selectedCourseFilter && selectedCourseFilter !== 'all') {
            const course = sortedCourses.find(c => String(c.id) === String(selectedCourseFilter));
            const count = (materialsData.files || []).filter(f => String(f.course_id) === String(selectedCourseFilter)).length;
            return {
                label: course ? course.title : t('Course', 'كورس'),
                count,
                isActive: true
            };
        }
        return {
            label: t('All courses', 'كل الكورسات'),
            count: (materialsData.files || []).length,
            isActive: false
        };
    }, [selectedCourseFilter, sortedCourses, materialsData.files, t]);

    const itemTypeCounts = useMemo(() => {
        const files = materialsData.files || [];
        return {
            all: files.length,
            material: files.filter(f => (f.item_type || 'material') === 'material').length,
            summary: files.filter(f => f.item_type === 'summary').length,
            tools: files.filter(f => f.item_type === 'tools').length,
            onlymind: files.filter(f => f.item_type === 'onlymind').length
        };
    }, [materialsData.files]);

    const itemTypeLabels = {
        all: { label: t('All Types', 'جميع الأنواع'), icon: '✨' },
        material: { label: t('Materials', 'الماتريال والملفات'), icon: '📚' },
        summary: { label: t('Summaries', 'الملخصات'), icon: '📝' },
        tools: { label: t('Tools', 'الأدوات والبرمجيات'), icon: '🛠️' },
        onlymind: { label: t('OnlyMind', 'OnlyMind'), icon: '🧠' }
    };

    const currentCategoryInfo = useMemo(() => {
        if (selectedCategory && selectedCategory !== 'all') {
            const cat = sortedCategories.find(c => String(c.name || '').trim().toLowerCase() === String(selectedCategory || '').trim().toLowerCase());
            const count = (materialsData.files || []).filter(f => String(f.category_name || '').trim().toLowerCase() === String(selectedCategory || '').trim().toLowerCase()).length;
            return {
                label: cat ? cat.name : selectedCategory,
                count,
                color: cat?.color || '#BC5C29',
                isActive: true
            };
        }
        return {
            label: t('All Categories', 'كل التصنيفات'),
            count: (materialsData.files || []).length,
            color: '#BC5C29',
            isActive: false
        };
    }, [selectedCategory, sortedCategories, materialsData.files, t]);

    const filteredResources = useMemo(() => {
        return filterMaterials(materialsData.files, {
            searchQuery,
            selectedCategory,
            typeFilter,
            statusFilter,
            courseFilter: selectedCourseFilter,
            itemTypeFilter
        });
    }, [materialsData.files, searchQuery, selectedCategory, typeFilter, statusFilter, selectedCourseFilter, itemTypeFilter]);

    const groupedResources = useMemo(() => {
        const sorted = sortMaterials(filteredResources);
        return groupMaterialsByLetter(sorted);
    }, [filteredResources]);

    const availableLetters = useMemo(() => {
        return groupedResources.map(g => g.letter);
    }, [groupedResources]);

    const availablePrefixes = useMemo(() => {
        return extractPrefixes(materialsData.files);
    }, [materialsData.files]);

    const typeCounts = useMemo(() => {
        const counts = { all: 0, pdf: 0, link: 0, note: 0, media: 0, code: 0, doc: 0 };
        materialsData.files.forEach(item => {
            counts.all++;
            const cat = getFileTypeCategory(item);
            if (counts[cat] !== undefined) counts[cat]++;
            else counts.doc++;
        });
        return counts;
    }, [materialsData.files]);

    const isLetterCollapsed = useCallback((letter) => {
        if (userCollapsedMap[letter] !== undefined) {
            return userCollapsedMap[letter];
        }
        return groupedResources.length > 8 ? letter !== groupedResources[0]?.letter : false;
    }, [userCollapsedMap, groupedResources]);

    const scrollToLetter = useCallback((letter) => {
        if (!letter) return;
        setActiveLetter(letter);
        setUserCollapsedMap(prev => ({
            ...prev,
            [letter]: false
        }));

        const targetId = `letter-section-${encodeURIComponent(letter)}`;
        setTimeout(() => {
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    }, []);

    const toggleLetterCollapse = (letter) => {
        setUserCollapsedMap(prev => {
            const current = prev[letter] !== undefined ? prev[letter] : letter !== groupedResources[0]?.letter;
            return {
                ...prev,
                [letter]: !current
            };
        });
    };

    const toggleAllCollapse = () => {
        const allCollapsed = groupedResources.every(g => isLetterCollapsed(g.letter));
        const newMap = {};
        groupedResources.forEach(g => {
            newMap[g.letter] = !allCollapsed;
        });
        setUserCollapsedMap(newMap);
    };

    const handleScrubberChange = (e) => {
        const index = parseInt(e.target.value, 10);
        if (availableLetters[index]) {
            scrollToLetter(availableLetters[index]);
        }
    };

    const resetAllFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setTypeFilter('all');
        setStatusFilter('all');
        setSelectedCourseFilter('all');
    };

    const hasActiveFilters = searchQuery.trim() !== '' ||
        selectedCategory !== 'all' ||
        typeFilter !== 'all' ||
        statusFilter !== 'all' ||
        selectedCourseFilter !== 'all';

    const activeFilterCount = (searchQuery.trim() ? 1 : 0) +
        (selectedCategory !== 'all' ? 1 : 0) +
        (typeFilter !== 'all' ? 1 : 0) +
        (statusFilter !== 'all' ? 1 : 0) +
        (selectedCourseFilter !== 'all' ? 1 : 0);

    const handleViewClick = (item, e) => {
        if (e) e.stopPropagation();
        if (item.file_type === 'link' || isLinkItem(item)) {
            if (item.file_url) {
                window.open(item.file_url, '_blank', 'noopener,noreferrer');
            }
            return;
        }
        setPreviewItem(item);
        setIsFullscreenPreview(false);
    };

    const handleAddCategorySubmit = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        setSavingCat(true);
        try {
            const res = await addMaterialCategory(newCatName.trim(), newCatColor);
            if (res.ok) {
                announceMatteAlert({
                    tone: 'positive',
                    title: t("Category Created", "تم إنشاء التصنيف"),
                    description: t(`Category "${newCatName.trim()}" added.`, `تمت إضافة التصنيف "${newCatName.trim()}" بنجاح.`)
                });
                setNewCatName('');
                setNewCatColor('#10B981');
                setIsCatModalOpen(false);
                await fetchMaterials(true);
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Error", "خطأ"),
                    description: res.error || t("Failed to add category.", "تعذر إضافة التصنيف.")
                });
            }
        } catch (err) {
            console.error("Error creating category:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to add category.", "تعذر إضافة التصنيف.")
            });
        } finally {
            setSavingCat(false);
        }
    };

    const handleAddResourceSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let finalCatName = selectedCategoryName;
            if (isAddingCustomCat && customCategoryInput.trim()) {
                finalCatName = customCategoryInput.trim();
                await addMaterialCategory(finalCatName, '#3B82F6').catch(() => null);
            }

            let fileUrl = '';
            let fileName = '';
            let fileType = 'file';

            if (uploadType === 'file') {
                if (!uploadFile) {
                    announceMatteAlert({
                        tone: 'warning',
                        title: t("File Required", "الملف مطلوب"),
                        description: t("Please choose a file to upload.", "يرجى تحديد ملف لرفعه أولاً.")
                    });
                    setSubmitting(false);
                    return;
                }
                const uploadRes = await uploadFileWithSync(uploadFile, 'materials');
                if (!uploadRes.ok) {
                    announceMatteAlert({
                        tone: 'danger',
                        title: t("Upload Failed", "فشل الرفع"),
                        description: uploadRes.error || t("Could not upload file.", "تعذر رفع الملف.")
                    });
                    setSubmitting(false);
                    return;
                }
                fileUrl = uploadRes.url || uploadRes.data?.url || '';
                fileName = customFileName.trim() || uploadFile.name;
                const ext = uploadFile.name.split('.').pop()?.toLowerCase();
                fileType = ext || 'file';
            } else if (uploadType === 'link') {
                if (!linkUrl.trim()) {
                    announceMatteAlert({
                        tone: 'warning',
                        title: t("URL Required", "الرابط مطلوب"),
                        description: t("Please provide a valid URL.", "يرجى إدخال رابط صالح.")
                    });
                    setSubmitting(false);
                    return;
                }
                fileUrl = linkUrl.trim();
                fileName = linkTitle.trim() || linkUrl.trim();
                fileType = 'link';
            } else if (uploadType === 'note') {
                if (!noteContent.trim()) {
                    announceMatteAlert({
                        tone: 'warning',
                        title: t("Content Required", "المحتوى مطلوب"),
                        description: t("Please write your notes.", "يرجى كتابة محتوى الملاحظة.")
                    });
                    setSubmitting(false);
                    return;
                }
                const formattedNote =
                    noteUploadMode === 'code' && !noteContent.trim().startsWith('```')
                        ? formatCodeSubmission(noteContent.trim(), noteUploadCodeFile)
                        : noteContent;
                fileName = noteTitle.trim() || t("Study Note", "ملاحظة دراسية");
                fileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(formattedNote)}`;
                fileType = 'note';
            }

            const payload = {
                file_name: fileName,
                file_url: fileUrl,
                file_type: fileType,
                category_name: finalCatName || 'General',
                description: itemDescription.trim(),
                reading_status: uploadReadingStatus,
                notes: uploadNotes.trim(),
                course_id: uploadCourseId || null,
                item_type: pageType
            };

            const res = await addMaterialFile(payload);
            if (res.ok) {
                announceMatteAlert({
                    tone: 'positive',
                    title: t("Resource Added", "تمت الإضافة بنجاح"),
                    description: t(`"${fileName}" added to ${config.titleEn}.`, `تمت إضافة "${fileName}" بنجاح.`)
                });
                resetUploadModal();
                await fetchMaterials(true);
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Error", "خطأ"),
                    description: res.error || t("Failed to save resource.", "تعذر حفظ المورد.")
                });
            }
        } catch (err) {
            console.error("Error adding resource:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to save resource.", "تعذر حفظ المورد.")
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEdit = (item) => {
        setEditItem(item);
        setEditName(item.file_name || '');
        setEditUrl(item.file_url || '');
        setEditFileType(item.file_type || 'link');
        setEditDesc(item.description || '');
        setEditCat(item.category_name || 'General');
        setEditReadingStatus(item.reading_status || 'unread');
        setEditNotes(item.notes || '');
        setEditCourseId(item.course_id ? String(item.course_id) : '');
        setEditTargetItemType(item.item_type || pageType);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editItem || !editName.trim()) return;
        setSavingEdit(true);
        try {
            const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
            const payload = {
                file_id: editItem.id,
                file_name: editName.trim(),
                file_url: editUrl.trim(),
                file_type: editFileType,
                category_name: editCat.trim(),
                description: editDesc.trim(),
                reading_status: editReadingStatus,
                notes: editNotes.trim(),
                course_id: editCourseId || null,
                item_type: editTargetItemType
            };
            const res = await updateMaterialFile(payload);
            if (res.ok) {
                // If item moved to another section, filter it out from current view
                if (editTargetItemType !== pageType) {
                    setMaterialsData(prev => ({
                        ...prev,
                        files: prev.files.filter(f => f.id !== editItem.id)
                    }));
                } else {
                    setMaterialsData(prev => ({
                        ...prev,
                        files: prev.files.map(f => f.id === editItem.id ? { ...f, ...payload, course_title: sortedCourses.find(c => String(c.id) === String(editCourseId))?.title || null } : f)
                    }));
                }

                announceMatteAlert({
                    tone: 'positive',
                    title: t("Updated", "تم التعديل"),
                    description: t(`"${editName.trim()}" updated successfully.`, `تم تحديث "${editName.trim()}" بنجاح.`)
                });
                setEditItem(null);
                await fetchMaterials(true);
                if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Error", "خطأ"),
                    description: res.error || t("Failed to update.", "تعذر الحفظ.")
                });
            }
        } catch (err) {
            console.error("Error updating resource:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to update.", "تعذر الحفظ.")
            });
        } finally {
            setSavingEdit(false);
        }
    };

    const handleQuickStatusChange = async (item, newStatus) => {
        if (!item?.id) return;
        try {
            setMaterialsData(prev => ({
                ...prev,
                files: prev.files.map(f => f.id === item.id ? { ...f, reading_status: newStatus } : f)
            }));
            const res = await updateReadingStatus(item.id, newStatus);
            if (!res.ok) {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Status Error", "خطأ في الحالة"),
                    description: res.error || t("Failed to update reading status.", "تعذر حفظ حالة القراءة.")
                });
                fetchMaterials(true);
            }
        } catch (err) {
            console.error("Error updating status:", err);
            fetchMaterials(true);
        }
    };

    const handleOpenNotes = (item, e) => {
        if (e) e.stopPropagation();
        setNotesModalItem(item);
        const rawNotes = item.notes || '';
        const singleFenceMatch = /^```([^\n`]*)\n([\s\S]*?)```$/.exec(rawNotes.trim());
        if (singleFenceMatch) {
            setNotesInputMode('code');
            setNotesCodeTitle((singleFenceMatch[1] || 'snippet.ts').trim() || 'snippet.ts');
            setNotesModalText(singleFenceMatch[2] || '');
        } else {
            setNotesInputMode('text');
            setNotesCodeTitle('snippet.ts');
            setNotesModalText(rawNotes);
        }
    };

    const handleSaveNotesModal = async () => {
        if (!notesModalItem) return;
        setSavingNotes(true);
        try {
            const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
            const rawTrimmed = notesModalText.trim();
            const finalNotes =
                rawTrimmed && notesInputMode === 'code' && !rawTrimmed.startsWith('```')
                    ? formatCodeSubmission(rawTrimmed, notesCodeTitle)
                    : rawTrimmed;
            const res = await updateReadingStatus(notesModalItem.id, notesModalItem.reading_status || 'unread', finalNotes);
            if (res.ok) {
                setMaterialsData(prev => ({
                    ...prev,
                    files: prev.files.map(f => f.id === notesModalItem.id ? { ...f, notes: finalNotes } : f)
                }));
                announceMatteAlert({
                    tone: 'positive',
                    title: t("Notes Saved", "تم حفظ الملاحظات"),
                    description: t("Study notes updated.", "تم حفظ ملاحظاتك بنجاح.")
                });
                setNotesModalItem(null);
                await fetchMaterials(true);
                if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Error", "خطأ"),
                    description: res.error || t("Failed to save notes.", "تعذر حفظ الملاحظات.")
                });
            }
        } catch (err) {
            console.error("Error saving notes:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to save notes.", "تعذر حفظ الملاحظات.")
            });
        } finally {
            setSavingNotes(false);
        }
    };

    useEffect(() => {
        if (!transferTargetCourseId) {
            queueMicrotask(() => {
                setCourseLessonsList([]);
                setTransferTargetLessonId('');
            });
            return;
        }
        fetchCourseLessons(transferTargetCourseId)
            .then(res => {
                if (res?.success && Array.isArray(res.data)) {
                    setCourseLessonsList(res.data);
                    if (res.data.length > 0) {
                        setTransferTargetLessonId(String(res.data[0].id));
                    } else {
                        setTransferTargetLessonId('');
                    }
                } else {
                    setCourseLessonsList([]);
                    setTransferTargetLessonId('');
                }
            })
            .catch(err => {
                console.error("Failed to fetch course lessons:", err);
                setCourseLessonsList([]);
                setTransferTargetLessonId('');
            })
            .finally(() => setLoadingLessons(false));
    }, [transferTargetCourseId]);

    const handleOpenLessonTransfer = (item, e) => {
        e?.stopPropagation?.();
        setLessonTransferItem(item);
        const initialCourseId = item.course_id ? String(item.course_id) : (materialsData.courses?.[0]?.id ? String(materialsData.courses[0].id) : '');
        setTransferTargetCourseId(initialCourseId);
        setNewLessonTitle(item.file_name || '');
        setTransferMode('create_new');
    };

    const handleCreateLessonFromMaterial = async (targetCourseId, itemToUse) => {
        const item = itemToUse || lessonTransferItem || editItem;
        const resolvedCourseId = targetCourseId || item?.course_id || editCourseId;
        if (!resolvedCourseId) {
            announceMatteAlert({
                tone: 'warning',
                title: t("Course Required", "يرجى تحديد الكورس"),
                description: t("Please select a target course first.", "يرجى اختيار الكورس أولاً لإنشاء المحاضرة داخله.")
            });
            return;
        }
        setCreatingLesson(true);
        try {
            const title = newLessonTitle.trim() || item?.file_name || editName || t('New Lesson', 'محاضرة جديدة');
            const res = await createLesson(resolvedCourseId, {
                title,
                description: item?.description || editDesc || null,
                content: item?.notes || editNotes || '',
                source_url: item?.file_url || editUrl || null
            });

            const createdObj = res?.data || res;
            if (res?.success || createdObj?.id) {
                const lessonId = createdObj?.id;
                announceMatteAlert({
                    tone: 'positive',
                    title: t("Lesson Created Successfully", "تم إنشاء المحاضرة بنجاح"),
                    description: t(`New lecture "${title}" created for course.`, `تم إنشاء المحاضرة "${title}" بنجاح ضمن الكورس.`)
                });
                setLessonTransferItem(null);
                setEditItem(null);
                if (lessonId) {
                    router.push(`/courses/${resolvedCourseId}/lessons/${lessonId}`);
                }
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Creation Failed", "تعذر إنشاء المحاضرة"),
                    description: res?.error || 'Failed'
                });
            }
        } catch (err) {
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: err?.message || 'Error creating lesson'
            });
        } finally {
            setCreatingLesson(false);
        }
    };

    const handleExecuteLessonTransfer = async () => {
        if (!lessonTransferItem?.id || !transferTargetLessonId) return;
        setIsTransferringToLesson(true);
        const item = lessonTransferItem;
        try {
            const res = await transferMaterialToLesson(item.id, transferTargetLessonId);
            if (res.ok || res.success) {
                setMaterialsData(prev => ({
                    ...prev,
                    files: prev.files.filter(f => f.id !== item.id)
                }));
                const targetLesson = courseLessonsList.find(l => String(l.id) === String(transferTargetLessonId));
                announceMatteAlert({
                    tone: 'positive',
                    title: t("File Transferred to Lesson", "تم نقل الملف للمحاضرة"),
                    description: t(
                        `"${item.file_name}" was attached to "${targetLesson?.title || 'Lesson'}" and completely removed from the library table.`,
                        `تم إرفاق "${item.file_name}" بالمحاضرة "${targetLesson?.title || 'المحاضرة'}" وحذفه نهائياً من جدول المكتبة.`
                    )
                });
                setLessonTransferItem(null);
                setMoveModalItem(null);
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Error", "خطأ"),
                    description: res.error || t("Failed to transfer file to lesson.", "تعذر نقل الملف إلى المحاضرة.")
                });
            }
        } catch (err) {
            console.error("Error transferring to lesson:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to transfer file to lesson.", "تعذر نقل الملف إلى المحاضرة.")
            });
        } finally {
            setIsTransferringToLesson(false);
        }
    };

    const handleMoveItemExecute = async (targetType) => {
        if (!moveModalItem?.id || !targetType) return;
        setMovingItem(true);
        const item = moveModalItem;
        try {
            const res = await changeItemType(item.id, targetType);
            if (res.ok) {
                setMaterialsData(prev => ({
                    ...prev,
                    files: prev.files.filter(f => f.id !== item.id)
                }));
                const targetMeta = TYPE_CONFIG[targetType] || {};
                announceMatteAlert({
                    tone: 'positive',
                    title: t("Item Moved", "تم نقل العنصر"),
                    description: t(
                        `"${item.file_name}" has been moved to ${targetMeta.titleEn || targetType}.`,
                        `تم نقل "${item.file_name}" إلى قسم ${targetMeta.titleAr || targetType} بنجاح.`
                    )
                });
                setMoveModalItem(null);
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Error", "خطأ"),
                    description: res.error || t("Failed to move item.", "تعذر نقل العنصر.")
                });
            }
        } catch (err) {
            console.error("Error moving item:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to move item.", "تعذر نقل العنصر.")
            });
        } finally {
            setMovingItem(false);
        }
    };

    const openTransferLetterModal = (group) => {
        setTransferLetterGroup(group);
        setTargetLetterCat(sortedCategories[0]?.name || '');
        setCustomLetterCat('');
        setIsCustomLetterCat(false);
        setTargetLetterItemType(pageType);
    };

    const handleTransferLetterGroup = async (e) => {
        e?.preventDefault?.();
        if (!transferLetterGroup || !transferLetterGroup.items?.length) return;

        const finalCategory = (isCustomLetterCat ? customLetterCat.trim() : targetLetterCat.trim());
        if (!finalCategory && targetLetterItemType === pageType) {
            announceMatteAlert({
                tone: 'warning',
                title: t("Category required", "التصنيف مطلوب"),
                description: t("Please select or enter a category name.", "يرجى تحديد أو إدخال اسم التصنيف.")
            });
            return;
        }

        const fileIds = transferLetterGroup.items.map(it => it.id).filter(Boolean);
        if (!fileIds.length) return;

        setIsTransferringLetter(true);
        try {
            const payload = {
                fileIds,
                categoryName: finalCategory || undefined,
                itemType: targetLetterItemType || pageType
            };
            const res = await bulkTransferLetterFiles(payload);
            if (res.ok) {
                announceMatteAlert({
                    tone: 'positive',
                    title: t("Transfer Complete", "تم النقل بنجاح"),
                    description: t(
                        `Transferred ${fileIds.length} items from letter '${transferLetterGroup.letter}' to ${finalCategory || targetLetterItemType}.`,
                        `تم نقل ${fileIds.length} عنصر من حرف '${transferLetterGroup.letter}' إلى ${finalCategory || targetLetterItemType}.`
                    )
                });
                setTransferLetterGroup(null);
                fetchMaterials(true);
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Transfer Failed", "فشل النقل"),
                    description: res.error || t("Could not transfer items.", "تعذر نقل العناصر.")
                });
            }
        } catch (err) {
            console.error("Error transferring letter items:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: err.message || t("An unexpected error occurred.", "حدث خطأ غير متوقع.")
            });
        } finally {
            setIsTransferringLetter(false);
        }
    };

    const handleDeleteExecute = async () => {
        if (!deleteItem) return;
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        setDeleting(true);
        try {
            const res = await deleteMaterialFile(deleteItem.id);
            if (res.ok) {
                const deletedName = deleteItem.file_name;
                setDeleteItem(null);
                setMaterialsData(prev => ({
                    ...prev,
                    files: prev.files.filter(f => f.id !== deleteItem.id)
                }));
                announceMatteAlert({
                    tone: 'positive',
                    title: t("Deleted", "تم الحذف"),
                    description: t(
                        `"${deletedName}" deleted successfully.`,
                        `تم حذف "${deletedName}" بنجاح.`
                    )
                });
                await fetchMaterials(true);
                if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t("Error", "خطأ"),
                    description: res.error || t("Failed to delete file.", "تعذر حذف الملف.")
                });
            }
        } catch (err) {
            console.error("Error deleting file:", err);
            announceMatteAlert({
                tone: 'danger',
                title: t("Error", "خطأ"),
                description: t("Failed to delete file.", "تعذر حذف الملف.")
            });
        } finally {
            setDeleting(false);
        }
    };

    const applyPrefix = (prefix, currentTitle, setter, separator = ' : ') => {
        const cleanPrefix = (prefix || '').trim().replace(/[:\-]$/, '');
        if (!cleanPrefix) return;
        const cleaned = (currentTitle || '')
            .replace(/^(\[[^\]]+\]|[A-Za-z0-9\u0600-\u06FF\s._&/-]+?[:\-])\s*/, '')
            .trim();
        if (!cleaned) {
            setter(`${cleanPrefix}${separator}`);
        } else {
            setter(`${cleanPrefix}${separator}${cleaned}`);
        }
    };

    const renderPrefixPills = (currentVal, setter) => {
        const isArabicMode = pageType === 'onlymind';
        const quickPrefixes = isArabicMode
            ? ['إسلاميات', 'أدب', 'تراجم', 'علم نفس', 'فلسفة', 'تاريخ', 'علوم', 'إعلام', 'أديان']
            : ['AI', 'DEV', 'DESIGN', 'DATABASE', 'DEVOPS', 'TESTING', 'TEST', 'PHP', 'JS', 'CSS', 'ARCH', 'CS', 'DOCS', 'CLI', 'API', 'SEC'];
        const sep = ' : ';
        const sepSymbol = ':';
        const currentPrefixMatch = (currentVal || '').match(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*[:\-]\s+/);
        const activePrefix = currentPrefixMatch ? currentPrefixMatch[1].trim().toUpperCase() : null;

        return (
            <div className="space-y-1.5 my-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#BC5C29] dark:text-[#E8734A]" />
                        <span>{t("Quick Prefix:", "سابقة سريعة:")}</span>
                    </span>
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                applyPrefix(e.target.value, currentVal, setter, sep);
                                e.target.value = '';
                            }
                        }}
                        defaultValue=""
                        className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer max-w-[150px]"
                    >
                        <option value="">{t("More prefixes...", "المزيد من السوابق...")}</option>
                        {availablePrefixes.map(p => {
                            const cleanP = p.replace(/[:\-]$/, '').trim();
                            return <option key={p} value={cleanP}>{cleanP} {sepSymbol}</option>;
                        })}
                    </select>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
                    {quickPrefixes.map(p => {
                        const isActive = activePrefix === p.toUpperCase();
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => {
                                    if (isActive) {
                                        const cleaned = (currentVal || '').replace(/^([A-Za-z0-9\u0600-\u06FF\s._&/-]+?)\s*[:\-]\s*/, '').trim();
                                        setter(cleaned);
                                    } else {
                                        applyPrefix(p, currentVal, setter, sep);
                                    }
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition shrink-0 cursor-pointer border ${
                                    isActive
                                        ? 'bg-[#BC5C29] text-white border-[#BC5C29] shadow-xs'
                                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                                }`}
                            >
                                {p} {sepSymbol}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 w-full max-w-[1780px] mx-auto pb-24 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-serif text-zinc-900 dark:text-zinc-100 tracking-tight font-normal">
                        {t(config.titleEn, config.titleAr)}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-normal max-w-2xl leading-relaxed">
                        {t(config.subtitleEn, config.subtitleAr)}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <Link
                        href="/courses/materials/lessons"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title={t("Browse all lectures and scholarly summaries", "تصفح كافة المحاضرات والملخصات التحليلية")}
                    >
                        <PlayCircle className="w-4 h-4 text-[#BC5C29]" />
                        <span>{t("All Lectures", "فهرس المحاضرات")}</span>
                    </Link>

                    <button
                        onClick={() => setIsCatModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition cursor-pointer shadow-xs"
                    >
                        {t("New Category", "تصنيف جديد")}
                    </button>

                    <button
                        onClick={() => {
                            resetUploadModal();
                            setIsUploadModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E89242] hover:bg-[#d67e2e] text-zinc-950 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>{t(config.addBtnEn, config.addBtnAr)}</span>
                    </button>
                </div>
            </div>

            {/* Type Filters Bar (Sleek Underline Sub-tabs matching image) */}
            <div
                ref={typeTabsRef}
                className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800/80 pb-0.5 text-xs select-none overflow-x-auto scrollbar-none"
            >
                {[
                    { key: 'all', label: t('All files', 'كافة الملفات'), count: typeCounts.all },
                    ...(typeCounts.pdf > 0 ? [{ key: 'pdf', label: t('PDF Books', 'كتب PDF'), count: typeCounts.pdf }] : []),
                    ...(typeCounts.link > 0 ? [{ key: 'link', label: t('Links & Web', 'روابط ومواقع'), count: typeCounts.link }] : []),
                    ...(typeCounts.note > 0 ? [{ key: 'note', label: t('Study notes', 'ملاحظات دراسية'), count: typeCounts.note }] : []),
                    ...(typeCounts.media > 0 ? [{ key: 'media', label: t('Media', 'وسائط'), count: typeCounts.media }] : []),
                    ...(typeCounts.code > 0 ? [{ key: 'code', label: t('Code & Zips', 'أكواد ومضغوطة'), count: typeCounts.code }] : []),
                    ...(typeCounts.doc > 0 ? [{ key: 'doc', label: t('Documents', 'مستندات'), count: typeCounts.doc }] : [])
                ].map(tab => {
                    const isActive = typeFilter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setTypeFilter(tab.key)}
                            className={`pb-2.5 border-b-2 text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap font-medium ${
                                isActive
                                    ? 'border-[#E89242] text-zinc-900 dark:text-white font-bold'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                isActive
                                    ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300'
                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-500'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search & Filters Controls Bar matching image */}
            <div className="space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Left: Search Bar & Courses Dropdown paired together taking the pill concept */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                        {/* Search Pill */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[260px] max-w-md">
                            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={t("Search items, notes, URLs...", "ابحث بالاسم، المحتوى، الرابط...")}
                                className={`w-full bg-white dark:bg-zinc-900/90 border rounded-full ps-9.5 pe-9 py-2 text-xs font-medium outline-none transition shadow-2xs ${
                                    searchQuery
                                        ? 'border-[#BC5C29] text-zinc-900 dark:text-white'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-[#BC5C29]'
                                }`}
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                    title={t("Clear search", "مسح البحث")}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 pointer-events-none">
                                    {filteredResources.length}
                                </span>
                            )}
                        </div>

                        {/* Resource Type Dropdown Pill */}
                        <div className="relative shrink-0">
                            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition whitespace-nowrap cursor-pointer shadow-2xs relative group select-none ${
                                itemTypeFilter !== 'all'
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold border-zinc-900 dark:border-white shadow-sm'
                                    : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}>
                                <span className="text-sm shrink-0">{itemTypeLabels[itemTypeFilter]?.icon || '✨'}</span>
                                <span className="truncate max-w-[120px] sm:max-w-[160px]">
                                    {itemTypeLabels[itemTypeFilter]?.label || t('All Types', 'جميع الأنواع')}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                                    itemTypeFilter !== 'all'
                                        ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900 font-bold'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                }`}>
                                    {itemTypeCounts[itemTypeFilter] ?? 0}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                    itemTypeFilter !== 'all' ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-400'
                                }`} />

                                <select
                                    value={itemTypeFilter}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setItemTypeFilter(val);
                                        if (typeof window !== 'undefined') {
                                            const url = new URL(window.location.href);
                                            if (val === 'all') url.searchParams.delete('type');
                                            else url.searchParams.set('type', val);
                                            window.history.replaceState(null, '', url.toString());
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                                    title={t("Filter by resource type", "تصفية حسب نوع المورد")}
                                >
                                    <option value="all">✨ {t("All Types", "جميع الأنواع")} ({itemTypeCounts.all})</option>
                                    <option value="material">📚 {t("Materials & Files", "الماتريال والملفات")} ({itemTypeCounts.material})</option>
                                    <option value="summary">📝 {t("Summaries & Notes", "الملخصات والملاحظات")} ({itemTypeCounts.summary})</option>
                                    <option value="tools">🛠️ {t("Tools & Utilities", "الأدوات والبرمجيات")} ({itemTypeCounts.tools})</option>
                                    <option value="onlymind">🧠 {t("OnlyMind", "OnlyMind")} ({itemTypeCounts.onlymind})</option>
                                </select>
                            </div>
                        </div>

                        {/* Category Dropdown Pill */}
                        <div className="relative shrink-0">
                            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition whitespace-nowrap cursor-pointer shadow-2xs relative group select-none ${
                                currentCategoryInfo.isActive
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold border-zinc-900 dark:border-white shadow-sm'
                                    : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}>
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: currentCategoryInfo.color || '#BC5C29' }}
                                />
                                <span className="truncate max-w-[120px] sm:max-w-[160px]">{currentCategoryInfo.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                                    currentCategoryInfo.isActive
                                        ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900 font-bold'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                }`}>
                                    {currentCategoryInfo.count}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                    currentCategoryInfo.isActive
                                        ? 'text-zinc-300 dark:text-zinc-700'
                                        : 'text-zinc-400'
                                }`} />

                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                                    title={t("Filter by category", "تصفية حسب التصنيف")}
                                >
                                    <option value="all">{t("All Categories", "كل التصنيفات")} ({(materialsData.files || []).length})</option>
                                    {sortedCategories.map(cat => {
                                        const count = (materialsData.files || []).filter(f => String(f.category_name || '').trim().toLowerCase() === String(cat.name || '').trim().toLowerCase()).length;
                                        return (
                                            <option key={cat.id || cat.name} value={cat.name}>
                                                {cat.name} ({count})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Courses Dropdown Pill - styled identically to category pills */}
                        <div className="relative shrink-0">
                            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition whitespace-nowrap cursor-pointer shadow-2xs relative group select-none ${
                                currentCourseInfo.isActive
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold border-zinc-900 dark:border-white shadow-sm'
                                    : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}>
                                <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#BC5C29]" />
                                <span className="truncate max-w-[130px] sm:max-w-[200px]">{currentCourseInfo.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                                    currentCourseInfo.isActive
                                        ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900 font-bold'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                }`}>
                                    {currentCourseInfo.count}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                    currentCourseInfo.isActive
                                        ? 'text-zinc-300 dark:text-zinc-700'
                                        : 'text-zinc-400'
                                }`} />
                                
                                <select
                                    value={selectedCourseFilter}
                                    onChange={e => setSelectedCourseFilter(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                                    title={t("Filter by course", "تصفية حسب الكورس")}
                                >
                                    <option value="all">{t("All courses", "كل الكورسات")} ({materialsData.files.length})</option>
                                    <option value="linked">{t("Linked to a Course", "مرتبط بكورس")}</option>
                                    <option value="unlinked">{t("Unlinked", "غير مرتبط")}</option>
                                    {sortedCourses.map(c => {
                                        const cCount = (materialsData.files || []).filter(f => String(f.course_id) === String(c.id)).length;
                                        return (
                                            <option key={c.id} value={c.id}>
                                                {c.title} ({cCount})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Right: Status Filters & View Mode Switcher */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none shrink-0 flex-wrap sm:flex-nowrap">
                        <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/90 text-xs shadow-2xs">
                            {[
                                { key: 'all', label: t('All', 'الكل') },
                                { key: 'read', label: t('Read', 'خلصت') },
                                { key: 'in_progress', label: t('In progress', 'مخلصتش') },
                                { key: 'unread', label: t('Unread', 'مقراتش') }
                            ].map(st => (
                                <button
                                    key={st.key}
                                    type="button"
                                    onClick={() => setStatusFilter(st.key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                                        statusFilter === st.key
                                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    {st.label}
                                </button>
                            ))}
                        </div>

                        <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/90 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-full transition cursor-pointer ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white'
                                }`}
                                title={t("Grid View", "عرض الشبكة")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-full transition cursor-pointer ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white'
                                }`}
                                title={t("Table View", "عرض الجدول")}
                            >
                                <TableIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-zinc-500 dark:text-zinc-500 font-medium pt-1">
                    <div className="flex items-center gap-3">
                        <span>{t(`Showing ${filteredResources.length} of ${materialsData.files.length} items`, `عرض ${filteredResources.length} من أصل ${materialsData.files.length} عنصراً`)}</span>
                        {groupedResources.length > 1 && (
                            <button
                                type="button"
                                onClick={toggleAllCollapse}
                                className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer text-[11px] font-medium"
                            >
                                {groupedResources.every(g => isLetterCollapsed(g.letter))
                                    ? t("Expand All", "توسيع الكل")
                                    : t("Collapse All", "طي الكل")}
                            </button>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer text-[11px] font-semibold"
                        >
                            <X className="w-3 h-3" />
                            <span>{t("Reset Filters", "إلغاء الفلاتر")} ({activeFilterCount})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* JUMP TO LETTER Section matching image */}
            {availableLetters.length > 0 && (
                <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                        {t("JUMP TO LETTER", "الانتقال السريع بالحروف")}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                        {availableLetters.map(letter => {
                            const count = groupedResources.find(g => g.letter === letter)?.items.length || 0;
                            const isActive = activeLetter === letter;
                            return (
                                <button
                                    key={letter}
                                    type="button"
                                    onClick={() => scrollToLetter(letter)}
                                    className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                                        isActive
                                            ? 'bg-[#E89242] text-zinc-950 font-bold shadow-sm'
                                            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <span>{letter}</span>
                                    <sup className={`text-[9px] ${isActive ? 'font-black text-zinc-950' : 'text-zinc-400 font-normal'}`}>
                                        {count}
                                    </sup>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Floating Vertical Alphabet Rail on side of screen */}
            {availableLetters.length > 2 && (
                <div className="fixed right-2 sm:right-3 rtl:right-auto rtl:left-2 sm:rtl:left-3 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center py-2 px-1 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl select-none max-h-[75vh] overflow-y-auto scrollbar-none">
                    {availableLetters.map((letter) => {
                        const isActive = activeLetter === letter;
                        return (
                            <button
                                key={`rail-${letter}`}
                                type="button"
                                onClick={() => scrollToLetter(letter)}
                                className={`w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center transition cursor-pointer my-0.5 ${
                                    isActive
                                        ? 'bg-[#E89242] text-zinc-950 shadow-xs font-black scale-125'
                                        : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                                title={letter}
                            >
                                {letter}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-16 space-y-3">
                    <div className="w-8 h-8 border-3 border-[#E89242] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-zinc-500 font-bold">{t("Loading library...", "جاري تحميل المحتوى...")}</p>
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center text-xl">
                        {config.icon}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {t("No items found", "لم يتم العثور على عناصر")}
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        {hasActiveFilters
                            ? t("No items matched your search filters. Try clearing your search or filters.", "لا توجد عناصر مطابقة لبحثك، جرب مسح الفلاتر.")
                            : t(`Your ${config.titleEn} library is empty. Click "+ ${config.addBtnEn}" to get started.`, `هذا القسم فارغ حالياً، اضغط على زر الإضافة للبدء.`)}
                    </p>
                    {hasActiveFilters ? (
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E89242] text-zinc-950 shadow-xs hover:bg-[#d67e2e] transition cursor-pointer"
                        >
                            {t("Clear All Filters", "مسح جميع الفلاتر")}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                resetUploadModal();
                                setIsUploadModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E89242] hover:bg-[#d67e2e] text-zinc-950 transition cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4 inline mr-1" />
                            <span>{t(config.addBtnEn, config.addBtnAr)}</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedResources.map(group => {
                        const isCollapsed = isLetterCollapsed(group.letter);
                        return (
                            <div
                                key={group.letter}
                                id={`letter-section-${encodeURIComponent(group.letter)}`}
                                className="scroll-mt-32 space-y-4 pt-1"
                            >
                                {/* Accordion Header matching image */}
                                <div
                                    onClick={() => toggleLetterCollapse(group.letter)}
                                    className="flex items-center justify-between p-3 px-4 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 cursor-pointer select-none group hover:bg-zinc-200/70 dark:hover:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition"
                                >
                                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap flex-1 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700/60 text-[#E89242] flex items-center justify-center font-bold text-xs shrink-0">
                                            {group.letter}
                                        </div>
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                                            {t(`Letter ${group.letter}`, `حرف ${group.letter}`)}
                                        </span>
                                        <span className="text-xs text-zinc-500 font-normal">
                                            {t(`${group.items.length} items`, `${group.items.length} عناصر`)}
                                        </span>
                                        {group.subTags && group.subTags.length > 0 && (
                                            <div className="hidden sm:flex items-center gap-1.5 flex-wrap ms-2">
                                                {group.subTags.map(({ tag, count }) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={(e) => scrollToSubGroup(group.letter, tag, e)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] hover:bg-[#BC5C29]/25 border border-[#BC5C29]/30 transition hover:scale-105 cursor-pointer"
                                                        title={`${decodeHtmlEntities(tag)} (${count}) - ${t("Jump to section", "الانتقال إلى القسم")}`}
                                                    >
                                                        <span>{decodeHtmlEntities(tag)}</span>
                                                        <span className="text-[9px] opacity-75 font-normal">{count}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openTransferLetterModal(group);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 hover:text-[#BC5C29] dark:hover:text-[#E89242] hover:bg-zinc-50 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs transition cursor-pointer"
                                            title={t(`Transfer all ${group.items.length} items in letter ${group.letter} to another category`, `نقل جميع عناصر حرف ${group.letter} (${group.items.length}) إلى تصنيف آخر`)}
                                        >
                                            <ArrowRightLeft className="w-3.5 h-3.5 text-[#BC5C29] dark:text-[#E89242]" />
                                            <span className="hidden sm:inline">{t("Transfer", "نقل")}</span>
                                        </button>
                                        <div className="p-1 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition">
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
                                        </div>
                                    </div>
                                </div>

                                {!isCollapsed && (
                                    <>
                                        {viewMode === 'grid' ? (
                                            <div className="space-y-6">
                                                {(group.subGroups || [{ tag: group.letter, count: group.items.length, items: group.items }]).map(subGroup => {
                                                    const subGroupKey = `${group.letter}-${subGroup.tag}`;
                                                    const isSubGroupCollapsed = collapsedSubGroups.has(subGroupKey);

                                                    return (
                                                        <div
                                                            key={`subgroup-${subGroupKey}`}
                                                            id={`subgroup-${encodeURIComponent(group.letter)}-${encodeURIComponent(subGroup.tag)}`}
                                                            className="space-y-3.5 scroll-mt-36"
                                                        >
                                                            {/* Collapsible SubGroup Clip / Header */}
                                                            <div
                                                                onClick={() => toggleSubGroupCollapse(subGroupKey)}
                                                                className="flex items-center gap-2.5 pt-1.5 cursor-pointer group/sub select-none"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] border border-[#BC5C29]/30 shadow-2xs group-hover/sub:bg-[#BC5C29]/25 transition">
                                                                        <Tag className="w-3.5 h-3.5" />
                                                                        <span>{decodeHtmlEntities(subGroup.tag)}</span>
                                                                    </span>
                                                                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                                                                        {subGroup.count} {t(subGroup.count === 1 ? "item" : "items", subGroup.count === 1 ? "عنصر" : "عناصر")}
                                                                    </span>
                                                                    <div className="p-1 rounded-full text-zinc-400 group-hover/sub:text-zinc-700 dark:group-hover/sub:text-zinc-200 transition">
                                                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSubGroupCollapsed ? '-rotate-90 rtl:rotate-90' : 'rotate-0'}`} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 h-px bg-zinc-200/80 dark:bg-zinc-800/80 group-hover/sub:bg-zinc-300 dark:group-hover/sub:bg-zinc-700 transition" />
                                                            </div>

                                                            {!isSubGroupCollapsed && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                                    {subGroup.items.map(item => {
                                                    const isLink = isLinkItem(item);
                                                    const hasNotes = item.notes && item.notes.trim();
                                                    // tags removed
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/90 transition-all shadow-xs group"
                                                        >
                                                            <div>
                                                                {/* Top Row: Category Pill & Status Pill */}
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedCategory(item.category_name || 'General');
                                                                        }}
                                                                        className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[170px] cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition"
                                                                    >
                                                                        {item.category_name || 'General'}
                                                                    </span>

                                                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                                        <select
                                                                            value={item.reading_status || 'unread'}
                                                                            onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                                                                            className={`appearance-none cursor-pointer pl-6 pr-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-medium outline-none transition ${
                                                                                item.reading_status === 'read'
                                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                                    : item.reading_status === 'in_progress'
                                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                                    : 'text-zinc-600 dark:text-zinc-400'
                                                                            }`}
                                                                        >
                                                                            <option value="unread" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">{t("Unread", "مقراتش")}</option>
                                                                            <option value="in_progress" className="bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400">{t("In Progress", "مخلصتش")}</option>
                                                                            <option value="read" className="bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400">{t("Read", "خلصت")}</option>
                                                                        </select>
                                                                        <span
                                                                            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${
                                                                                item.reading_status === 'read'
                                                                                    ? 'bg-emerald-500 dark:bg-emerald-400'
                                                                                    : item.reading_status === 'in_progress'
                                                                                    ? 'bg-amber-500 dark:bg-amber-400'
                                                                                    : 'bg-zinc-400 dark:bg-zinc-500'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Middle: Title, Description, Tags on left; Stylized File Badge on right */}
                                                                <div className="flex items-start justify-between gap-4 mt-3.5">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4
                                                                            onClick={(e) => handleViewClick(item, e)}
                                                                            className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-[#E89242] transition leading-snug cursor-pointer line-clamp-2"
                                                                        >
                                                                            {renderResourceTitle(item.file_name)}
                                                                        </h4>

                                                                        {item.description && (
                                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                                                                                {item.description}
                                                                            </p>
                                                                        )}

                                                                        {item.course_title && (
                                                                            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                                                <GraduationCap className="w-3.5 h-3.5 text-[#BC5C29] shrink-0" />
                                                                                <span
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (item.course_id) {
                                                                                            setSelectedCourseFilter(String(item.course_id));
                                                                                        }
                                                                                    }}
                                                                                    className="truncate hover:underline cursor-pointer"
                                                                                >
                                                                                    {item.course_title}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Right Stylized File Illustration Badge */}
                                                                    {(() => {
                                                                        const fileInfo = resolveFileIllustrationType({ item });
                                                                        const isLinkType = fileInfo.label === 'LINK';
                                                                        const isPdfType = fileInfo.label === 'PDF';
                                                                        const isCodeType = fileInfo.label === 'CODE';
                                                                        const isNoteType = fileInfo.label === 'NOTE';
                                                                        const isMediaType = fileInfo.variant === 'video' || fileInfo.variant === 'img';
                                                                        return (
                                                                            <div
                                                                                onClick={(e) => handleViewClick(item, e)}
                                                                                className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/90 flex flex-col items-center justify-center relative shrink-0 p-2 shadow-xs group-hover:border-zinc-400 dark:group-hover:border-zinc-700 transition cursor-pointer select-none"
                                                                            >
                                                                                <div className="flex-1 flex items-center justify-center">
                                                                                    {isLinkType ? (
                                                                                        <Link2 className="w-7 h-7 text-[#E89242] stroke-[2.2]" />
                                                                                    ) : isPdfType ? (
                                                                                        <FileText className="w-7 h-7 text-rose-500 stroke-[2]" />
                                                                                    ) : isCodeType ? (
                                                                                        <Code2 className="w-7 h-7 text-amber-500 stroke-[2]" />
                                                                                    ) : isNoteType ? (
                                                                                        <StickyNote className="w-7 h-7 text-amber-500 stroke-[2]" />
                                                                                    ) : isMediaType ? (
                                                                                        <Video className="w-7 h-7 text-emerald-500 stroke-[2]" />
                                                                                    ) : (
                                                                                        <BookOpen className="w-7 h-7 text-blue-500 stroke-[2]" />
                                                                                    )}
                                                                                </div>
                                                                                <span
                                                                                    className="absolute -bottom-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-xs"
                                                                                    style={{
                                                                                        backgroundColor: isLinkType ? '#E89242' : fileInfo.color,
                                                                                        color: isLinkType ? '#000000' : '#ffffff'
                                                                                    }}
                                                                                >
                                                                                    {fileInfo.label}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>

                                                                {/* Attached Notes & Snippets Preview (Clamped, Indicating More Content) */}
                                                                {hasNotes && (() => {
                                                                    const raw = String(item.notes || '').trim();
                                                                    const lines = raw.split(/\r?\n/).filter(Boolean);
                                                                    const lineCount = lines.length;
                                                                    const hasCodeFences = raw.includes('```');
                                                                    const isLong = lineCount > 2 || raw.length > 120 || hasCodeFences;

                                                                    return (
                                                                        <div
                                                                            onClick={(e) => handleOpenNotes(item, e)}
                                                                            className="mt-3.5 group/notes relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 hover:bg-zinc-100/60 dark:hover:bg-zinc-850/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition p-3 cursor-pointer overflow-hidden shadow-2xs"
                                                                            title={t("Click to view full notes & code", "اضغط لعرض كامل الملاحظات والأكواد")}
                                                                        >
                                                                            <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                                    {hasCodeFences ? (
                                                                                        <Code2 className="w-3.5 h-3.5 text-[#BC5C29] shrink-0" />
                                                                                    ) : (
                                                                                        <StickyNote className="w-3.5 h-3.5 text-[#BC5C29] shrink-0" />
                                                                                    )}
                                                                                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate">
                                                                                        {hasCodeFences ? t("Notes & Code Snippets", "ملاحظات وأكواد") : t("Study Notes", "ملاحظات وتلخيص")}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                                                        {lineCount} {t("lines", "سطر")}
                                                                                    </span>
                                                                                    {isLong && (
                                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#E89242]">
                                                                                            +{Math.max(1, lineCount - 2)} {t("more", "إضافي")}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className={`text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans ${isLong ? 'max-h-20 overflow-hidden relative select-none pointer-events-none' : ''}`}>
                                                                                <SmartCommentBlock content={item.notes} preview={true} maxHeight="80px" />
                                                                                {isLong && (
                                                                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-zinc-50 dark:from-zinc-900/95 via-zinc-50/80 dark:via-zinc-900/70 to-transparent" />
                                                                                )}
                                                                            </div>

                                                                            {isLong && (
                                                                                <div className="mt-2 pt-1 flex items-center justify-between text-[11px] font-bold text-[#BC5C29] group-hover/notes:text-[#9C4D31] dark:group-hover/notes:text-[#E89242] transition">
                                                                                    <span>{t("Click to read full note & snippets", "انقر لعرض كامل الوثيقة والأكواد")}</span>
                                                                                    <ExternalLink className="w-3 h-3 group-hover/notes:translate-x-0.5 transition-transform" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>

                                                            {/* Bottom Actions Row matching image */}
                                                            <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800/70">
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleViewClick(item, e)}
                                                                        className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                                                                        title={isLink ? t("Open Link", "فتح الرابط") : t("Preview / Read", "معاينة وقراءة")}
                                                                    >
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                        <span>{isLink ? t("Open", "فتح") : t("View", "معاينة")}</span>
                                                                    </button>

                                                                    <Link
                                                                        href={`/courses/materials/${item.id}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                                                        title={t("Open Material Workspace", "فتح مساحة عمل المادة")}
                                                                    >
                                                                        <Layers className="w-3.5 h-3.5" />
                                                                        <span>{t("Workspace", "مساحة العمل")}</span>
                                                                    </Link>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleCopyUrl(item, e)}
                                                                        className="p-2 sm:p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition cursor-pointer active:scale-95"
                                                                        title={t("Copy link", "نسخ الرابط")}
                                                                    >
                                                                        {copiedId === item.id ? <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setMoveModalItem(item);
                                                                        }}
                                                                        className="p-2 sm:p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition cursor-pointer active:scale-95"
                                                                        title={t("Move to another section", "نقل إلى قسم آخر")}
                                                                    >
                                                                        <ArrowRightLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleOpenLessonTransfer(item, e)}
                                                                        className="p-2 sm:p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/10 transition cursor-pointer active:scale-95"
                                                                        title={t("Transfer to Course Lesson", "نقل إلى محاضرة داخل كورس")}
                                                                    >
                                                                        <GraduationCap className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleOpenNotes(item, e)}
                                                                        className={`p-2 sm:p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl transition cursor-pointer active:scale-95 ${
                                                                            hasNotes 
                                                                                ? 'text-[#BC5C29] bg-[#BC5C29]/10 hover:bg-[#BC5C29]/20' 
                                                                                : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                                                                        }`}
                                                                        title={hasNotes ? t("Edit / View Notes", "عرض وتعديل الملاحظات") : t("Add Notes", "إضافة ملاحظة")}
                                                                    >
                                                                        <StickyNote className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenEdit(item);
                                                                        }}
                                                                        className="p-2 sm:p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-[#E89242] hover:bg-[#E89242]/10 transition cursor-pointer active:scale-95"
                                                                        title={t("Edit", "تعديل")}
                                                                    >
                                                                        <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteItem(item);
                                                                        }}
                                                                        className="p-2 sm:p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer active:scale-95"
                                                                        title={t("Delete", "حذف")}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
                            {/* Mobile Card List for Table Mode (sm:hidden) */}
                            <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                {(group.subGroups || [{ tag: group.letter, count: group.items.length, items: group.items }]).map(subGroup => {
                                    const subGroupKey = `${group.letter}-${subGroup.tag}`;
                                    const isSubGroupCollapsed = collapsedSubGroups.has(subGroupKey);
                                    return (
                                        <div key={`mob-sub-${subGroupKey}`} className="p-3 space-y-2.5">
                                            <div
                                                onClick={() => toggleSubGroupCollapse(subGroupKey)}
                                                className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] border border-[#BC5C29]/30">
                                                        {decodeHtmlEntities(subGroup.tag)}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 font-mono">({subGroup.count})</span>
                                                </div>
                                                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isSubGroupCollapsed ? '-rotate-90 rtl:rotate-90' : ''}`} />
                                            </div>

                                            {!isSubGroupCollapsed && subGroup.items.map(item => {
                                                const isLink = isLinkItem(item);
                                                const hasNotes = item.notes && item.notes.trim();
                                                return (
                                                    <div key={`mob-item-${item.id}`} className="p-3 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2.5 shadow-2xs">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0" onClick={(e) => handleViewClick(item, e)}>
                                                                <div className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 hover:text-[#BC5C29] cursor-pointer">
                                                                    {renderResourceTitle(item.file_name)}
                                                                </div>
                                                                {item.description && (
                                                                    <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{item.description}</div>
                                                                )}
                                                                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                                                                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">{item.category_name || 'General'}</span>
                                                                    {item.course_title && (
                                                                        <span className="text-zinc-400">· {item.course_title}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                                                            <select
                                                                value={item.reading_status || 'unread'}
                                                                onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                                                                className="text-[10.5px] font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-1 outline-none cursor-pointer"
                                                            >
                                                                <option value="unread">⚪ {t("Unread", "مقراتش")}</option>
                                                                <option value="in_progress">🟡 {t("In Progress", "مخلصتش")}</option>
                                                                <option value="read">🟢 {t("Read", "خلصت")}</option>
                                                            </select>

                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleViewClick(item, e)}
                                                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
                                                                    title={isLink ? t("Open Link", "فتح الرابط") : t("Preview", "معاينة")}
                                                                >
                                                                    {isLink ? <ExternalLink className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <Link
                                                                    href={`/courses/materials/${item.id}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="p-1.5 rounded-lg border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                                                                    title={t("Open Workspace", "فتح مساحة العمل")}
                                                                >
                                                                    <Layers className="w-3.5 h-3.5" />
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleOpenNotes(item, e)}
                                                                    className={`p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 transition ${
                                                                        hasNotes ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' : 'text-zinc-400 bg-zinc-50 dark:bg-zinc-800'
                                                                    }`}
                                                                    title={t("Notes", "الملاحظات")}
                                                                >
                                                                    <StickyNote className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setMoveModalItem(item); }}
                                                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-indigo-500 transition"
                                                                    title={t("Move item", "نقل")}
                                                                >
                                                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleOpenLessonTransfer(item, e)}
                                                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-primary hover:bg-primary/10 transition"
                                                                    title={t("Transfer to Lesson", "نقل إلى محاضرة")}
                                                                >
                                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenEditModal(item); }}
                                                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 transition"
                                                                    title={t("Edit", "تعديل")}
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                                                                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 transition"
                                                                    title={t("Delete", "حذف")}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table (hidden sm:block) */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-start text-xs">
                                    <thead className="bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                                        <tr>
                                            <th className="py-2.5 px-4 font-bold text-start">{t("Title & Resource", "العنوان والمورد")}</th>
                                            <th className="py-2.5 px-3 font-bold text-start">{t("Tag", "الوسم / التاج")}</th>
                                            <th className="py-2.5 px-3 font-bold text-start">{t("Category", "التصنيف")}</th>
                                            <th className="py-2.5 px-3 font-bold text-start">{t("Course", "الكورس")}</th>
                                            <th className="py-2.5 px-3 font-bold text-start">{t("Status", "الحالة")}</th>
                                            <th className="py-2.5 px-4 font-bold text-end">{t("Actions", "الإجراءات")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                        {(group.subGroups || [{ tag: group.letter, count: group.items.length, items: group.items }]).map(subGroup => {
                                            const subGroupKey = `${group.letter}-${subGroup.tag}`;
                                            const isSubGroupCollapsed = collapsedSubGroups.has(subGroupKey);

                                            return (
                                                <React.Fragment key={`table-subgroup-${subGroupKey}`}>
                                                    <tr
                                                        id={`subgroup-${encodeURIComponent(group.letter)}-${encodeURIComponent(subGroup.tag)}`}
                                                        onClick={() => toggleSubGroupCollapse(subGroupKey)}
                                                        className="bg-zinc-50/90 dark:bg-zinc-900/80 border-t border-b border-zinc-200/60 dark:border-zinc-800/60 scroll-mt-40 cursor-pointer select-none group/tablesub"
                                                    >
                                                        <td colSpan={6} className="py-2 px-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] border border-[#BC5C29]/30 shadow-xs">
                                                                        <Tag className="w-3 h-3" />
                                                                        <span>{decodeHtmlEntities(subGroup.tag)}</span>
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                                                                        {subGroup.count} {t(subGroup.count === 1 ? "item" : "items", subGroup.count === 1 ? "عنصر" : "عناصر")}
                                                                    </span>
                                                                </div>
                                                                <div className="p-0.5 text-zinc-400 group-hover/tablesub:text-zinc-700 dark:group-hover/tablesub:text-zinc-200 transition">
                                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSubGroupCollapsed ? '-rotate-90 rtl:rotate-90' : 'rotate-0'}`} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {!isSubGroupCollapsed && subGroup.items.map(item => {
                                                        const isLink = isLinkItem(item);
                                                        const hasNotes = item.notes && item.notes.trim();
                                                        return (
                                                            <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                                                                <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white max-w-sm">
                                                                    <div
                                                                        onClick={(e) => handleViewClick(item, e)}
                                                                        className="cursor-pointer hover:text-[#BC5C29] transition line-clamp-1"
                                                                    >
                                                                        {renderResourceTitle(item.file_name)}
                                                                    </div>
                                                                            {item.description && (
                                                                                <div className="text-[11px] text-zinc-400 font-normal line-clamp-1 mt-0.5">
                                                                                    {item.description}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-3 text-start">
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#E8734A] border border-[#BC5C29]/30 shadow-2xs">
                                                                                <Tag className="w-2.5 h-2.5" />
                                                                                <span>{item.tags || getItemTag(item)}</span>
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300">
                                                                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold">
                                                                                {item.category_name || 'General'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400 max-w-[150px] truncate">
                                                                            {item.course_title ? (
                                                                                <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                                                                                    {item.course_title}
                                                                                </span>
                                                                            ) : '—'}
                                                                        </td>
                                                                        <td className="py-3 px-3">
                                                                            <select
                                                                                value={item.reading_status || 'unread'}
                                                                                onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                                                                                className="text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-1 outline-none cursor-pointer"
                                                                            >
                                                                                <option value="unread">⚪ {t("Unread", "مقراتش")}</option>
                                                                                <option value="in_progress">🟡 {t("In Progress", "مخلصتش")}</option>
                                                                                <option value="read">🟢 {t("Read", "خلصت")}</option>
                                                                            </select>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-end">
                                                                            <div className="inline-flex items-center gap-1 justify-end">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => handleViewClick(item, e)}
                                                                                    className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                                                                    title={isLink ? t("Open Link", "فتح الرابط") : t("Preview", "معاينة")}
                                                                                >
                                                                                    {isLink ? <ExternalLink className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                                </button>
                                                                                <Link
                                                                                    href={`/courses/materials/${item.id}`}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className="p-1.5 rounded-full text-primary hover:bg-primary/10 transition cursor-pointer"
                                                                                    title={t("Open Workspace", "فتح مساحة العمل")}
                                                                                >
                                                                                    <Layers className="w-3.5 h-3.5" />
                                                                                </Link>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => handleOpenNotes(item, e)}
                                                                                    className={`p-1.5 rounded-full transition cursor-pointer ${
                                                                                        hasNotes ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' : 'text-zinc-400 hover:text-amber-600'
                                                                                    }`}
                                                                                    title={t("Notes", "الملاحظات")}
                                                                                >
                                                                                    <StickyNote className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setMoveModalItem(item);
                                                                                    }}
                                                                                    className="p-1.5 rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition cursor-pointer"
                                                                                    title={t("Move item", "نقل العنصر")}
                                                                                >
                                                                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => handleOpenLessonTransfer(item, e)}
                                                                                    className="p-1.5 rounded-full text-zinc-400 hover:text-primary hover:bg-primary/10 transition cursor-pointer"
                                                                                    title={t("Transfer to Lesson", "نقل إلى محاضرة")}
                                                                                >
                                                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleOpenEdit(item);
                                                                                    }}
                                                                                    className="p-1.5 rounded-full text-zinc-400 hover:text-[#BC5C29] hover:bg-[#BC5C29]/10 transition cursor-pointer"
                                                                                    title={t("Edit", "تعديل")}
                                                                                >
                                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setDeleteItem(item);
                                                                                    }}
                                                                                    className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                                                                    title={t("Delete", "حذف")}
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Transfer Letter Group Modal */}
            {transferLetterGroup && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl text-zinc-900 dark:text-white animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <ArrowRightLeft className="w-5 h-5 text-[#BC5C29] dark:text-[#E89242]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <span>{t("Transfer Letter Group", "نقل مجموعة الحرف")}</span>
                                        <span className="w-6 h-6 rounded-md bg-[#BC5C29]/15 dark:bg-[#BC5C29]/25 text-[#BC5C29] dark:text-[#E89242] flex items-center justify-center font-bold text-xs">
                                            {transferLetterGroup.letter}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t(
                                            `Transfer all ${transferLetterGroup.items.length} items starting with '${transferLetterGroup.letter}' to a different category or hub.`,
                                            `نقل جميع العناصر (${transferLetterGroup.items.length}) التي تبدأ بحرف '${transferLetterGroup.letter}' إلى تصنيف أو قسم آخر.`
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (!isTransferringLetter) setTransferLetterGroup(null);
                                }}
                                disabled={isTransferringLetter}
                                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Category selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                    {t("Target Category", "التصنيف المستهدف")}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomLetterCat(!isCustomLetterCat)}
                                    className="text-xs text-[#BC5C29] dark:text-[#E89242] hover:underline font-semibold cursor-pointer"
                                >
                                    {isCustomLetterCat
                                        ? t("Choose existing", "اختر تصنيفاً موجوداً")
                                        : t("+ New Category", "+ تصنيف جديد")}
                                </button>
                            </div>

                            {isCustomLetterCat ? (
                                <input
                                    type="text"
                                    value={customLetterCat}
                                    onChange={(e) => setCustomLetterCat(e.target.value)}
                                    placeholder={t("Enter new category name...", "أدخل اسم التصنيف الجديد...")}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    autoFocus
                                />
                            ) : (
                                <select
                                    value={targetLetterCat}
                                    onChange={(e) => {
                                        if (e.target.value === '__new__') {
                                            setIsCustomLetterCat(true);
                                        } else {
                                            setTargetLetterCat(e.target.value);
                                        }
                                    }}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29] cursor-pointer transition"
                                >
                                    <option value="">{t("Select Category...", "اختر تصنيفاً...")}</option>
                                    {sortedCategories.map(c => (
                                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                    ))}
                                    <option value="__new__">+ {t("New Category...", "تصنيف جديد...")}</option>
                                </select>
                            )}
                        </div>

                        {/* Destination Knowledge Section */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {t("Destination Section", "القسم المستهدف")}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(ALL_DESTINATIONS).map(dest => {
                                    const isSelected = targetLetterItemType === dest.type;
                                    return (
                                        <button
                                            key={dest.type}
                                            type="button"
                                            onClick={() => setTargetLetterItemType(dest.type)}
                                            className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold text-start transition cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#BC5C29] bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#E89242] font-bold shadow-2xs'
                                                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                            <span className="text-base">{dest.icon}</span>
                                            <span className="truncate">{t(dest.labelEn, dest.labelAr)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                            <button
                                type="button"
                                onClick={() => setTransferLetterGroup(null)}
                                disabled={isTransferringLetter}
                                className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                            <button
                                type="button"
                                onClick={handleTransferLetterGroup}
                                disabled={isTransferringLetter || (!targetLetterCat && !customLetterCat && targetLetterItemType === pageType)}
                                className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isTransferringLetter ? (
                                    <>
                                        <CircleDashed className="w-3.5 h-3.5 animate-spin" />
                                        <span>{t("Transferring...", "جارٍ النقل...")}</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                        <span>{t("Transfer All Items", "نقل جميع العناصر")}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Item Destination Modal (.old\.st\input-modal style) */}
            {moveModalItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl text-zinc-900 dark:text-white animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <ArrowRightLeft className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                                        {t("Move Resource", "نقل العنصر إلى قسم آخر")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                        &quot;{moveModalItem.file_name}&quot;
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMoveModalItem(null)}
                                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                                {t("Select target destination:", "اختر القسم المراد النقل إليه:")}
                            </p>

                            <div className="grid grid-cols-1 gap-2.5">
                                                                <button
                                    type="button"
                                    onClick={() => {
                                        const item = moveModalItem;
                                        setMoveModalItem(null);
                                        handleOpenLessonTransfer(item);
                                    }}
                                    className="p-3.5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 flex items-center gap-3.5 transition text-start cursor-pointer group"
                                >
                                    <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                        🎓
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-primary flex items-center justify-between">
                                            <span>{t("Transfer to Course Lesson", "نقل إلى محاضرة داخل كورس")}</span>
                                            <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 rtl:rotate-180 transition" />
                                        </div>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 font-normal">
                                            {t("Attach file to a specific lesson and remove completely from this table", "إرفاق الملف بمحاضرة محددة وحذفه نهائياً من هذا الجدول")}
                                        </p>
                                    </div>
                                </button>
{config.destinations.map(dest => (
                                    <button
                                        key={dest.type}
                                        type="button"
                                        disabled={movingItem}
                                        onClick={() => handleMoveItemExecute(dest.type)}
                                        className={`p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 flex items-center gap-3.5 transition text-start cursor-pointer group ${dest.themeClass} disabled:opacity-50`}
                                    >
                                        <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                            {dest.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                                                <span>{t(dest.labelEn, dest.labelAr)}</span>
                                                <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 rtl:rotate-180 transition" />
                                            </div>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 font-normal">
                                                {t(dest.descEn, dest.descAr)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                            <button
                                type="button"
                                onClick={() => setMoveModalItem(null)}
                                className="px-5 py-2 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer transition"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer to Lesson Modal */}
            {lessonTransferItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl text-zinc-900 dark:text-white animate-in zoom-in-95 duration-150" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                                        {t("Transfer to Lesson", "نقل الملف إلى محاضرة")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                        &quot;{lessonTransferItem.file_name}&quot;
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLessonTransferItem(null)}
                                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Mode Toggle */}
                            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setTransferMode('create_new')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        transferMode === 'create_new'
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{t('Create New Lecture', 'إنشاء محاضرة جديدة')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransferMode('attach')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        transferMode === 'attach'
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    <span>{t('Attach to Existing', 'إرفاق بمحاضرة قائمة')}</span>
                                </button>
                            </div>

                            <div>
                                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                                    {t("Select Target Course", "اختر الكورس المستهدف")}
                                </label>
                                <select
                                    value={transferTargetCourseId}
                                    onChange={(e) => setTransferTargetCourseId(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="">{t("-- Select Course --", "-- اختر الكورس --")}</option>
                                    {(materialsData.courses || []).map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {transferMode === 'create_new' ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                                            {t("Lecture Title", "عنوان المحاضرة الجديدة")}
                                        </label>
                                        <input
                                            type="text"
                                            value={newLessonTitle}
                                            onChange={e => setNewLessonTitle(e.target.value)}
                                            placeholder={t("e.g. Lecture 1 - Fundamentals", "مثال: المحاضرة 1 - المبادئ التأسيسية")}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-[11px] text-primary dark:text-primary-light">
                                        {t(
                                            "Creates a full lecture workspace populated with this material's notes, description, and source link.",
                                            "سيتم إنشاء مساحة عمل لمحاضرة جديدة كاملة تلقائياً مزودة بالملاحظات والوصف والرابط الخاص بهذه المادة."
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                                        {t("Select Target Lesson", "اختر المحاضرة المستهدفة")}
                                    </label>
                                    {loadingLessons ? (
                                        <div className="py-2 text-inkMuted text-[11px] animate-pulse">
                                            {t("Loading course lessons...", "جاري تحميل محاضرات الكورس...")}
                                        </div>
                                    ) : courseLessonsList.length === 0 ? (
                                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center text-zinc-500 text-[11px]">
                                            {transferTargetCourseId 
                                                ? t("No lessons found for this course. Please create a lesson first in the course workspace.", "لا توجد محاضرات في هذا الكورس حالياً. يرجى إنشاء محاضرة أولاً من صفحة الكورس.")
                                                : t("Please select a course first.", "يرجى اختيار الكورس أولاً.")}
                                        </div>
                                    ) : (
                                        <select
                                            value={transferTargetLessonId}
                                            onChange={(e) => setTransferTargetLessonId(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                                        >
                                            {courseLessonsList.map(l => (
                                                <option key={l.id} value={l.id}>
                                                    {l.lesson_number ? `#${l.lesson_number} - ` : ''}{l.title}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                            <button
                                type="button"
                                onClick={() => setLessonTransferItem(null)}
                                disabled={isTransferringToLesson || creatingLesson}
                                className="px-4 py-2 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer transition disabled:opacity-50"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                            {transferMode === 'create_new' ? (
                                <button
                                    type="button"
                                    onClick={() => handleCreateLessonFromMaterial(transferTargetCourseId, lessonTransferItem)}
                                    disabled={creatingLesson || !transferTargetCourseId}
                                    className="px-5 py-2 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer transition disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                                >
                                    {creatingLesson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
                                    <span>{creatingLesson ? t("Creating Lecture...", "جاري إنشاء المحاضرة...") : t("Create & Open Lecture", "إنشاء المحاضرة وفتحها")}</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleExecuteLessonTransfer}
                                    disabled={isTransferringToLesson || !transferTargetLessonId}
                                    className="px-5 py-2 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer transition disabled:opacity-50 shadow-sm"
                                >
                                    {isTransferringToLesson 
                                        ? t("Transferring...", "جاري النقل...") 
                                        : t("Transfer & Remove", "نقل وحذف من الجدول")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

                        {/* Add Category Modal (.old\.st\input-modal style) */}
            {isCatModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl text-zinc-900 dark:text-white animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <FolderPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                                        {t("Create New Category", "إضافة تصنيف جديد")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t("Create a custom category tag for organizing resources.", "إنشاء تصنيف جديد لفرز وتنظيم الملفات والمراجع.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCatModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Category Name", "اسم التصنيف")}
                                    <span className="text-rose-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    required
                                    placeholder={t("e.g. Frontend, System Design, DevOps, Books", "مثال: فرونت إند، سيستم ديزاين، مراجع")}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Color Tag", "لون التمييز")}
                                </label>
                                <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <input
                                        type="color"
                                        value={newCatColor}
                                        onChange={e => setNewCatColor(e.target.value)}
                                        className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300">{newCatColor}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                <button
                                    type="button"
                                    onClick={() => setIsCatModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer transition"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCat}
                                    className="px-6 py-2.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                                >
                                    <span>{savingCat ? t("Saving...", "جاري الحفظ...") : t("Create Category", "إنشاء التصنيف")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Resource Modal (.old\.st\input-modal style) */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-xl space-y-5 shadow-2xl text-zinc-900 dark:text-white my-8 animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                                        {t(config.addBtnEn, config.addBtnAr)}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t(
                                            `Drop a document, paste a web link, or write a structured note in ${config.titleEn}.`,
                                            `ارفع ملفاً أو الصق رابطاً خارجياً أو دون ملاحظة في ${config.titleAr}.`
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={resetUploadModal}
                                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddResourceSubmit} className="space-y-4">
                            {/* Segmented Pill Tabs matching .old\.st\input-modal */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200/70 dark:border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setUploadType('file')}
                                    className={`py-2 px-3 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        uploadType === 'file'
                                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{t("Upload File", "رفع ملف")}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadType('link')}
                                    className={`py-2 px-3 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        uploadType === 'link'
                                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{t("Import via URL", "رابط خارجي")}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadType('note')}
                                    className={`py-2 px-3 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        uploadType === 'note'
                                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <StickyNote className="w-3.5 h-3.5" />
                                    <span>{t("Study Note", "ملاحظة")}</span>
                                </button>
                            </div>

                            {/* Upload Type Specific Fields */}
                            {uploadType === 'file' && (
                                <div className="space-y-3.5">
                                    <div
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const droppedFile = e.dataTransfer?.files?.[0];
                                            if (droppedFile) {
                                                setUploadFile(droppedFile);
                                                if (!customFileName) setCustomFileName(droppedFile.name);
                                            }
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-2xl p-6 text-center bg-zinc-50/50 dark:bg-zinc-900/40 transition cursor-pointer space-y-2.5"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setUploadFile(file);
                                                    if (!customFileName) setCustomFileName(file.name);
                                                }
                                            }}
                                        />
                                        <div className="w-10 h-10 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center mx-auto">
                                            <Upload className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                                {uploadFile ? uploadFile.name : t("Drop your file here", "اسحب وأفلت الملف هنا")}
                                            </p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                {uploadFile
                                                    ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                                                    : t("Support for PDF, DOCX, TXT, ZIP, Code & Media files", "يدعم ملفات PDF و DOCX و TXT و ZIP والأكواد والصور")}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                            className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-2xs cursor-pointer"
                                        >
                                            {t("Browse Files", "تصفح الملفات")}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                            {t("Display Name (optional)", "الاسم المعروض (اختياري)")}
                                        </label>
                                        {renderPrefixPills(customFileName, setCustomFileName)}
                                        <input
                                            type="text"
                                            value={customFileName}
                                            onChange={e => setCustomFileName(e.target.value)}
                                            placeholder={t("Custom file display name (e.g. TOOL - Postman.pdf)", "اسم الملف (مثال: TOOL - Postman.pdf)")}
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {uploadType === 'link' && (
                                <div className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            {t("URL Link", "رابط المورد")}
                                            <span className="text-rose-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            required
                                            value={linkUrl}
                                            onChange={e => setLinkUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                            {t("Link Title", "عنوان الرابط")}
                                        </label>
                                        {renderPrefixPills(linkTitle, setLinkTitle)}
                                        <input
                                            type="text"
                                            value={linkTitle}
                                            onChange={e => setLinkTitle(e.target.value)}
                                            placeholder={t("e.g. TOOL - Cursor Rules or AI - ChatGPT", "مثال: TOOL - Cursor Rules أو AI - ChatGPT")}
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {uploadType === 'note' && (
                                <div className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                            {t("Note Title", "عنوان الملاحظة")}
                                        </label>
                                        {renderPrefixPills(noteTitle, setNoteTitle)}
                                        <input
                                            type="text"
                                            value={noteTitle}
                                            onChange={e => setNoteTitle(e.target.value)}
                                            placeholder={t("e.g. EN - Vocabulary Notes or CS - Algorithms", "مثال: EN - Vocabulary Notes أو CS - Algorithms")}
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                {t("Note Content", "محتوى الملاحظة")}
                                                <span className="text-rose-500 ml-1">*</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                {noteUploadMode === 'code' && (
                                                    <input
                                                        type="text"
                                                        value={noteUploadCodeFile}
                                                        onChange={(e) => setNoteUploadCodeFile(e.target.value)}
                                                        placeholder="snippet.ts"
                                                        className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 w-28 outline-none"
                                                    />
                                                )}
                                                <div className="inline-flex items-center p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNoteUploadMode('text')}
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                                            noteUploadMode === 'text'
                                                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                                                                : 'text-zinc-500'
                                                        }`}
                                                    >
                                                        {t("Text", "نص")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNoteUploadMode('code')}
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                                                            noteUploadMode === 'code'
                                                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                                                                : 'text-zinc-500'
                                                        }`}
                                                    >
                                                        <FileCode className="w-3 h-3" />
                                                        <span>{t("Code", "كود")}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <textarea
                                            rows="5"
                                            required
                                            dir={noteUploadMode === 'code' ? 'ltr' : 'auto'}
                                            value={noteContent}
                                            onChange={e => setNoteContent(e.target.value)}
                                            placeholder={
                                                noteUploadMode === 'code'
                                                    ? "export const config = {\n  ...\n}"
                                                    : t("Write your study notes, commands, or takeaways here...", "اكتب ملاحظاتك، الأوامر، أو ملخصك هنا...")
                                            }
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white leading-relaxed resize-y"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Category & Course Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Category", "التصنيف")}
                                    </label>
                                    {!isAddingCustomCat ? (
                                        <select
                                            value={selectedCategoryName}
                                            onChange={e => {
                                                if (e.target.value === '__new__') {
                                                    setIsAddingCustomCat(true);
                                                } else {
                                                    setSelectedCategoryName(e.target.value);
                                                }
                                            }}
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white cursor-pointer"
                                        >
                                            <option value="">{t("Select Category...", "اختر تصنيفاً...")}</option>
                                            {sortedCategories.map(c => (
                                                <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                            ))}
                                            <option value="__new__">+ {t("New Category...", "تصنيف جديد...")}</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={customCategoryInput}
                                                onChange={e => setCustomCategoryInput(e.target.value)}
                                                placeholder={t("Category name", "اسم التصنيف")}
                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingCustomCat(false)}
                                                className="p-2 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Linked Course", "الكورس المرتبط")}
                                    </label>
                                    <select
                                        value={uploadCourseId}
                                        onChange={e => setUploadCourseId(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white cursor-pointer"
                                    >
                                        <option value="">{t("None (General Material)", "بدون (مورد عام)")}</option>
                                        {sortedCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Description & Reading Status */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Short Description (optional)", "وصف موجز (اختياري)")}
                                </label>
                                <textarea
                                    rows="2"
                                    value={itemDescription}
                                    onChange={e => setItemDescription(e.target.value)}
                                    placeholder={t("Brief summary or details about this item...", "وصف موجز لمحتوى هذا العنصر...")}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs text-zinc-900 dark:text-white outline-none resize-y"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Reading Status", "حالة القراءة")}
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200/70 dark:border-zinc-800">
                                    {[
                                        { key: 'unread', label: t('Unread', 'مقراتش'), emoji: '⚪' },
                                        { key: 'in_progress', label: t('In Progress', 'مخلصتش'), emoji: '🟡' },
                                        { key: 'read', label: t('Read', 'خلصت'), emoji: '🟢' }
                                    ].map(st => (
                                        <button
                                            key={st.key}
                                            type="button"
                                            onClick={() => setUploadReadingStatus(st.key)}
                                            className={`py-2 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                                uploadReadingStatus === st.key
                                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span>{st.emoji}</span>
                                            <span>{st.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                <button
                                    type="button"
                                    onClick={resetUploadModal}
                                    className="px-5 py-2.5 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{submitting ? t("Saving...", "جاري الحفظ...") : t(config.addBtnEn, config.addBtnAr)}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal (.old\.st\input-modal style) */}
            {editItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-xl space-y-5 shadow-2xl text-zinc-900 dark:text-white my-8 animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                                        {t("Edit Resource", "تعديل العنصر")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t("Modify details, section placement, category, or notes.", "تعديل التفاصيل، القسم، التصنيف، أو الملاحظات.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditItem(null)}
                                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            {/* Section Placement (all 4 sections) */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Section Placement", "قسم العنصر")}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
                                    {[
                                        { key: 'material', label: t('Materials', 'الماتريال'), icon: '📚' },
                                        { key: 'summary', label: t('Summaries', 'الملخصات'), icon: '📝' },
                                        { key: 'onlymind', label: 'OnlyMind', icon: '🧠' },
                                        { key: 'tools', label: t('Tools', 'الأدوات'), icon: '🛠️' }
                                    ].map(s => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => setEditTargetItemType(s.key)}
                                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                                editTargetItemType === s.key
                                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span>{s.icon}</span>
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                    {t("Title", "العنوان")}
                                    <span className="text-rose-500 ml-1">*</span>
                                </label>
                                {renderPrefixPills(editName, setEditName)}
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder={t("e.g. TOOL - Postman or AI - Prompt Guide", "مثال: TOOL - Postman أو AI - Prompt Guide")}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("URL / File Path", "الرابط أو المسار")}
                                </label>
                                <input
                                    type="text"
                                    value={editUrl}
                                    onChange={e => setEditUrl(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Category", "التصنيف")}
                                    </label>
                                    <select
                                        value={editCat}
                                        onChange={e => setEditCat(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none cursor-pointer"
                                    >
                                        {sortedCategories.map(c => (
                                            <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Course", "الكورس المرتبط")}
                                    </label>
                                    <select
                                        value={editCourseId}
                                        onChange={e => setEditCourseId(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none cursor-pointer"
                                    >
                                        <option value="">{t("None", "بدون")}</option>
                                        {sortedCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Reading Status", "حالة القراءة")}
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200/70 dark:border-zinc-800">
                                    {[
                                        { key: 'unread', label: t('Unread', 'مقراتش'), emoji: '⚪' },
                                        { key: 'in_progress', label: t('In Progress', 'مخلصتش'), emoji: '🟡' },
                                        { key: 'read', label: t('Read', 'خلصت'), emoji: '🟢' }
                                    ].map(st => (
                                        <button
                                            key={st.key}
                                            type="button"
                                            onClick={() => setEditReadingStatus(st.key)}
                                            className={`py-2 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                                editReadingStatus === st.key
                                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span>{st.emoji}</span>
                                            <span>{st.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Description", "الوصف")}
                                </label>
                                <textarea
                                    rows="2"
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs text-zinc-900 dark:text-white outline-none resize-y"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Notes / Code Snippet (supports ```file.ts ... ```)", "ملاحظات أو كود برمجي")}
                                </label>
                                <textarea
                                    rows="3"
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs text-zinc-900 dark:text-white outline-none resize-y font-mono"
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                <div>
                                    <button
                                        type="button"
                                        disabled={creatingLesson || !editCourseId}
                                        onClick={() => handleCreateLessonFromMaterial(editCourseId, editItem)}
                                        className="px-4 py-2 rounded-full text-xs font-bold bg-[#BC5C29] hover:bg-[#d0633b] text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition"
                                        title={editCourseId ? t("Create a new lecture from this material in the linked course", "إنشاء محاضرة جديدة من هذه المادة بالكورس المحدد") : t("Select a course above first", "اختر الكورس أولاً لإنشاء محاضرة")}
                                    >
                                        {creatingLesson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
                                        <span>{creatingLesson ? t("Creating...", "جاري الإنشاء...") : t("Create Lesson from Material", "إنشاء محاضرة من هذه المادة")}</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditItem(null)}
                                        className="px-5 py-2 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                                    >
                                        {t("Cancel", "إلغاء")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingEdit}
                                        className="px-6 py-2 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                                    >
                                        <span>{savingEdit ? t("Saving...", "جاري الحفظ...") : t("Save Changes", "حفظ التعديلات")}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reading Notes & Code Snippet Modal (.old\.st\input-modal + .old\.st\codebase style) */}
            {notesModalItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-xl space-y-5 shadow-2xl text-zinc-900 dark:text-white my-8 animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <StickyNote className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1">
                                        {notesModalItem.file_name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t("Personal Study Notes & Code Snippets", "ملاحظات الدراسة ومقتطفات الأكواد")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotesModalItem(null)}
                                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Reading Status", "حالة القراءة")}
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200/70 dark:border-zinc-800">
                                    {[
                                        { key: 'unread', label: t('Unread', 'مقراتش'), emoji: '⚪' },
                                        { key: 'in_progress', label: t('In Progress', 'مخلصتش'), emoji: '🟡' },
                                        { key: 'read', label: t('Read', 'خلصت'), emoji: '🟢' }
                                    ].map(st => (
                                        <button
                                            key={st.key}
                                            type="button"
                                            onClick={() => setNotesModalItem(prev => ({ ...prev, reading_status: st.key }))}
                                            className={`py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                                notesModalItem.reading_status === st.key
                                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span>{st.emoji}</span>
                                            <span>{st.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        {t("Format Mode", "نوع المحتوى")}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {notesInputMode === 'code' && (
                                            <input
                                                type="text"
                                                value={notesCodeTitle}
                                                onChange={(e) => setNotesCodeTitle(e.target.value)}
                                                placeholder="theme.ts"
                                                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 w-32 outline-none"
                                            />
                                        )}
                                        <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <button
                                                type="button"
                                                onClick={() => setNotesInputMode('text')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                                                    notesInputMode === 'text'
                                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                                                        : 'text-zinc-500'
                                                }`}
                                            >
                                                {t("Text Note", "نص عادي")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNotesInputMode('code')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                                                    notesInputMode === 'code'
                                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                                                        : 'text-zinc-500'
                                                }`}
                                            >
                                                <FileCode className="w-3.5 h-3.5" />
                                                <span>{t("Code Block", "كود برمجي")}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <textarea
                                    rows="7"
                                    dir={notesInputMode === 'code' ? 'ltr' : 'auto'}
                                    value={notesModalText}
                                    onChange={e => setNotesModalText(e.target.value)}
                                    placeholder={
                                        notesInputMode === 'code'
                                            ? "export const theme = {\n  colors: {\n    primary: '#3b82f6',\n  }\n}"
                                            : t("Write down key insights, page summaries, or fenced ```code``` blocks...", "اكتب ملخصك، استفساراتك، أو أكواد برمجية...")
                                    }
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white leading-relaxed resize-y font-mono"
                                />

                                {notesModalText.trim() && (
                                    <div className="pt-2 space-y-1.5">
                                        <span className="text-[11px] font-semibold text-zinc-400 block">
                                            {t("Live Preview", "معاينة مباشرة")}
                                        </span>
                                        <SmartCommentBlock
                                            content={
                                                notesInputMode === 'code' && !notesModalText.trim().startsWith('```')
                                                    ? formatCodeSubmission(notesModalText.trim(), notesCodeTitle)
                                                    : notesModalText
                                            }
                                            maxHeight="200px"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                            <button
                                type="button"
                                onClick={() => setNotesModalItem(null)}
                                className="px-5 py-2.5 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer transition"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                            <button
                                type="button"
                                disabled={savingNotes}
                                onClick={handleSaveNotesModal}
                                className="px-6 py-2.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                            >
                                <span>{savingNotes ? t("Saving...", "جاري الحفظ...") : t("Save Notes", "حفظ الملاحظات")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Preview Modal */}
            {previewItem && (
                <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 ${isFullscreenPreview ? 'p-0' : 'p-4'}`}>
                    <div className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl text-zinc-900 dark:text-white ${
                        isFullscreenPreview ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[90vh]'
                    }`}>
                        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 text-lg">
                                    {config.icon}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                        {previewItem.file_name}
                                    </h3>
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                        {previewItem.category_name || 'General'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {previewItem.file_url && (
                                    <a
                                        href={getDownloadUrl(previewItem)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                                        title={t("Open / Download", "فتح أو تحميل")}
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                )}
                                <button
                                    onClick={() => setIsFullscreenPreview(prev => !prev)}
                                    className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                                    title={isFullscreenPreview ? t("Exit Fullscreen", "إنهاء ملء الشاشة") : t("Fullscreen", "ملء الشاشة")}
                                >
                                    {isFullscreenPreview ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setPreviewItem(null)}
                                    className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                                    title={t("Close", "إغلاق")}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950/30 space-y-4">
                            {previewItem.file_url?.startsWith('data:text/') ? (
                                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                    <SmartCommentBlock
                                        content={decodeURIComponent(previewItem.file_url.split(',')[1] || '')}
                                        maxHeight="60vh"
                                    />
                                </div>
                            ) : previewItem.file_url?.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={previewItem.file_url}
                                    title={previewItem.file_name}
                                    className="w-full h-[70vh] rounded-2xl border border-zinc-200 dark:border-zinc-800"
                                />
                            ) : (
                                <div className="text-center py-12 space-y-4">
                                    <FileTypeIllustration item={previewItem} />
                                    <p className="text-xs text-zinc-500 font-medium">
                                        {t("Direct preview is not available for this resource type.", "المعاينة المباشرة غير متوفرة لهذا النوع من الملفات.")}
                                    </p>
                                    <a
                                        href={previewItem.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs hover:opacity-90 transition"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>{t("Open Externally", "فتح في نافذة جديدة")}</span>
                                    </a>
                                </div>
                            )}

                            {previewItem.notes && (
                                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                        <StickyNote className="w-3.5 h-3.5" />
                                        <span>{t("Saved Study Notes", "الملاحظات المحفوظة")}</span>
                                    </span>
                                    <SmartCommentBlock content={previewItem.notes} maxHeight="360px" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmDeleteModal
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDeleteExecute}
                title={t("Delete Item", "تأكيد حذف العنصر")}
                message={t(
                    `Are you sure you want to delete this resource? This action cannot be undone.`,
                    `هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
                )}
                itemName={deleteItem?.file_name}
                isDeleting={deleting}
                confirmText={t("Delete", "حذف نهائي")}
                cancelText={t("Cancel", "إلغاء")}
            />
        </div>
    );
}
