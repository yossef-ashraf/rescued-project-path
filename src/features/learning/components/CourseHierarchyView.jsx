'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from '@/shared/next-compat/link';
import { useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import {
    Folder,
    FolderOpen,
    FolderPlus,
    PlusCircle,
    PlayCircle,
    FileText,
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    Move,
    Edit3,
    Trash2,
    Plus,
    ExternalLink,
    Columns3,
    Network,
    Search,
    CheckCircle2,
    Layers,
    ArrowUpRight,
    X,
    LayoutGrid,
    BookOpen,
    Filter,
    ArrowUp,
    ArrowDown,
    GripVertical
} from 'lucide-react';
import NotionTreeNode from './CourseHierarchyTreeNode';
import InspectorPane from './CourseHierarchyInspectorPane';
import {
    fetchCourseHierarchy,
    createHierarchyItem,
    updateHierarchyItem,
    moveHierarchyParent,
    deleteHierarchyItem,
    reorderHierarchyItems
} from '@/features/learning/api/hierarchy.api.js';
import {
    getYoutubeEmbed,
    computeRootNodes,
    computeDescendantCategoryIds,
    sortHierarchyItems
} from '@/features/learning/utils/hierarchy.logic.js';

export default function CourseHierarchyView() {
    const router = useRouter();
    const { t, setActiveDashboard } = useApp();
    const [itemsMap, setItemsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [moveModalItem, setMoveModalItem] = useState(null);
    const [viewMode, setViewMode] = useState('finder');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRootDragOver, setIsRootDragOver] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const [activeCategoryTab, setActiveCategoryTab] = useState('all');
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [categoryCourseSearch, setCategoryCourseSearch] = useState('');
    const [categoryStatusFilter, setCategoryStatusFilter] = useState('all');
    const [isCategoryInspectorOpen, setIsCategoryInspectorOpen] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState({});

    const toggleCategoryCollapse = (catId) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    const handleCollapseAll = (catList) => {
        const collapsed = {};
        (catList || []).forEach(c => {
            collapsed[c.id] = true;
        });
        collapsed['uncategorized'] = true;
        setCollapsedCategories(collapsed);
    };

    const handleExpandAll = () => {
        setCollapsedCategories({});
    };


    const [finderPath, setFinderPath] = useState([]);


    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [modalSubmitting, setModalSubmitting] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [newCategoryParentId, setNewCategoryParentId] = useState('none');
    const [newCourseForm, setNewCourseForm] = useState({
        title: '',
        url: '',
        parent_id: 'none',
        status: 'In Progress',
        total_units: 1,
        completed_units: 0,
        expected_start_date: '',
        expected_end_date: '',
        include_in_stats: true
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editItemType, setEditItemType] = useState('course');
    const [editItemForm, setEditItemForm] = useState({
        id: null,
        title: '',
        url: '',
        parent_id: 'none',
        status: 'In Progress',
        total_units: 1,
        completed_units: 0,
        expected_start_date: '',
        expected_end_date: '',
        include_in_stats: true,
        description: ''
    });

    const handleOpenEditItem = (itemToEdit) => {
        if (!itemToEdit) return;
        const isCat = itemToEdit.type === 'category';
        setEditItemType(isCat ? 'category' : 'course');
        setEditItemForm({
            id: itemToEdit.id,
            title: itemToEdit.title || '',
            url: itemToEdit.url || '',
            parent_id: (!itemToEdit.parent_id || itemToEdit.parent_id === 'none') ? 'none' : String(itemToEdit.parent_id),
            status: itemToEdit.status || 'In Progress',
            total_units: itemToEdit.total_units || 1,
            completed_units: itemToEdit.completed_units || 0,
            expected_start_date: itemToEdit.expected_start_date ? String(itemToEdit.expected_start_date).split('T')[0] : '',
            expected_end_date: itemToEdit.expected_end_date ? String(itemToEdit.expected_end_date).split('T')[0] : '',
            include_in_stats: !(itemToEdit.include_in_stats === 0 || itemToEdit.include_in_stats === '0' || itemToEdit.include_in_stats === false),
            description: itemToEdit.description || ''
        });
        setIsCategoryInspectorOpen(false);
        setIsEditModalOpen(true);
    };

    const handleEditItemSubmit = async (e) => {
        e.preventDefault();
        if (!editItemForm.title.trim() || !editItemForm.id) return;
        setModalSubmitting(true);
        try {
            const body = {
                action: 'update',
                id: editItemForm.id,
                type: editItemType,
                title: editItemForm.title.trim(),
                parent_id: (editItemForm.parent_id === 'none' || editItemForm.parent_id === '') ? null : parseInt(editItemForm.parent_id, 10),
                description: editItemForm.description || null
            };
            if (editItemType === 'course') {
                body.url = editItemForm.url;
                body.total_units = parseInt(editItemForm.total_units, 10) || 1;
                body.completed_units = parseInt(editItemForm.completed_units, 10) || 0;
                body.status = editItemForm.status;
                body.expected_start_date = editItemForm.expected_start_date || null;
                body.expected_end_date = editItemForm.expected_end_date || null;
                body.include_in_stats = editItemForm.include_in_stats ? 1 : 0;
            }
            const res = await updateHierarchyItem(body);
            if (res.ok) {
                setIsEditModalOpen(false);
                loadData();
            } else {
                const errData = await res.json().catch(() => ({}));
                announceMatteAlert({ tone: 'danger', title: t('Save failed', 'فشل الحفظ'), description: errData.error || t("Failed to save changes", "فشل حفظ التعديلات") });
            }
        } catch (err) {
            console.error('Error updating item:', err);
            announceMatteAlert({ tone: 'danger', title: t('Unexpected error', 'خطأ غير متوقع'), description: t("An unexpected error occurred while saving", "حدث خطأ غير متوقع أثناء الحفظ") });
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleOpenAddCategory = (targetParentId) => {
        const defaultParent = targetParentId !== undefined
            ? (targetParentId === null ? 'none' : String(targetParentId))
            : (selectedItem?.type === 'category' ? String(selectedItem.id) : 'none');
        setNewCategoryParentId(defaultParent);
        setNewCategoryTitle('');
        setIsAddCategoryModalOpen(true);
    };

    const handleOpenAddCourse = (targetParentId) => {
        const defaultParent = targetParentId !== undefined
            ? (targetParentId === null ? 'none' : String(targetParentId))
            : (selectedItem?.type === 'category' 
                ? String(selectedItem.id) 
                : (selectedItem?.parent_id ? String(selectedItem.parent_id) : 'none'));
        setNewCourseForm({
            title: '',
            url: '',
            parent_id: defaultParent,
            status: 'In Progress',
            total_units: 1,
            completed_units: 0,
            expected_start_date: new Date().toISOString().split('T')[0],
            expected_end_date: '',
            include_in_stats: true
        });
        setIsAddCourseModalOpen(true);
    };

    const handleCreateCategorySubmit = async (e) => {
        e.preventDefault();
        if (!newCategoryTitle.trim()) return;
        setModalSubmitting(true);
        try {
            const cleanTitle = newCategoryTitle.trim();
            const body = {
                action: 'create',
                type: 'category',
                title: cleanTitle,
                parent_id: (newCategoryParentId === 'none' || newCategoryParentId === '') ? null : parseInt(newCategoryParentId, 10)
            };
            const res = await createHierarchyItem(body);
            if (res && (res.ok || res.id || res.success)) {
                announceMatteAlert({
                    tone: 'success',
                    title: t('Category Created', 'تم إنشاء التصنيف'),
                    description: cleanTitle
                });
                setNewCategoryTitle('');
                setIsAddCategoryModalOpen(false);
                loadData();
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t('Creation Failed', 'فشل الإنشاء'),
                    description: res?.error || t('Failed to create category', 'فشل إنشاء التصنيف')
                });
            }
        } catch (err) {
            announceMatteAlert({
                tone: 'danger',
                title: t('Error', 'خطأ'),
                description: err?.message || t('Failed to create category', 'فشل إنشاء التصنيف')
            });
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleCreateCourseSubmit = async (e) => {
        e.preventDefault();
        if (!newCourseForm.title.trim()) return;
        setModalSubmitting(true);
        try {
            const cleanTitle = newCourseForm.title.trim();
            const body = {
                action: 'create',
                type: 'course',
                title: cleanTitle,
                url: newCourseForm.url,
                total_units: parseInt(newCourseForm.total_units, 10) || 1,
                completed_units: parseInt(newCourseForm.completed_units, 10) || 0,
                status: newCourseForm.status,
                expected_start_date: newCourseForm.expected_start_date || null,
                expected_end_date: newCourseForm.expected_end_date || null,
                parent_id: (newCourseForm.parent_id === 'none' || newCourseForm.parent_id === '') ? null : parseInt(newCourseForm.parent_id, 10),
                include_in_stats: newCourseForm.include_in_stats === false ? 0 : 1
            };
            const res = await createHierarchyItem(body);
            if (res && (res.ok || res.id || res.success)) {
                announceMatteAlert({
                    tone: 'success',
                    title: t('Course Created', 'تم إنشاء الكورس'),
                    description: cleanTitle
                });
                setIsAddCourseModalOpen(false);
                loadData();
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t('Creation Failed', 'فشل الإنشاء'),
                    description: res?.error || t('Failed to create course', 'فشل إنشاء الكورس')
                });
            }
        } catch (err) {
            announceMatteAlert({
                tone: 'danger',
                title: t('Error', 'خطأ'),
                description: err?.message || t('Failed to create course', 'فشل إنشاء الكورس')
            });
        } finally {
            setModalSubmitting(false);
        }
    };

    const loadData = useCallback(() => {
        setLoading(true);
        fetchCourseHierarchy()
            .then(list => {
                const map = {};
                list.forEach(item => {
                    if (String(item.parent_id) === String(item.id)) {
                        item.parent_id = null;
                    }
                    map[item.id] = item;
                });
                setItemsMap(map);
                setSelectedItem(prev => prev ? map[prev.id] || null : null);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch courses error:", err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        setActiveDashboard('courses');
        fetchCourseHierarchy()
            .then(list => {
                const map = {};
                list.forEach(item => {
                    if (String(item.parent_id) === String(item.id)) {
                        item.parent_id = null;
                    }
                    map[item.id] = item;
                });
                setItemsMap(map);
                setSelectedItem(prev => prev ? map[prev.id] || null : null);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch courses error:", err);
                setLoading(false);
            });
    }, [setActiveDashboard]);


    const rootNodes = useMemo(() => computeRootNodes(itemsMap), [itemsMap]);

    const allCategories = useMemo(() => {
        return sortHierarchyItems(Object.values(itemsMap).filter(item => item.type?.toLowerCase() === 'category' || item.resource_type?.toLowerCase() === 'category'));
    }, [itemsMap]);

    const rootCategories = useMemo(() => {
        return rootNodes.filter(item => item.type?.toLowerCase() === 'category' || item.resource_type?.toLowerCase() === 'category');
    }, [rootNodes]);

    const allCourses = useMemo(() => {
        return sortHierarchyItems(Object.values(itemsMap).filter(item => item.type?.toLowerCase() !== 'category' && item.resource_type?.toLowerCase() !== 'category'));
    }, [itemsMap]);


    const getCategoryCourses = useMemo(() => {
        const catList = Object.values(itemsMap).filter(item => item.type?.toLowerCase() === 'category' || item.resource_type?.toLowerCase() === 'category');
        const catMap = computeDescendantCategoryIds(catList);

        return (catId, directOnly = false) => {
            if (catId === 'all') return allCourses;
            if (catId === 'uncategorized') {
                return sortHierarchyItems(allCourses.filter(c => !c.parent_id || !itemsMap[c.parent_id]));
            }
            if (directOnly) {
                return sortHierarchyItems(allCourses.filter(c => String(c.parent_id) === String(catId)));
            }
            const validIds = catMap[catId] || new Set([String(catId)]);
            return sortHierarchyItems(allCourses.filter(c => c.parent_id && validIds.has(String(c.parent_id))));
        };
    }, [itemsMap, allCourses]);


    const finderScrollRef = useRef(null);

    const tabsCategories = useMemo(() => {
        const allCats = Object.values(itemsMap).filter(item => item.type?.toLowerCase() === 'category' || item.resource_type?.toLowerCase() === 'category');
        const roots = sortHierarchyItems(allCats.filter(c => !c.parent_id || !itemsMap[c.parent_id]));
        const ordered = [];
        const visited = new Set();

        const walk = (cat) => {
            if (!cat || visited.has(String(cat.id))) return;
            visited.add(String(cat.id));
            ordered.push(cat);
            const subCats = sortHierarchyItems(allCats.filter(c => String(c.parent_id) === String(cat.id)));
            subCats.forEach(walk);
        };
        roots.forEach(walk);
        sortHierarchyItems(allCats).forEach(walk);

        const q = categorySearchQuery.trim().toLowerCase();
        const filtered = q ? ordered.filter(c => (c.title || '').toLowerCase().includes(q)) : ordered;

        return filtered.map(cat => {
            const courses = getCategoryCourses(cat.id, false);
            const directCourses = getCategoryCourses(cat.id, true);
            const completed = courses.filter(c => Number(c.progress_percentage) >= 100 || c.status?.toLowerCase() === 'completed').length;
            const isRoot = !cat.parent_id || !itemsMap[cat.parent_id];
            const parentCat = !isRoot && cat.parent_id ? itemsMap[cat.parent_id] : null;
            return {
                ...cat,
                isRoot,
                parentTitle: parentCat ? parentCat.title : null,
                courseCount: courses.length,
                directCourseCount: directCourses.length,
                completedCount: completed
            };
        });
    }, [itemsMap, getCategoryCourses, categorySearchQuery]);

    const rootTabsCategories = useMemo(() => {
        return tabsCategories.filter(cat => cat.isRoot);
    }, [tabsCategories]);

    const uncategorizedCourses = useMemo(() => {
        return sortHierarchyItems(allCourses.filter(c => !c.parent_id || !itemsMap[c.parent_id]));
    }, [allCourses, itemsMap]);


    useEffect(() => {
        if (!loading && rootNodes.length > 0 && finderPath.length === 0) {
            const firstCat = rootNodes.find(n => n.type?.toLowerCase() === 'category' || n.resource_type?.toLowerCase() === 'category') || rootNodes[0];
            const timer = setTimeout(() => {
                setFinderPath([firstCat.id]);
                setSelectedItem(firstCat);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [loading, rootNodes, finderPath]);


    const getChildren = useCallback((parentId) => {
        const filtered = Object.values(itemsMap).filter(item => {
            if (parentId === null) {
                return !item.parent_id || item.parent_id === null || !itemsMap[item.parent_id];
            }
            return String(item.parent_id) === String(parentId);
        });
        return sortHierarchyItems(filtered);
    }, [itemsMap]);

    const finderColumns = useMemo(() => {
        const cols = [];

        cols.push({
            level: 0,
            parentId: null,
            parentTitle: t("Root Categories", "التصنيفات الرئيسية"),
            items: sortHierarchyItems(rootNodes)
        });

        for (let i = 0; i < finderPath.length; i++) {
            const currentId = finderPath[i];
            const currentItem = itemsMap[currentId];
            if (currentItem && (currentItem.type?.toLowerCase() === 'category' || currentItem.resource_type?.toLowerCase() === 'category')) {
                const children = getChildren(currentId);
                cols.push({
                    level: i + 1,
                    parentId: currentId,
                    parentTitle: currentItem.title,
                    items: children
                });
            }
        }
        return cols;
    }, [itemsMap, rootNodes, finderPath, t, getChildren]);

    const handleSelectFinderItem = (colIndex, item) => {
        setSelectedItem(item);
        const newPath = finderPath.slice(0, colIndex);
        if (item.type?.toLowerCase() === 'category' || item.resource_type?.toLowerCase() === 'category') {
            newPath.push(item.id);
        }
        setFinderPath(newPath);

        setTimeout(() => {
            if (finderScrollRef.current) {
                const el = finderScrollRef.current;
                const isRTL = typeof document !== 'undefined' && (document.dir === 'rtl' || document.documentElement.dir === 'rtl');
                el.scrollTo({
                    left: isRTL ? -el.scrollWidth : el.scrollWidth,
                    behavior: 'smooth'
                });
            }
        }, 60);
    };

    const handleQuickUpdate = async (item, newCompletedUnits) => {
        try {
            const body = {
                action: 'update',
                id: item.id,
                type: item.type,
                title: item.title,
                url: item.url,
                total_units: item.total_units,
                completed_units: newCompletedUnits,
                status: item.status,
                expected_start_date: item.expected_start_date,
                expected_end_date: item.expected_end_date,
                parent_id: item.parent_id
            };
            const res = await createHierarchyItem(body);
            if (res.ok) {
                loadData();
            }
        } catch (err) {
            console.error('Error updating progress:', err);
        }
    };

    const handleQuickUpdateParent = async (item, newParentId) => {
        if (!item) return;

        if (newParentId && String(item.id) === String(newParentId)) {
            console.warn("Prevented setting item as its own parent");
            return;
        }

        const targetParent = (newParentId && newParentId !== 'null' && newParentId !== 'none') ? parseInt(newParentId) : null;

        if (targetParent) {
            let current = itemsMap[targetParent];
            while (current && current.parent_id) {
                if (String(current.parent_id) === String(item.id)) {
                    console.warn("Prevented circular parenting");
                    return;
                }
                current = itemsMap[current.parent_id];
            }
        }

        setItemsMap(prev => ({
            ...prev,
            [item.id]: {
                ...prev[item.id],
                parent_id: targetParent
            }
        }));

        try {
            const body = {
                action: 'move_parent',
                id: item.id,
                parent_id: targetParent
            };
            const res = await createHierarchyItem(body);
            if (res.ok) {
                loadData();
            }
        } catch (err) {
            console.error('Error updating parent category:', err);
            loadData();
        }
    };

    const handleMoveItemOrder = async (colItems, index, direction, e) => {
        if (e) e.stopPropagation();
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= colItems.length) return;

        const newItems = [...colItems];
        const [moved] = newItems.splice(index, 1);
        newItems.splice(targetIndex, 0, moved);

        setItemsMap(prev => {
            const next = { ...prev };
            newItems.forEach((itm, idx) => {
                if (next[itm.id]) {
                    next[itm.id] = { ...next[itm.id], sort_order: idx };
                }
            });
            return next;
        });

        try {
            const orderedIds = newItems.map(it => it.id);
            await reorderHierarchyItems(orderedIds);
            announceMatteAlert({
                tone: 'positive',
                title: t('Order Updated', 'تم تحديث الترتيب'),
                description: t('Order saved successfully.', 'تم حفظ الترتيب بنجاح.')
            });
        } catch (err) {
            console.error('Error saving order:', err);
        }
    };

    const handleDropReorder = async (colItems, draggedId, targetIndex) => {
        const fromIndex = colItems.findIndex(it => String(it.id) === String(draggedId));
        if (fromIndex === -1 || fromIndex === targetIndex) return;

        const newItems = [...colItems];
        const [moved] = newItems.splice(fromIndex, 1);
        newItems.splice(targetIndex, 0, moved);

        setItemsMap(prev => {
            const next = { ...prev };
            newItems.forEach((itm, idx) => {
                if (next[itm.id]) {
                    next[itm.id] = { ...next[itm.id], sort_order: idx };
                }
            });
            return next;
        });

        try {
            const orderedIds = newItems.map(it => it.id);
            await reorderHierarchyItems(orderedIds);
            announceMatteAlert({
                tone: 'positive',
                title: t('Order Updated', 'تم تحديث الترتيب'),
                description: t('Order saved successfully.', 'تم حفظ الترتيب بنجاح.')
            });
        } catch (err) {
            console.error('Error saving order:', err);
        }
    };

    const handleDelete = (id, name = '') => {
        const targetName = name || itemsMap[id]?.name || '';
        setDeleteTarget({ id, name: targetName });
    };

    const confirmDeleteCourse = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await deleteHierarchyItem(deleteTarget.id);
            if (res.ok) {
                setSelectedItem(null);
                loadData();
                setDeleteTarget(null);
            }
        } catch (err) {
            console.error("Delete course error:", err);
        } finally {
            setIsDeleting(false);
        }
    };



    return (
        <div className="space-y-8 animate-fade-in pb-24 w-full">

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29] flex items-center justify-center font-bold">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>{t("Course Hierarchy & Structure Explorer", "مستكشف وهيكل الكورسات والتصنيفات")}</span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {t("Browse with Category Strip, Miller Finder columns, or interactive Notion tree.", "تصفح بشريط التصنيفات المباشر، أو أعمدة Finder، أو شجرة Notion التفاعلية.")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
                    <div className="bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl flex items-center border border-zinc-200 dark:border-zinc-700/80">
                        <button
                            onClick={() => setViewMode('tabs')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                viewMode === 'tabs'
                                    ? 'bg-white dark:bg-zinc-900 text-[#BC5C29] dark:text-[#BC5C29] shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>{t("Category Strip", "شريط التصنيفات")}</span>
                        </button>

                        <button
                            onClick={() => setViewMode('finder')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                viewMode === 'finder'
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            <Columns3 className="w-3.5 h-3.5" />
                            <span>{t("Finder Columns", "أعمدة Finder")}</span>
                        </button>

                        <button
                            onClick={() => setViewMode('tree')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                viewMode === 'tree'
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            <Network className="w-3.5 h-3.5" />
                            <span>{t("Notion Tree", "شجرة Notion")}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link 
                            href="/courses/add-category"
                            className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            title={t("Open full Forge Category page", "فتح صفحة إنشاء تصنيف جديد")}
                        >
                            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                            <span>{t("Forge Category", "إنشاء تصنيف")}</span>
                        </Link>
                        <Link 
                            href="/courses/add-course"
                            className="bg-[#BC5C29] hover:bg-[#BC5C29]/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            title={t("Open full Register Track page", "فتح صفحة تسجيل مسار وكورس جديد")}
                        >
                            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{t("Register Track", "تسجيل مسار")}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {viewMode === 'finder' && (
                <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[620px] animate-fade-in">
                    <div className="px-5 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 flex items-center gap-2 text-xs font-bold overflow-x-auto">
                        <span className="text-zinc-400">Path:</span>
                        <button 
                            onClick={() => {
                                setFinderPath([]);
                                setSelectedItem(rootNodes[0] || null);
                            }}
                            className="text-zinc-600 dark:text-zinc-300 hover:text-[#BC5C29] flex items-center gap-1 shrink-0"
                        >
                            <span>Codex Learning</span>
                        </button>
                        {finderPath.map((id, idx) => {
                            const item = itemsMap[id];
                            if (!item) return null;
                            const isLast = idx === finderPath.length - 1 && selectedItem?.id === id;
                            return (
                                <React.Fragment key={id}>
                                    <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0 rtl:rotate-180" />
                                    <button 
                                        onClick={() => {
                                            setFinderPath(finderPath.slice(0, idx + 1));
                                            setSelectedItem(item);
                                        }}
                                        title={item.title}
                                        className={`shrink-0 truncate max-w-[280px] sm:max-w-[360px] ${
                                            isLast ? 'text-[#BC5C29] dark:text-[#BC5C29] font-black' : 'text-zinc-600 dark:text-zinc-300 hover:text-[#BC5C29]'
                                        }`}
                                    >
                                        {item.title}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                        {selectedItem && !finderPath.includes(selectedItem.id) && (
                            <>
                                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0 rtl:rotate-180" />
                                <span className="text-[#BC5C29] dark:text-[#BC5C29] font-black shrink-0 truncate max-w-[280px] sm:max-w-[360px]" title={selectedItem.title}>
                                    {selectedItem.title}
                                </span>
                            </>
                        )}
                    </div>

                    <div 
                        ref={finderScrollRef}
                        className="flex-1 flex overflow-x-auto divide-x divide-zinc-200 dark:divide-zinc-800 rtl:divide-x-reverse overscroll-x-contain scroll-smooth snap-x sm:snap-none"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center py-24">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#BC5C29]"></div>
                            </div>
                        ) : (
                            <>
                                {finderColumns.map((col, colIndex) => (
                                    <div 
                                        key={col.parentId || 'root'} 
                                        className="w-[85vw] sm:w-[350px] md:w-[380px] lg:w-[420px] shrink-0 flex flex-col h-[580px] bg-zinc-50/30 dark:bg-zinc-900/30 snap-start sm:snap-align-none"
                                    >
                                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider truncate max-w-[320px]" title={col.parentTitle}>
                                                {col.parentTitle}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                                {col.items.length}
                                            </span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                            {col.items.map((item, itemIdx) => {
                                                const isCategory = item.type?.toLowerCase() === 'category' || item.resource_type?.toLowerCase() === 'category';
                                                const isPathActive = finderPath[colIndex] === item.id;
                                                const isSelected = selectedItem?.id === item.id;
                                                const subChildren = isCategory ? getChildren(item.id) : [];
                                                const progress = Math.round(Number(item.progress_percentage) || 0);

                                                return (
                                                    <div
                                                        key={item.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.stopPropagation();
                                                            e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, colIndex, index: itemIdx }));
                                                            e.dataTransfer.effectAllowed = 'move';
                                                        }}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            e.dataTransfer.dropEffect = 'move';
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            try {
                                                                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                                if (data && data.colIndex === colIndex && data.id !== item.id) {
                                                                    handleDropReorder(col.items, data.id, itemIdx);
                                                                }
                                                            } catch (_) {}
                                                        }}
                                                        onClick={() => handleSelectFinderItem(colIndex, item)}
                                                        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 text-xs font-semibold ${
                                                            isSelected || isPathActive
                                                                ? 'bg-[#BC5C29] text-white shadow-xs'
                                                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                            <GripVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 hover:opacity-100 cursor-grab shrink-0 transition" />
                                                            {isCategory ? (
                                                                isSelected || isPathActive ? (
                                                                    <FolderOpen className="w-4 h-4 shrink-0 text-white" />
                                                                ) : (
                                                                    <Folder className="w-4 h-4 shrink-0 text-[#BC5C29]" />
                                                                )
                                                            ) : (
                                                                item.url?.includes('youtu') ? (
                                                                    <PlayCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-rose-500'}`} />
                                                                ) : (
                                                                    <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                                                                )
                                                            )}
                                                            <span className="line-clamp-3 break-words leading-snug" title={item.title}>{item.title}</span>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0 pl-1">
                                                            {/* Reorder Buttons (Move Up / Down) */}
                                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    disabled={itemIdx === 0}
                                                                    onClick={(e) => handleMoveItemOrder(col.items, itemIdx, 'up', e)}
                                                                    className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${itemIdx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                    title={t("Move Up", "تحريك لأعلى")}
                                                                >
                                                                    <ArrowUp className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={itemIdx === col.items.length - 1}
                                                                    onClick={(e) => handleMoveItemOrder(col.items, itemIdx, 'down', e)}
                                                                    className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${itemIdx === col.items.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                    title={t("Move Down", "تحريك لأسفل")}
                                                                >
                                                                    <ArrowDown className="w-3 h-3" />
                                                                </button>
                                                            </div>

                                                            {!isCategory && (
                                                                <div className="flex items-center gap-1">
                                                                    <Link
                                                                        href={`/courses/${item.id}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition ${
                                                                            isSelected 
                                                                                ? 'bg-white/20 text-white hover:bg-white/30' 
                                                                                : 'bg-[#BC5C29]/10 text-[#BC5C29] hover:bg-[#BC5C29] hover:text-white'
                                                                        }`}
                                                                        title={t("Open Lessons", "المحاضرات")}
                                                                    >
                                                                        <span>{t("Open", "فتح")}</span>
                                                                        <ArrowUpRight className="w-3 h-3" />
                                                                    </Link>
                                                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                                                        isSelected 
                                                                            ? 'bg-[#BC5C29]/80 text-white' 
                                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                                                    }`}>
                                                                        {progress}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {isCategory && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`text-[10px] ${isSelected || isPathActive ? 'text-[#FBF3E9]' : 'text-zinc-400'}`}>
                                                                        {subChildren.length}
                                                                    </span>
                                                                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected || isPathActive ? 'text-white' : 'text-zinc-400'} rtl:rotate-180`} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {col.items.length === 0 && (
                                                <div className="p-4 text-center text-xs text-zinc-400">
                                                    {t("No items in this category.", "لا توجد عناصر في هذا التصنيف.")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="w-[88vw] sm:w-auto sm:flex-1 min-w-[280px] sm:min-w-[420px] max-w-2xl p-4 sm:p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between overflow-y-auto shrink-0 sm:shrink snap-start sm:snap-align-none">
                                    {selectedItem ? (
                                        <InspectorPane 
                                            item={selectedItem} 
                                            itemsMap={itemsMap}
                                            allCategories={allCategories}
                                            t={t} 
                                            handleQuickUpdate={handleQuickUpdate} 
                                            handleDelete={handleDelete}
                                            setMoveModalItem={setMoveModalItem}
                                            getYoutubeEmbed={getYoutubeEmbed}
                                        />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-6">
                                            <Layers className="w-8 h-8 mb-2 opacity-40 text-[#BC5C29]" />
                                            <p className="text-xs font-bold">
                                                {t("Select any item in the columns to inspect and manage details.", "اختر أي تصنيف أو كورس من الأعمدة لعرض التفاصيل وإدارتها.")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'tree' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px] animate-fade-in">
                    <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-sm font-black text-zinc-900 dark:text-white">
                                    {t("Workspace Tree", "شجرة مسار العمل")}
                                </h2>
                                <p className="text-[11px] text-zinc-400">
                                    {t("Clean folder tree with hover actions & drag-and-drop", "شجرة مجلدات تفاعلية وقائمة إجراءات سريعة")}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-full">
                                {Object.keys(itemsMap).length} {t("Items", "عنصر")}
                            </span>
                        </div>

                        <div 
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsRootDragOver(true);
                            }}
                            onDragLeave={() => setIsRootDragOver(false)}
                            onDrop={async (e) => {
                                e.preventDefault();
                                setIsRootDragOver(false);
                                const draggedId = e.dataTransfer.getData('text/plain');
                                if (draggedId && itemsMap[draggedId]) {
                                    await handleQuickUpdateParent(itemsMap[draggedId], null);
                                }
                            }}
                            className={`mb-3 p-2.5 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                                isRootDragOver 
                                    ? 'bg-[#BC5C29]/10 border-2 border-dashed border-[#BC5C29] text-[#BC5C29]' 
                                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-700/60 text-zinc-400 hover:border-zinc-300'
                            }`}
                        >
                            {isRootDragOver 
                                ? t("📥 Drop here to move to Root", "📥 أفلت هنا للنقل للمستوى الرئيسي") 
                                : t("💡 Drag any item here to move to Root Level", "💡 اسحب أي عنصر هنا لإعادته للمستوى الرئيسي")}
                        </div>

                        <div className="relative mb-3">
                            <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("Filter items...", "تصفية العناصر...")}
                                className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:border-[#BC5C29] text-zinc-900 dark:text-white"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
                            {rootNodes
                                .filter(node => !searchQuery || node.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((node, nodeIdx, arr) => (
                                    <NotionTreeNode 
                                        key={node.id} 
                                        node={node} 
                                        index={nodeIdx}
                                        siblings={arr}
                                        handleMoveItemOrder={handleMoveItemOrder}
                                        handleDropReorder={handleDropReorder}
                                        itemsMap={itemsMap} 
                                        selectedItem={selectedItem} 
                                        setSelectedItem={setSelectedItem} 
                                        handleQuickUpdateParent={handleQuickUpdateParent}
                                        setMoveModalItem={setMoveModalItem}
                                        handleDelete={handleDelete}
                                        t={t}
                                    />
                                ))}
                            {rootNodes.length === 0 && (
                                <p className="text-xs text-zinc-400 p-4 text-center">{t("No items found.", "لا توجد عناصر.")}</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 overflow-y-auto flex flex-col justify-between">
                        {selectedItem ? (
                            <InspectorPane 
                                item={selectedItem} 
                                itemsMap={itemsMap}
                                allCategories={allCategories}
                                t={t} 
                                handleQuickUpdate={handleQuickUpdate} 
                                handleDelete={handleDelete}
                                setMoveModalItem={setMoveModalItem}
                                getYoutubeEmbed={getYoutubeEmbed}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-12">
                                <Network className="w-10 h-10 mb-3 opacity-30 text-[#BC5C29]" />
                                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                    {t("Select any item from the tree to view its dashboard overview.", "اختر عنصراً من الشجرة لعرض لوحة تحكمه وتفاصيله.")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'tabs' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#BC5C29] animate-pulse"></span>
                                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    {t("Category Strip Navigation", "شريط تصفح التصنيفات المباشر")}
                                </h2>
                                <span className="text-[11px] font-bold text-zinc-400">
                                    ({tabsCategories.length} {t("Categories", "تصنيف")} • {allCourses.length} {t("Courses", "كورس")})
                                </span>
                            </div>

                            <div className="relative max-w-xs w-full">
                                <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    value={categorySearchQuery}
                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                    placeholder={t("Filter categories by name...", "ابحث في أسماء التصنيفات...")}
                                    className="w-full pl-9 pr-7 rtl:pr-9 rtl:pl-7 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:border-[#BC5C29] text-zinc-900 dark:text-white"
                                />
                                {categorySearchQuery && (
                                    <button 
                                        type="button" 
                                        onClick={() => setCategorySearchQuery('')}
                                        className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        <div 
                            onWheel={(e) => {
                                if (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) > 5) {
                                    e.currentTarget.scrollLeft += e.deltaY;
                                }
                            }}
                            className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 overscroll-x-contain"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <button
                                type="button"
                                onClick={() => setActiveCategoryTab('all')}
                                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    activeCategoryTab === 'all'
                                        ? 'bg-[#BC5C29] text-white shadow-sm shadow-blue-500/25 font-black'
                                        : 'bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span>{t("All Categories", "كل التصنيفات")}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                                    activeCategoryTab === 'all'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                }`}>
                                    {allCourses.length}
                                </span>
                            </button>

                            {uncategorizedCourses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveCategoryTab('uncategorized')}
                                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                        activeCategoryTab === 'uncategorized'
                                            ? 'bg-[#BC5C29] text-white shadow-sm shadow-blue-500/25 font-black'
                                            : 'bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>{t("Uncategorized", "بدون تصنيف")}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                                        activeCategoryTab === 'uncategorized'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                    }`}>
                                        {uncategorizedCourses.length}
                                    </span>
                                </button>
                            )}

                            {tabsCategories.map(cat => {
                                const isActive = String(activeCategoryTab) === String(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setActiveCategoryTab(String(cat.id))}
                                        className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            isActive
                                                ? 'bg-[#BC5C29] text-white shadow-sm shadow-blue-500/25 font-black'
                                                : 'bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        <Folder className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-500'}`} />
                                        <span className="max-w-[260px] sm:max-w-[340px] truncate" title={cat.title}>{cat.title}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                        }`}>
                                            {cat.courseCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-850/50 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    value={categoryCourseSearch}
                                    onChange={(e) => setCategoryCourseSearch(e.target.value)}
                                    placeholder={t("Filter courses by title...", "بحث في أسماء الكورسات...")}
                                    className="w-full pl-9 pr-7 rtl:pr-9 rtl:pl-7 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-[#BC5C29] text-zinc-900 dark:text-white"
                                />
                                {categoryCourseSearch && (
                                    <button 
                                        type="button" 
                                        onClick={() => setCategoryCourseSearch('')}
                                        className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleOpenAddCourse(activeCategoryTab !== 'all' && activeCategoryTab !== 'uncategorized' ? activeCategoryTab : null)}
                                className="bg-[#BC5C29] hover:bg-[#BC5C29]/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{t("Add Course", "إضافة كورس")}</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {activeCategoryTab === 'all' && (
                            <>
                                {tabsCategories
                                    .filter(cat => {
                                        const courses = getCategoryCourses(cat.id, true);
                                        const matchesStatus = categoryStatusFilter === 'all' 
                                            ? courses 
                                            : courses.filter(c => c.status?.toLowerCase() === categoryStatusFilter.toLowerCase());
                                        const matchesSearch = categoryCourseSearch.trim()
                                            ? matchesStatus.filter(c => c.title.toLowerCase().includes(categoryCourseSearch.toLowerCase()))
                                            : matchesStatus;
                                        return matchesSearch.length > 0;
                                    })
                                    .map((cat, catIdx) => {
                                        const courses = getCategoryCourses(cat.id, true);
                                        const filteredCourses = courses.filter(c => {
                                            const matchesStatus = categoryStatusFilter === 'all' || c.status?.toLowerCase() === categoryStatusFilter.toLowerCase();
                                            const matchesSearch = !categoryCourseSearch.trim() || c.title.toLowerCase().includes(categoryCourseSearch.toLowerCase());
                                            return matchesStatus && matchesSearch;
                                        });

                                        const completed = courses.filter(c => Number(c.progress_percentage) >= 100 || c.status?.toLowerCase() === 'completed').length;
                                        const progressPercent = courses.length > 0 ? Math.round((completed / courses.length) * 100) : 0;
                                        const isCollapsed = Boolean(collapsedCategories[cat.id]);

                                        return (
                                            <div key={cat.id} className="space-y-4">
                                                <div 
                                                    onClick={() => toggleCategoryCollapse(cat.id)}
                                                    className="bg-linear-to-r from-zinc-100 to-zinc-50 dark:from-zinc-850 dark:to-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs cursor-pointer select-none hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleCategoryCollapse(cat.id);
                                                            }}
                                                            aria-label={isCollapsed ? t("Expand Category", "توسيع التصنيف") : t("Collapse Category", "طي التصنيف")}
                                                            className="w-8 h-8 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-transform duration-200 cursor-pointer shrink-0"
                                                        >
                                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90 rtl:rotate-90' : 'rotate-0'}`} />
                                                        </button>
                                                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                                                            <Folder className="w-4.5 h-4.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-black text-base text-zinc-900 dark:text-white tracking-tight truncate flex items-center gap-2">
                                                                <span>{cat.title}</span>
                                                                {isCollapsed && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                                                                        {t("Collapsed", "مطوي")}
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-bold flex-wrap">
                                                                <span>{courses.length} {t("Courses", "كورس")}</span>
                                                                <span>•</span>
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{completed} {t("Completed", "مكتمل")}</span>
                                                                <span>•</span>
                                                                <span className="text-[#BC5C29] dark:text-[#BC5C29]">{progressPercent}% {t("Completion", "إنجاز")}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        {/* Reorder Category Buttons */}
                                                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                                            <button
                                                                type="button"
                                                                disabled={catIdx === 0}
                                                                onClick={(e) => handleMoveItemOrder(tabsCategories, catIdx, 'up', e)}
                                                                className={`p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer ${catIdx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                title={t("Move Category Up", "تحريك التصنيف لأعلى")}
                                                            >
                                                                <ArrowUp className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={catIdx === tabsCategories.length - 1}
                                                                onClick={(e) => handleMoveItemOrder(tabsCategories, catIdx, 'down', e)}
                                                                className={`p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer ${catIdx === tabsCategories.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                title={t("Move Category Down", "تحريك التصنيف لأسفل")}
                                                            >
                                                                <ArrowDown className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveCategoryTab(String(cat.id))}
                                                            className="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                                        >
                                                            {t("Focus Category", "التركيز على هذا التصنيف")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAddCourse(cat.id)}
                                                            className="px-3 py-1.5 bg-[#BC5C29] hover:bg-[#BC5C29]/90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>{t("Add to this Category", "+ إضافة كورس هنا")}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {!isCollapsed && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                        {filteredCourses.map((course, courseIdx) => (
                                                            <div 
                                                                key={course.id}
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.stopPropagation();
                                                                    e.dataTransfer.setData('text/plain', JSON.stringify({ id: course.id, catId: cat.id, index: courseIdx }));
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                }}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    e.dataTransfer.dropEffect = 'move';
                                                                }}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                                        if (data && data.catId === cat.id && data.id !== course.id) {
                                                                            handleDropReorder(filteredCourses, data.id, courseIdx);
                                                                        }
                                                                    } catch (_) {}
                                                                }}
                                                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4.5 hover:border-[#BC5C29]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                                                            >
                                                                <div>
                                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <GripVertical className="w-3.5 h-3.5 text-zinc-400 cursor-grab shrink-0 opacity-40 group-hover:opacity-100 transition" />
                                                                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                                                                (Number(course.progress_percentage) >= 100 || course.status?.toLowerCase() === 'completed')
                                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                                                    : (course.status?.toLowerCase() === 'overdue')
                                                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                                                    : 'bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29] border-[#BC5C29]/20'
                                                                            }`}>
                                                                                {course.status?.toLowerCase() === 'completed' || Number(course.progress_percentage) >= 100
                                                                                    ? t("Completed", "مكتمل")
                                                                                    : course.status?.toLowerCase() === 'overdue'
                                                                                    ? t("Overdue", "متأخر")
                                                                                    : t("In Progress", "قيد التقدم")}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                                                            {/* Move Course Up / Down */}
                                                                            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={courseIdx === 0}
                                                                                    onClick={(e) => handleMoveItemOrder(filteredCourses, courseIdx, 'up', e)}
                                                                                    className={`p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer ${courseIdx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                                    title={t("Move Course Up", "تحريك الكورس لأعلى")}
                                                                                >
                                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={courseIdx === filteredCourses.length - 1}
                                                                                    onClick={(e) => handleMoveItemOrder(filteredCourses, courseIdx, 'down', e)}
                                                                                    className={`p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer ${courseIdx === filteredCourses.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                                    title={t("Move Course Down", "تحريك الكورس لأسفل")}
                                                                                >
                                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>

                                                                            {course.url && (
                                                                                <a
                                                                                    href={course.url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#BC5C29]/10 dark:bg-zinc-800 dark:hover:bg-[#BC5C29]/15 text-zinc-500 hover:text-[#BC5C29] dark:hover:text-[#BC5C29] transition"
                                                                                    title={t("Open Course Link", "فتح رابط الكورس")}
                                                                                >
                                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                                </a>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setSelectedItem(course);
                                                                                    setIsCategoryInspectorOpen(true);
                                                                                }}
                                                                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                                                                                title={t("Inspect Details", "عرض التفاصيل")}
                                                                            >
                                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDelete(course.id)}
                                                                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                                                                title={t("Delete Course", "حذف الكورس")}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <Link 
                                                                        href={`/courses/${course.id}`}
                                                                        className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-2 hover:text-[#BC5C29] dark:hover:text-[#BC5C29] transition cursor-pointer mb-3 block"
                                                                        title={course.title}
                                                                    >
                                                                        {course.title}
                                                                    </Link>
                                                                </div>

                                                                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                                            <span className="text-zinc-400">
                                                                                {course.completed_units || 0} / {course.total_units || 1} {t("Units", "وحدة")}
                                                                            </span>
                                                                            <span className={`font-extrabold ${
                                                                                (Number(course.progress_percentage) >= 100) ? 'text-emerald-500' : 'text-[#BC5C29] dark:text-[#BC5C29]'
                                                                            }`}>
                                                                                {Math.round(course.progress_percentage || 0)}%
                                                                            </span>
                                                                        </div>

                                                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                            <div 
                                                                                className={`h-full transition-all duration-300 rounded-full ${
                                                                                    (Number(course.progress_percentage) >= 100)
                                                                                        ? 'bg-emerald-500'
                                                                                        : 'bg-linear-to-r from-[#E8734A] to-[#F2A65A]'
                                                                                }`}
                                                                                style={{ width: `${Math.min(100, Math.max(0, Number(course.progress_percentage) || 0))}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const currentUnits = course.completed_units || 0;
                                                                                const maxUnits = course.total_units || 1;
                                                                                const nextUnits = Math.min(maxUnits, currentUnits + 1);
                                                                                handleQuickUpdate(course, nextUnits);
                                                                            }}
                                                                            disabled={(course.completed_units || 0) >= (course.total_units || 1)}
                                                                            className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                                                        >
                                                                            <Plus className="w-3 h-3" />
                                                                            <span>+1 {t("Unit", "وحدة")}</span>
                                                                        </button>

                                                                        <Link
                                                                            href={`/courses/${course.id}`}
                                                                            className="py-1.5 px-3 bg-[#BC5C29] text-white hover:bg-[#BC5C29]/90 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                                                                            title={t("Open Lessons", "المحاضرات")}
                                                                        >
                                                                            <BookOpen className="w-3.5 h-3.5" />
                                                                            <span>{t("Lessons", "المحاضرات")}</span>
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedItem(course);
                                                                                setIsCategoryInspectorOpen(true);
                                                                            }}
                                                                            className="py-1.5 px-3 bg-[#BC5C29]/10 hover:bg-[#FAF4EF] dark:bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#BC5C29] rounded-xl text-xs font-bold transition cursor-pointer"
                                                                        >
                                                                            {t("Details", "التفاصيل")}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                {uncategorizedCourses.length > 0 && (() => {
                                    const isUncatCollapsed = Boolean(collapsedCategories['uncategorized']);
                                    return (
                                        <div className="space-y-4">
                                            <div 
                                                onClick={() => toggleCategoryCollapse('uncategorized')}
                                                className="bg-linear-to-r from-zinc-100 to-zinc-50 dark:from-zinc-850 dark:to-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs cursor-pointer select-none hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleCategoryCollapse('uncategorized');
                                                        }}
                                                        aria-label={isUncatCollapsed ? t("Expand Category", "توسيع التصنيف") : t("Collapse Category", "طي التصنيف")}
                                                        className="w-8 h-8 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-transform duration-200 cursor-pointer shrink-0"
                                                    >
                                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUncatCollapsed ? '-rotate-90 rtl:rotate-90' : 'rotate-0'}`} />
                                                    </button>
                                                    <div className="w-9 h-9 rounded-xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 flex items-center justify-center font-bold shrink-0">
                                                        <BookOpen className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-base text-zinc-900 dark:text-white flex items-center gap-2">
                                                            <span>{t("Uncategorized Courses", "كورسات بدون تصنيف")}</span>
                                                            {isUncatCollapsed && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                                                                    {t("Collapsed", "مطوي")}
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <span className="text-xs text-zinc-400 font-bold">
                                                            {uncategorizedCourses.length} {t("Courses", "كورس")}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenAddCourse(null);
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>{t("Add Course", "إضافة كورس")}</span>
                                                </button>
                                            </div>

                                            {!isUncatCollapsed && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {uncategorizedCourses
                                                        .filter(c => {
                                                            const matchesStatus = categoryStatusFilter === 'all' || c.status?.toLowerCase() === categoryStatusFilter.toLowerCase();
                                                            const matchesSearch = !categoryCourseSearch.trim() || c.title.toLowerCase().includes(categoryCourseSearch.toLowerCase());
                                                            return matchesStatus && matchesSearch;
                                                        })
                                                        .map((course, courseIdx, uncatArr) => (
                                                            <div 
                                                                key={course.id}
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.stopPropagation();
                                                                    e.dataTransfer.setData('text/plain', JSON.stringify({ id: course.id, catId: 'uncategorized', index: courseIdx }));
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                }}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    e.dataTransfer.dropEffect = 'move';
                                                                }}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                                        if (data && data.catId === 'uncategorized' && data.id !== course.id) {
                                                                            handleDropReorder(uncatArr, data.id, courseIdx);
                                                                        }
                                                                    } catch (_) {}
                                                                }}
                                                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4.5 hover:border-[#BC5C29]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                                                            >
                                                                <div>
                                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <GripVertical className="w-3.5 h-3.5 text-zinc-400 cursor-grab shrink-0 opacity-40 group-hover:opacity-100 transition" />
                                                                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                                                                (Number(course.progress_percentage) >= 100 || course.status?.toLowerCase() === 'completed')
                                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                                                    : (course.status?.toLowerCase() === 'overdue')
                                                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                                                    : 'bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29] border-[#BC5C29]/20'
                                                                            }`}>
                                                                                {course.status?.toLowerCase() === 'completed' || Number(course.progress_percentage) >= 100
                                                                                    ? t("Completed", "مكتمل")
                                                                                    : course.status?.toLowerCase() === 'overdue'
                                                                                    ? t("Overdue", "متأخر")
                                                                                    : t("In Progress", "قيد التقدم")}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                                                            {/* Move Course Up / Down */}
                                                                            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={courseIdx === 0}
                                                                                    onClick={(e) => handleMoveItemOrder(uncatArr, courseIdx, 'up', e)}
                                                                                    className={`p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer ${courseIdx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                                    title={t("Move Course Up", "تحريك الكورس لأعلى")}
                                                                                >
                                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={courseIdx === uncatArr.length - 1}
                                                                                    onClick={(e) => handleMoveItemOrder(uncatArr, courseIdx, 'down', e)}
                                                                                    className={`p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer ${courseIdx === uncatArr.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                                    title={t("Move Course Down", "تحريك الكورس لأسفل")}
                                                                                >
                                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>

                                                                            {course.url && (
                                                                                <a href={course.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#BC5C29]/10 dark:bg-zinc-800 text-zinc-500 hover:text-[#BC5C29] transition">
                                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                                </a>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { setSelectedItem(course); setIsCategoryInspectorOpen(true); }}
                                                                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                                                                                title={t("Inspect Details", "عرض التفاصيل")}
                                                                            >
                                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDelete(course.id)}
                                                                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-500 transition cursor-pointer"
                                                                                title={t("Delete Course", "حذف الكورس")}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <Link 
                                                                        href={`/courses/${course.id}`}
                                                                        className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-2 hover:text-[#BC5C29] transition cursor-pointer mb-3 block"
                                                                    >
                                                                        {course.title}
                                                                    </Link>
                                                                </div>

                                                                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                                            <span className="text-zinc-400">{course.completed_units || 0} / {course.total_units || 1} {t("Units", "وحدة")}</span>
                                                                            <span className="font-extrabold text-[#BC5C29] dark:text-[#BC5C29]">{Math.round(course.progress_percentage || 0)}%</span>
                                                                        </div>
                                                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                            <div 
                                                                                className="h-full bg-linear-to-r from-[#E8734A] to-[#F2A65A] rounded-full" 
                                                                                style={{ width: `${Math.min(100, Math.max(0, Number(course.progress_percentage) || 0))}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickUpdate(course, Math.min(course.total_units || 1, (course.completed_units || 0) + 1))}
                                                                            disabled={(course.completed_units || 0) >= (course.total_units || 1)}
                                                                            className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                                                                        >
                                                                            <Plus className="w-3 h-3" />
                                                                            <span>+1 {t("Unit", "وحدة")}</span>
                                                                        </button>
                                                                        <Link
                                                                            href={`/courses/${course.id}`}
                                                                            className="py-1.5 px-3 bg-[#BC5C29] text-white hover:bg-[#BC5C29]/90 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                                                                            title={t("Open Lessons", "المحاضرات")}
                                                                        >
                                                                            <BookOpen className="w-3.5 h-3.5" />
                                                                            <span>{t("Lessons", "المحاضرات")}</span>
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setSelectedItem(course); setIsCategoryInspectorOpen(true); }}
                                                                            className="py-1.5 px-3 bg-[#BC5C29]/10 hover:bg-[#FAF4EF] dark:bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#BC5C29] rounded-xl text-xs font-bold transition cursor-pointer"
                                                                        >
                                                                            {t("Details", "التفاصيل")}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        )}

                        {activeCategoryTab !== 'all' && (
                            (() => {
                                const selectedCat = activeCategoryTab === 'uncategorized' 
                                    ? { id: 'uncategorized', title: t("Uncategorized Courses", "كورسات بدون تصنيف") }
                                    : itemsMap[activeCategoryTab];
                                if (!selectedCat) {
                                    return (
                                        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                            <p className="text-zinc-400 font-bold text-sm">{t("Category not found.", "التصنيف غير موجود.")}</p>
                                            <button
                                                type="button"
                                                onClick={() => setActiveCategoryTab('all')}
                                                className="mt-3 px-4 py-2 bg-[#BC5C29] text-white rounded-xl text-xs font-bold"
                                            >
                                                {t("Return to All Categories", "العودة لكل التصنيفات")}
                                            </button>
                                        </div>
                                    );
                                }

                                const catCourses = getCategoryCourses(selectedCat.id);
                                const filteredCourses = catCourses.filter(c => {
                                    const matchesStatus = categoryStatusFilter === 'all' || c.status?.toLowerCase() === categoryStatusFilter.toLowerCase();
                                    const matchesSearch = !categoryCourseSearch.trim() || c.title.toLowerCase().includes(categoryCourseSearch.toLowerCase());
                                    return matchesStatus && matchesSearch;
                                });

                                const completed = catCourses.filter(c => Number(c.progress_percentage) >= 100 || c.status?.toLowerCase() === 'completed').length;
                                const progressPercent = catCourses.length > 0 ? Math.round((completed / catCourses.length) * 100) : 0;
                                const isSingleCollapsed = Boolean(collapsedCategories[selectedCat.id]);

                                return (
                                    <div className="space-y-4">
                                        <div 
                                            onClick={() => toggleCategoryCollapse(selectedCat.id)}
                                            className="bg-linear-to-r from-zinc-100 to-zinc-50 dark:from-zinc-850 dark:to-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xs cursor-pointer select-none hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCategoryCollapse(selectedCat.id);
                                                    }}
                                                    aria-label={isSingleCollapsed ? t("Expand Category", "توسيع التصنيف") : t("Collapse Category", "طي التصنيف")}
                                                    className="w-9 h-9 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-transform duration-200 cursor-pointer shrink-0"
                                                >
                                                    <ChevronDown className={`w-4.5 h-4.5 transition-transform duration-200 ${isSingleCollapsed ? '-rotate-90 rtl:rotate-90' : 'rotate-0'}`} />
                                                </button>
                                                <div className="w-11 h-11 rounded-2xl bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29] flex items-center justify-center font-black shrink-0 text-lg">
                                                    📁
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-black text-lg text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                                            <span>{selectedCat.title}</span>
                                                            {isSingleCollapsed && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                                                                    {t("Collapsed", "مطوي")}
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29]">
                                                            {catCourses.length} {t("Courses", "كورس")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-1 flex-wrap">
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{completed} {t("Completed", "مكتمل")}</span>
                                                        <span>•</span>
                                                        <span className="text-zinc-500">{catCourses.length - completed} {t("Remaining", "متبقي")}</span>
                                                        <span>•</span>
                                                        <span className="text-[#BC5C29] dark:text-[#BC5C29] font-extrabold">{progressPercent}% {t("Total Progress", "إجمالي الإنجاز")}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveCategoryTab('all')}
                                                    className="px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                                >
                                                    {t("Show All Categories", "عرض كل التصنيفات")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenAddCourse(selectedCat.id !== 'uncategorized' ? selectedCat.id : null)}
                                                    className="px-4 py-2 bg-[#BC5C29] hover:bg-[#BC5C29]/90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>{t("Add Course to this Category", "+ إضافة كورس لهذا التصنيف")}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {!isSingleCollapsed && (
                                            filteredCourses.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {filteredCourses.map(course => (
                                                    <div 
                                                        key={course.id}
                                                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4.5 hover:border-[#BC5C29]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                                                    >
                                                        <div>
                                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                                                    (Number(course.progress_percentage) >= 100 || course.status?.toLowerCase() === 'completed')
                                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                                        : (course.status?.toLowerCase() === 'overdue')
                                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                                        : 'bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29] border-[#BC5C29]/20'
                                                                }`}>
                                                                    {course.status?.toLowerCase() === 'completed' || Number(course.progress_percentage) >= 100
                                                                        ? t("Completed", "مكتمل")
                                                                        : course.status?.toLowerCase() === 'overdue'
                                                                        ? t("Overdue", "متأخر")
                                                                        : t("In Progress", "قيد التقدم")}
                                                                </span>

                                                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                                                    {course.url && (
                                                                        <a
                                                                            href={course.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#BC5C29]/10 dark:bg-zinc-800 dark:hover:bg-[#BC5C29]/15 text-zinc-500 hover:text-[#BC5C29] dark:hover:text-[#BC5C29] transition"
                                                                            title={t("Open Course Link", "فتح رابط الكورس")}
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedItem(course);
                                                                            setIsCategoryInspectorOpen(true);
                                                                        }}
                                                                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                                                                        title={t("Inspect Details", "عرض التفاصيل")}
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDelete(course.id)}
                                                                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-500 hover:text-rose-600 dark:text-rose-400 transition cursor-pointer"
                                                                        title={t("Delete Course", "حذف الكورس")}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <Link 
                                                                href={`/courses/${course.id}`}
                                                                className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-2 hover:text-[#BC5C29] dark:hover:text-[#BC5C29] transition cursor-pointer mb-3 block"
                                                                title={course.title}
                                                            >
                                                                {course.title}
                                                            </Link>
                                                        </div>

                                                        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between text-[11px] font-bold">
                                                                    <span className="text-zinc-400">
                                                                        {course.completed_units || 0} / {course.total_units || 1} {t("Units", "وحدة")}
                                                                    </span>
                                                                    <span className={`font-extrabold ${
                                                                        (Number(course.progress_percentage) >= 100) ? 'text-emerald-500' : 'text-[#BC5C29] dark:text-[#BC5C29]'
                                                                    }`}>
                                                                        {Math.round(course.progress_percentage || 0)}%
                                                                    </span>
                                                                </div>

                                                                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full transition-all duration-300 rounded-full ${
                                                                            (Number(course.progress_percentage) >= 100)
                                                                                ? 'bg-emerald-500'
                                                                                : 'bg-linear-to-r from-[#E8734A] to-[#F2A65A]'
                                                                        }`}
                                                                        style={{ width: `${Math.min(100, Math.max(0, Number(course.progress_percentage) || 0))}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentUnits = course.completed_units || 0;
                                                                        const maxUnits = course.total_units || 1;
                                                                        const nextUnits = Math.min(maxUnits, currentUnits + 1);
                                                                        handleQuickUpdate(course, nextUnits);
                                                                    }}
                                                                    disabled={(course.completed_units || 0) >= (course.total_units || 1)}
                                                                    className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    <span>+1 {t("Unit", "وحدة")}</span>
                                                                </button>

                                                                <Link
                                                                    href={`/courses/${course.id}`}
                                                                    className="py-1.5 px-3 bg-[#BC5C29] text-white hover:bg-[#BC5C29]/90 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                                                                    title={t("Open Lessons", "المحاضرات")}
                                                                >
                                                                    <BookOpen className="w-3.5 h-3.5" />
                                                                    <span>{t("Lessons", "المحاضرات")}</span>
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedItem(course);
                                                                        setIsCategoryInspectorOpen(true);
                                                                    }}
                                                                    className="py-1.5 px-3 bg-[#BC5C29]/10 hover:bg-[#FAF4EF] dark:bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#BC5C29] rounded-xl text-xs font-bold transition cursor-pointer"
                                                                >
                                                                    {t("Details", "التفاصيل")}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                                                <BookOpen className="w-10 h-10 mb-3 mx-auto text-zinc-300 dark:text-zinc-700" />
                                                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-2">
                                                    {t("No courses found in this category matching your filters.", "لا توجد كورسات في هذا التصنيف تطابق الفلاتر الحالية.")}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenAddCourse(selectedCat.id !== 'uncategorized' ? selectedCat.id : null)}
                                                    className="px-4 py-2 bg-[#BC5C29] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>{t("Add First Course Here", "إضافة أول كورس هنا")}</span>
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                                );
                            })()
                        )}
                    </div>

                    {isCategoryInspectorOpen && selectedItem && (
                        <div 
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                            onClick={() => setIsCategoryInspectorOpen(false)}
                        >
                            <div 
                                className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-scale-up text-zinc-900 dark:text-white"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                                                {selectedItem.title}
                                            </h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                                {t("Course Inspector & Management", "مفتش وإدارة الكورس والتفاصيل")}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsCategoryInspectorOpen(false)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <InspectorPane 
                                    item={selectedItem} 
                                    itemsMap={itemsMap}
                                    allCategories={allCategories}
                                    t={t} 
                                    handleQuickUpdate={handleQuickUpdate} 
                                    handleDelete={(id) => {
                                        setIsCategoryInspectorOpen(false);
                                        handleDelete(id);
                                    }}
                                    setMoveModalItem={setMoveModalItem}
                                    getYoutubeEmbed={getYoutubeEmbed}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {moveModalItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4 animate-scale-up text-zinc-900 dark:text-white">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Move className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                                        {t("Move Item", "نقل العنصر")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                                        {moveModalItem.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMoveModalItem(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            {t("Select destination category or root level:", "اختر التصنيف الوجهة أو المستوى الرئيسي:")}
                        </p>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                            <button
                                onClick={async () => {
                                    await handleQuickUpdateParent(moveModalItem, null);
                                    setMoveModalItem(null);
                                }}
                                className={`w-full px-4 py-3 rounded-2xl border text-left rtl:text-right font-semibold text-xs flex items-center justify-between transition cursor-pointer ${
                                    !moveModalItem.parent_id 
                                        ? 'bg-[#BC5C29]/10 border-[#BC5C29] text-[#BC5C29] font-bold' 
                                        : 'bg-zinc-50/70 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <Layers className="w-4 h-4 text-[#BC5C29]" />
                                    <span>{t("Root Level (No Parent)", "المستوى الرئيسي (بدون أب)")}</span>
                                </span>
                                {!moveModalItem.parent_id && <CheckCircle2 className="w-4 h-4 text-[#BC5C29]" />}
                            </button>

                            {allCategories.filter(c => String(c.id) !== String(moveModalItem.id)).map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={async () => {
                                        await handleQuickUpdateParent(moveModalItem, cat.id);
                                        setMoveModalItem(null);
                                    }}
                                    className={`w-full px-4 py-3 rounded-2xl border text-left rtl:text-right font-semibold text-xs flex items-center justify-between transition cursor-pointer ${
                                        String(moveModalItem.parent_id) === String(cat.id)
                                            ? 'bg-[#BC5C29]/10 border-[#BC5C29] text-[#BC5C29] font-bold' 
                                            : 'bg-zinc-50/70 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="truncate">{cat.title}</span>
                                    </span>
                                    {String(moveModalItem.parent_id) === String(cat.id) && <CheckCircle2 className="w-4 h-4 text-[#BC5C29] shrink-0" />}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setMoveModalItem(null)}
                                className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddCategoryModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsAddCategoryModalOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Folder className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Add New Category", "إضافة تصنيف جديد")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Create a folder to organize courses and sub-tracks.", "أنشئ مجلداً لتنظيم الكورسات والمسارات الفرعية.")}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddCategoryModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Category Title", "عنوان التصنيف")} <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    autoFocus
                                    value={newCategoryTitle}
                                    onChange={e => setNewCategoryTitle(e.target.value)}
                                    placeholder="e.g. Frontend Engineering"
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Parent Category", "التصنيف الأب")}
                                </label>
                                <select 
                                    value={newCategoryParentId}
                                    onChange={e => setNewCategoryParentId(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                >
                                    <option value="none">{t("None (Root Level Category)", "بدون أب (تصنيف رئيسي)")}</option>
                                    {allCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddCategoryModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={modalSubmitting}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {modalSubmitting ? t("Creating...", "جاري الإنشاء...") : t("Create Category", "إنشاء التصنيف")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddCourseModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsAddCourseModalOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <PlayCircle className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Add New Course or Resource", "إضافة كورس أو مصدر جديد")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Configure units, schedule, and analytics tracking.", "حدد الوحدات والجدول الزمني وتتبع الإحصائيات.")}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddCourseModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Course Title", "عنوان الكورس")} <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    autoFocus
                                    value={newCourseForm.title}
                                    onChange={e => setNewCourseForm({...newCourseForm, title: e.target.value})}
                                    placeholder="e.g. Next.js & React Full Stack"
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("URL / Link", "الرابط")}
                                </label>
                                <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 overflow-hidden focus-within:border-[#BC5C29] transition">
                                    <span className="px-3.5 py-2.5 text-xs font-mono font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 select-none">
                                        https://
                                    </span>
                                    <input 
                                        type="text" 
                                        value={newCourseForm.url ? newCourseForm.url.replace(/^https?:\/\//, '') : ''}
                                        onChange={e => {
                                            const val = e.target.value.trim().replace(/^https?:\/\//, '');
                                            setNewCourseForm({...newCourseForm, url: val ? `https://${val}` : ''});
                                        }} 
                                        className="flex-1 bg-transparent px-3.5 py-2.5 font-medium text-zinc-900 dark:text-white focus:outline-none text-xs sm:text-sm border-0!" 
                                        placeholder="youtube.com/... or udemy.com/..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Parent Category", "التصنيف الأب")}
                                    </label>
                                    <select 
                                        value={newCourseForm.parent_id} 
                                        onChange={e => setNewCourseForm({...newCourseForm, parent_id: e.target.value})} 
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                    >
                                        <option value="none">{t("None (Root Level)", "بدون أب (رئيسي)")}</option>
                                        {allCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Status", "الحالة")}
                                    </label>
                                    <select 
                                        value={newCourseForm.status} 
                                        onChange={e => setNewCourseForm({...newCourseForm, status: e.target.value})} 
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                    >
                                        <option value="In Progress">{t("In Progress", "قيد التقدم")}</option>
                                        <option value="Completed">{t("Completed", "مكتمل")}</option>
                                        <option value="Overdue">{t("Overdue", "متأخر")}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Total Units", "الوحدات الكلية")}
                                    </label>
                                    <input 
                                        type="number" min="1" 
                                        value={newCourseForm.total_units} 
                                        onChange={e => setNewCourseForm({...newCourseForm, total_units: e.target.value})} 
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-semibold tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Completed Units", "الوحدات المنجزة")}
                                    </label>
                                    <input 
                                        type="number" min="0" max={newCourseForm.total_units} 
                                        value={newCourseForm.completed_units} 
                                        onChange={e => setNewCourseForm({...newCourseForm, completed_units: e.target.value})} 
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-semibold tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t("Start Date", "تاريخ البدء")}</label>
                                        <button
                                            type="button"
                                            onClick={() => setNewCourseForm({...newCourseForm, expected_start_date: new Date().toISOString().split('T')[0]})}
                                            className="text-[11px] font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                        >
                                            {t("Today", "اليوم")}
                                        </button>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={newCourseForm.expected_start_date} 
                                        onChange={e => setNewCourseForm({...newCourseForm, expected_start_date: e.target.value})} 
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" 
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">{t("End Date", "تاريخ الانتهاء")}</label>
                                        <div className="flex items-center gap-1.5 text-[11px]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 7);
                                                    setNewCourseForm({...newCourseForm, expected_end_date: d.toISOString().split('T')[0]});
                                                }}
                                                className="font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                            >
                                                +1w
                                            </button>
                                            <span className="text-zinc-400">•</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const d = new Date();
                                                    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                                                    setNewCourseForm({...newCourseForm, expected_end_date: lastDay.toISOString().split('T')[0]});
                                                }}
                                                className="font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                            >
                                                {t("Month End", "نهاية الشهر")}
                                            </button>
                                        </div>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={newCourseForm.expected_end_date} 
                                        onChange={e => setNewCourseForm({...newCourseForm, expected_end_date: e.target.value})} 
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition" 
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 flex items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                                        {t("Include in Statistics", "تضمين في الإحصائيات")}
                                    </span>
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                                        {t("Count course in completion metrics & PDF report", "احتساب الكورس في نسب الإنجاز وتقارير الـ PDF")}
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox"
                                        checked={newCourseForm.include_in_stats ?? true}
                                        onChange={e => setNewCourseForm({...newCourseForm, include_in_stats: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BC5C29]"></div>
                                </label>
                            </div>

                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddCourseModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={modalSubmitting}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {modalSubmitting ? t("Creating...", "جاري الحفظ...") : t("Create Course", "إنشاء الكورس")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteCourse}
                itemName={deleteTarget?.name || ''}
                isDeleting={isDeleting}
            />

        </div>
    );
}
