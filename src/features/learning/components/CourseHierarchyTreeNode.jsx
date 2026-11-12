'use client';

import React, { useState } from 'react';
import Link from '@/shared/next-compat/link';
import {
    Folder,
    FolderOpen,
    PlayCircle,
    FileText,
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    Move,
    Edit3,
    Trash2,
    ArrowUp,
    ArrowDown,
    ArrowUpRight,
    BookOpen,
    GripVertical
} from 'lucide-react';
import { sortHierarchyItems } from '@/features/learning/utils/hierarchy.logic.js';
import { I18N_KEYS } from '@/shared/enums';

export default function NotionTreeNode({ 
    node, 
    itemsMap, 
    selectedItem, 
    setSelectedItem, 
    handleQuickUpdateParent, 
    setMoveModalItem, 
    handleDelete, 
    level = 0, 
    index = 0,
    siblings = [],
    handleMoveItemOrder,
    handleDropReorder,
    t 
}) {
    const [expanded, setExpanded] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const isCategory = node.type?.toLowerCase() === 'category' || node.resource_type?.toLowerCase() === 'category';

    const children = sortHierarchyItems(
        Object.values(itemsMap).filter(item => String(item.parent_id) === String(node.id))
    );
    const hasChildren = children.length > 0;
    const isSelected = selectedItem?.id === node.id;
    const progress = Math.round(Number(node.progress_percentage) || 0);

    return (
        <div className="relative select-none">
            <div 
                draggable
                onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData('text/plain', JSON.stringify({ id: node.id, parent_id: node.parent_id, index }));
                    e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                }}
                onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                    try {
                        const raw = e.dataTransfer.getData('text/plain');
                        if (!raw) return;
                        let draggedId = raw;
                        let draggedParentId = null;
                        try {
                            const parsed = JSON.parse(raw);
                            if (parsed && parsed.id) {
                                draggedId = parsed.id;
                                draggedParentId = parsed.parent_id;
                            }
                        } catch (_) {}

                        if (String(draggedId) === String(node.id)) return;

                        // If dropping among siblings with same parent, perform reorder
                        if (handleDropReorder && siblings && siblings.length > 0 && String(draggedParentId) === String(node.parent_id)) {
                            handleDropReorder(siblings, draggedId, index);
                            return;
                        }

                        // Otherwise if dropped onto a category, move item into this category
                        if (isCategory) {
                            const draggedItem = itemsMap[draggedId];
                            if (draggedItem) {
                                await handleQuickUpdateParent(draggedItem, node.id);
                            }
                        }
                    } catch (err) {
                        console.error('Tree drop error:', err);
                    }
                }}
                onClick={() => {
                    setSelectedItem(node);
                    if (isCategory) setExpanded(!expanded);
                }}
                className={`group relative flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer transition-all duration-150 text-xs font-semibold ${
                    isDragOver 
                        ? 'bg-[#BC5C29]/10 dark:bg-[#BC5C29]/20 border-2 border-dashed border-[#BC5C29] scale-[1.01]' 
                        : isSelected 
                        ? 'bg-[#BC5C29]/10 dark:bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#BC5C29] font-bold border border-[#BC5C29]/30 dark:border-[#BC5C29]/40' 
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 border border-transparent'
                }`}
                style={{ paddingLeft: `${level * 1.1 + 0.5}rem` }}
            >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <GripVertical className="w-3 h-3 text-zinc-400 cursor-grab shrink-0 opacity-0 group-hover:opacity-40 hover:opacity-100 transition" />
                    {isCategory ? (
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                            className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded shrink-0 cursor-pointer"
                        >
                            {expanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                            )}
                        </button>
                    ) : (
                        <span className="w-4 h-4 shrink-0" />
                    )}

                    {isCategory ? (
                        expanded ? (
                            <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                        )
                    ) : (
                        node.url?.includes('youtu') ? (
                            <PlayCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        )
                    )}

                    <span className="line-clamp-3 break-words leading-snug" title={node.title}>{node.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-2">
                    {/* Hover Move Up / Down Buttons for siblings */}
                    {siblings && siblings.length > 1 && handleMoveItemOrder && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => handleMoveItemOrder(siblings, index, 'up', e)}
                                className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                title={t("Move Up", "تحريك لأعلى")}
                            >
                                <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                disabled={index === siblings.length - 1}
                                onClick={(e) => handleMoveItemOrder(siblings, index, 'down', e)}
                                className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer ${index === siblings.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                title={t("Move Down", "تحريك لأسفل")}
                            >
                                <ArrowDown className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {!isCategory && (() => {
                        const lessonsCount = Number(node.lessons_count || 0);
                        const totalUnits = Number(node.total_units || 0);
                        const isComplete = lessonsCount >= totalUnits && totalUnits > 0;
                        const isPartial = lessonsCount > 0 && !isComplete;

                        const badgeColor = isComplete
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : isPartial
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';

                        const dotColor = isComplete
                            ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                            : isPartial
                            ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                            : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]';

                        const tooltipText = isComplete
                            ? `${t(I18N_KEYS.LEARNING_LECTURES_COMPLETE, "المحاضرات مكتملة")}: ${lessonsCount}/${totalUnits}`
                            : isPartial
                            ? `${t(I18N_KEYS.LEARNING_LECTURES_PARTIAL, "المحاضرات جزئية")}: ${lessonsCount}/${totalUnits}`
                            : `${t(I18N_KEYS.LEARNING_NO_LECTURES_IN_DATABASE, "لا توجد محاضرات في قاعدة البيانات")}: 0/${totalUnits}`;

                        return (
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border transition cursor-default ${badgeColor}`}
                                    title={tooltipText}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                    <span>{lessonsCount}/{totalUnits}</span>
                                </span>
                                <Link
                                    href={`/courses/${node.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-0.5 rounded-lg bg-[#BC5C29]/10 hover:bg-[#BC5C29] text-[#BC5C29] hover:text-white transition text-[11px] font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100"
                                    title={t("Open Course Workspace", "فتح مساحة عمل الكورس")}
                                >
                                    <span>{t("Open", "فتح")}</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                                <div className="w-12 bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden hidden group-hover:block">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-400 font-bold">
                                    {progress}%
                                </span>
                            </div>
                        );
                    })()}

                    {isCategory && (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {children.length}
                        </span>
                    )}

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="More actions"
                        >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {showMenu && (
                            <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 rtl:left-0 rtl:right-auto mt-1 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 z-30 animate-fade-in text-xs font-semibold"
                            >
                                {siblings && siblings.length > 1 && handleMoveItemOrder && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleMoveItemOrder(siblings, index, 'up');
                                            }}
                                            className={`w-full px-3 py-1.5 text-left rtl:text-right hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-200 cursor-pointer ${index === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                            <span>{t("Move Up", "تحريك لأعلى")}</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={index === siblings.length - 1}
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleMoveItemOrder(siblings, index, 'down');
                                            }}
                                            className={`w-full px-3 py-1.5 text-left rtl:text-right hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-200 cursor-pointer ${index === siblings.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                            <span>{t("Move Down", "تحريك لأسفل")}</span>
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setMoveModalItem(node);
                                    }}
                                    className="w-full px-3 py-1.5 text-left rtl:text-right hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-200 cursor-pointer"
                                >
                                    <Move className="w-3.5 h-3.5" />
                                    <span>{t("Move", "نقل")}</span>
                                </button>
                                <Link
                                    href={`/courses/edit/${node.id}?returnTo=/courses/hierarchy`}
                                    className="w-full px-3 py-1.5 text-left rtl:text-right hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-200"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{t("Edit", "تعديل")}</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        handleDelete(node.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-left rtl:text-right hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{t("Delete", "حذف")}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isCategory && expanded && hasChildren && (
                <div className="space-y-0.5 my-0.5">
                    {children.map((child, childIdx) => (
                        <NotionTreeNode 
                            key={child.id} 
                            node={child} 
                            itemsMap={itemsMap} 
                            selectedItem={selectedItem} 
                            setSelectedItem={setSelectedItem} 
                            handleQuickUpdateParent={handleQuickUpdateParent}
                            setMoveModalItem={setMoveModalItem}
                            handleDelete={handleDelete}
                            level={level + 1}
                            index={childIdx}
                            siblings={children}
                            handleMoveItemOrder={handleMoveItemOrder}
                            handleDropReorder={handleDropReorder}
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
