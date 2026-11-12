"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/shared/utils/utils.js";
import { useApp } from "@/shared/context/AppContext.js";
import { moveTaskBetweenColumns } from "@/features/tasks/services/board-reducer.js";

export function TrelloKanbanBoard({
  columns: initialColumns,
  onColumnsChange,
  onTaskMove,
  onTaskAdd,
  onTaskDelete,
  onTaskEdit,
  onCardClick,
  onAddTaskClick,
  className,
  allowAddTask = true,
}) {
  const { t } = useApp();
  const [columns, setColumns] = useState(initialColumns || []);
  const [prevInitialColumns, setPrevInitialColumns] = useState(initialColumns);
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(initialColumns || []);
  }

  const [draggedTask, setDraggedTask] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [addingCardTo, setAddingCardTo] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (addingCardTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingCardTo]);

  const handleDragStart = (task, columnId) => {
    setDraggedTask({ task, sourceColumnId: columnId });
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDropTarget(columnId);
  };

  const handleDrop = (targetColumnId) => {
    if (!draggedTask || draggedTask.sourceColumnId === targetColumnId) {
      setDraggedTask(null);
      setDropTarget(null);
      return;
    }

    const { columns: newColumns } = moveTaskBetweenColumns(
      columns,
      draggedTask.task.id,
      draggedTask.sourceColumnId,
      targetColumnId
    );

    setColumns(newColumns);
    onColumnsChange?.(newColumns);
    onTaskMove?.(draggedTask.task.id, draggedTask.sourceColumnId, targetColumnId);
    setDraggedTask(null);
    setDropTarget(null);
  };

  const handleMoveTaskSelect = (task, currentColumnId, targetColumnId) => {
    if (currentColumnId === targetColumnId) return;

    const { columns: newColumns } = moveTaskBetweenColumns(
      columns,
      task.id,
      currentColumnId,
      targetColumnId
    );

    setColumns(newColumns);
    onColumnsChange?.(newColumns);
    onTaskMove?.(task.id, currentColumnId, targetColumnId);
  };

  const handleAddCard = useCallback((columnId) => {
    if (!newCardTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newCardTitle.trim(),
      labels: [],
    };

    const newColumns = columns.map((col) =>
      col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
    );

    setColumns(newColumns);
    onColumnsChange?.(newColumns);
    onTaskAdd?.(columnId, newCardTitle.trim());
    setNewCardTitle("");
    setAddingCardTo(null);
  }, [columns, newCardTitle, onColumnsChange, onTaskAdd]);

  return (
    <div className={cn("flex overflow-x-auto snap-x snap-mandatory gap-3.5 items-start w-full pb-4 pt-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible no-scrollbar", className)}>
      {columns.map((column) => {
        const isDropActive = dropTarget === column.id && draggedTask?.sourceColumnId !== column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={() => handleDrop(column.id)}
            onDragLeave={() => setDropTarget(null)}
            className={cn(
              "opportunity-column w-[86vw] max-w-[340px] shrink-0 snap-center sm:w-full sm:max-w-none rounded-2xl p-3.5 transition-all duration-200",
              "bg-zinc-50/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-2xs",
              isDropActive ? "border-zinc-500 border-dashed bg-zinc-100 dark:bg-zinc-800 scale-[1.01]" : ""
            )}
          >
            <div className="opportunity-column-header mb-3 flex items-center justify-between px-1 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-white" />
                <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{column.title}</h2>
                <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                  {column.tasks.length}
                </span>
              </div>
            </div>

            <div className="flex min-h-[120px] flex-col gap-2.5">
              {column.tasks.length === 0 ? (
                <div className="py-7 px-3 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl" role="status">
                  {t("No tasks in this column", "لا توجد مهام في هذا العمود")}
                </div>
              ) : column.tasks.map((task) => {
                const isDragging = draggedTask?.task.id === task.id;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                    onDragEnd={() => setDraggedTask(null)}
                    onClick={() => onCardClick && onCardClick(task)}
                    className={cn(
                      "opportunity-card cursor-pointer orbit-task-panel p-3.5 shadow-2xs transition-all duration-150 relative group",
                      "hover:-translate-y-0.5 hover:border-zinc-400 dark:hover:border-zinc-600 active:cursor-grabbing",
                      isDragging && "rotate-2 opacity-40 border-dashed border-zinc-400"
                    )}
                  >
                    {task.labels && task.labels.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {task.labels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    {(() => {
                      const isTitleRtl = /[\u0600-\u06FF]/.test(task.title || '');
                      const rawDesc = task.description || '';
                      const isDescRtl = /[\u0600-\u06FF]/.test(rawDesc);

                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const matchedUrls = rawDesc.match(urlRegex) || [];
                      const cleanDesc = rawDesc.replace(urlRegex, '').trim();

                      const dueDate = task.due_date || task.rawTask?.due_date;
                      const priority = task.priority || task.rawTask?.priority;
                      const isOverdue = dueDate && new Date(dueDate) < new Date() && column.id !== 'done';

                      return (
                        <>
                          <h3
                            dir={isTitleRtl ? "rtl" : "ltr"}
                            className={cn("text-xs font-bold text-zinc-900 dark:text-white leading-snug tracking-tight", (cleanDesc || matchedUrls.length > 0) && "mb-1")}
                          >
                            {task.title}
                          </h3>

                          {cleanDesc && (
                            <p
                              dir={isDescRtl ? "rtl" : "ltr"}
                              className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed"
                            >
                              {cleanDesc}
                            </p>
                          )}

                          {matchedUrls.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {matchedUrls.map((url, uIdx) => {
                                const isGh = url.includes('github.com');
                                const isVercel = url.includes('vercel.app');
                                return (
                                  <a
                                    key={uIdx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition shadow-2xs",
                                      isGh ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200" :
                                      isVercel ? "bg-[#BC5C29]/10 text-[#BC5C29] border border-[#BC5C29]/30 hover:bg-[#FAF4EF] dark:bg-[#BC5C29]/15 dark:text-[#BC5C29] dark:border-[#BC5C29]/25" :
                                      "bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                                    )}
                                  >
                                    {isGh ? (
                                      <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    )}
                                    <span>{isGh ? "GitHub" : isVercel ? "Vercel" : "Open Link"}</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-1 text-[10px]">
                            <div className="flex items-center gap-1.5 font-medium">
                              {dueDate && (
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono",
                                  isOverdue ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-bold" : "text-zinc-500 dark:text-zinc-400"
                                )}>
                                  <svg className="w-3 h-3 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{dueDate}</span>
                                </span>
                              )}
                              {priority && (
                                <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold uppercase text-[9px]">
                                  {priority}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <div className="relative opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <select
                                  value={column.id}
                                  onChange={(e) => handleMoveTaskSelect(task, column.id, e.target.value)}
                                  className="orbit-task-select bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-[9px] font-bold text-zinc-700 dark:text-zinc-200 px-1 py-0.5 cursor-pointer focus:outline-none"
                                  title={t("Move card...", "نقل المهمة...")}
                                >
                                  <option disabled value={column.id}>⇄ Move</option>
                                  {columns.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.title}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {task.assignee && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs">
                                  {task.assignee}
                                </div>
                              )}

                              {onTaskEdit && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskEdit(task);
                                  }}
                                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer"
                                  title={t("Edit task", "تعديل المهمة")}
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}

                              {onTaskDelete && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskDelete(task.id);
                                  }}
                                  className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer"
                                  title={t("Delete task", "حذف المهمة")}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                );
              })}

              {allowAddTask && (
                <>
                  {addingCardTo === column.id ? (
                    <div className="orbit-task-kanban-card">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCard(column.id)}
                        placeholder={t("Enter card title...", "أدخل عنوان المهمة...")}
                        className="orbit-task-input mb-2 w-full border-none bg-transparent text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddCard(column.id)}
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-zinc-900 transition-colors shadow-2xs"
                        >
                          {t("Add Card", "إضافة مهمة")}
                        </button>
                        <button
                          onClick={() => {
                            setAddingCardTo(null);
                            setNewCardTitle("");
                          }}
                          className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddTaskClick ? onAddTaskClick(column.id) : setAddingCardTo(column.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white/50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 transition"
                    >
                      <span>+</span>
                      <span>{t("Add a card", "إضافة مهمة جديدة")}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
