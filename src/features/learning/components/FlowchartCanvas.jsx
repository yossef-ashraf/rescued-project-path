'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Square,
    Circle,
    Diamond,
    Database,
    Cloud,
    MoveRight,
    Type,
    PenTool,
    Trash2,
    Download,
    Plus,
    RotateCcw,
    Code2,
    Eye,
    Palette,
    FileText,
    Check,
    ArrowRight
} from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import MermaidDiagram from './MermaidDiagram.jsx';

export function FlowchartCanvas({
    initialDiagram = '',
    onInsert = null,
    onSave = null,
    className = ''
}) {
    const { t, lang } = useApp();
    const [mode, setMode] = useState('visual'); // 'visual' | 'mermaid' | 'sketch'
    const [inserted, setInserted] = useState(false);

    const defaultMermaid = lang === 'ar'
        ? `flowchart TD\n    A[البداية] --> B{شرط}\n    B -->|نعم| C[تنفيذ الخطوة]\n    B -->|لا| D[إنهاء]\n    C --> D`
        : `flowchart TD\n    A[Start] --> B{Condition}\n    B -->|Yes| C[Execute Step]\n    B -->|No| D[End]\n    C --> D`;

    const [mermaidCode, setMermaidCode] = useState(initialDiagram || defaultMermaid);

    // Visual shapes state for interactive drawing canvas
    const [shapes, setShapes] = useState([
        { id: '1', type: 'rect', x: 40, y: 35, width: 130, height: 48, text: lang === 'ar' ? 'البداية' : 'Start', color: '#BC5C29' },
        { id: '2', type: 'diamond', x: 210, y: 25, width: 120, height: 68, text: lang === 'ar' ? 'شرط' : 'Condition', color: '#3B82F6' },
        { id: '3', type: 'cylinder', x: 370, y: 30, width: 120, height: 58, text: lang === 'ar' ? 'قاعدة بيانات' : 'Database', color: '#10B981' },
        { id: '4', type: 'circle', x: 530, y: 35, width: 110, height: 48, text: lang === 'ar' ? 'النهاية' : 'End', color: '#8B5CF6' }
    ]);

    // Freehand drawing sketches state
    const [freehandPaths, setFreehandPaths] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState('');
    const [activeTool, setActiveTool] = useState('select'); // 'select' | 'pen'
    const [currentColor, setCurrentColor] = useState('#BC5C29');

    const [selectedShapeId, setSelectedShapeId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const svgRef = useRef(null);

    const handleAddShape = (type) => {
        const id = String(Date.now());
        let defaultText = lang === 'ar' ? 'خطوة' : 'Step';
        let defaultColor = '#BC5C29';
        let width = 130;
        let height = 50;

        if (type === 'diamond') {
            defaultText = lang === 'ar' ? 'قرار' : 'Decision';
            defaultColor = '#3B82F6';
            width = 120;
            height = 65;
        } else if (type === 'circle') {
            defaultText = lang === 'ar' ? 'عقدة' : 'Node';
            defaultColor = '#8B5CF6';
            width = 110;
            height = 50;
        } else if (type === 'cylinder') {
            defaultText = lang === 'ar' ? 'قاعدة بيانات' : 'Database';
            defaultColor = '#10B981';
            width = 120;
            height = 58;
        } else if (type === 'cloud') {
            defaultText = lang === 'ar' ? 'سحابة' : 'Cloud API';
            defaultColor = '#06B6D4';
            width = 130;
            height = 60;
        } else if (type === 'parallelogram') {
            defaultText = lang === 'ar' ? 'بيانات' : 'Data I/O';
            defaultColor = '#F59E0B';
            width = 130;
            height = 48;
        } else if (type === 'text') {
            defaultText = lang === 'ar' ? 'ملاحظة' : 'Note';
            defaultColor = '#64748B';
            width = 110;
            height = 36;
        }

        const newShape = {
            id,
            type,
            x: 60 + (shapes.length % 6) * 35,
            y: 80 + (shapes.length % 4) * 25,
            width,
            height,
            text: defaultText,
            color: defaultColor
        };
        setShapes(prev => [...prev, newShape]);
        setSelectedShapeId(id);
        setActiveTool('select');
    };

    const handleDeleteSelected = () => {
        if (!selectedShapeId) return;
        setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
        setSelectedShapeId(null);
    };

    const handleClearCanvas = () => {
        setShapes([]);
        setFreehandPaths([]);
        setSelectedShapeId(null);
    };

    const handleShapeTextChange = (id, newText) => {
        setShapes(prev => prev.map(s => s.id === id ? { ...s, text: newText } : s));
    };

    const handleShapeColorChange = (id, newColor) => {
        setShapes(prev => prev.map(s => s.id === id ? { ...s, color: newColor } : s));
    };

    // Drag handlers
    const startDrag = (shape, e) => {
        if (activeTool !== 'select') return;
        e.stopPropagation();
        setSelectedShapeId(shape.id);
        setIsDragging(true);
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        setDragOffset({
            x: (e.clientX - rect.left) - shape.x,
            y: (e.clientY - rect.top) - shape.y
        });
    };

    // Freehand drawing handlers
    const handleSvgMouseDown = (e) => {
        if (activeTool === 'pen') {
            if (!svgRef.current) return;
            const rect = svgRef.current.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            setIsDrawing(true);
            setCurrentPath(`M ${startX} ${startY}`);
        } else {
            if (e.target === svgRef.current) {
                setSelectedShapeId(null);
            }
        }
    };

    const onMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();

        if (isDrawing && activeTool === 'pen') {
            const nextX = e.clientX - rect.left;
            const nextY = e.clientY - rect.top;
            setCurrentPath(prev => `${prev} L ${nextX} ${nextY}`);
            return;
        }

        if (isDragging && selectedShapeId) {
            const nextX = Math.max(10, Math.min(rect.width - 150, (e.clientX - rect.left) - dragOffset.x));
            const nextY = Math.max(10, Math.min(rect.height - 80, (e.clientY - rect.top) - dragOffset.y));
            setShapes(prev => prev.map(s => s.id === selectedShapeId ? { ...s, x: nextX, y: nextY } : s));
        }
    };

    const stopDragOrDraw = () => {
        if (isDrawing && currentPath) {
            setFreehandPaths(prev => [...prev, { path: currentPath, color: currentColor }]);
            setCurrentPath('');
            setIsDrawing(false);
        }
        setIsDragging(false);
    };

    // Insert Diagram into notes callback
    const handleInsertDiagram = () => {
        let snippet = '';
        if (mode === 'mermaid') {
            snippet = `\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`;
        } else {
            if (shapes.length === 0) {
                snippet = `\n> [!NOTE]\n> ${t("Empty diagram canvas", "مخطط فارغ")}\n`;
            } else {
                const nodeDefs = shapes.map((s, idx) => {
                    const safe = (s.text || `Step ${idx + 1}`).replace(/[\[\]{}()"]/g, '');
                    if (s.type === 'diamond') return `    S${idx}{${safe}}`;
                    if (s.type === 'circle') return `    S${idx}((${safe}))`;
                    if (s.type === 'cylinder') return `    S${idx}[(${safe})]`;
                    if (s.type === 'parallelogram') return `    S${idx}[/${safe}/]`;
                    if (s.type === 'cloud') return `    S${idx}>${safe}]`;
                    return `    S${idx}[${safe}]`;
                });
                const connectors = [];
                for (let i = 0; i < shapes.length - 1; i++) {
                    connectors.push(`    S${i} --> S${i + 1}`);
                }
                snippet = `\n\`\`\`mermaid\nflowchart TD\n${nodeDefs.join('\n')}\n${connectors.join('\n')}\n\`\`\`\n`;
            }
        }

        if (onInsert) {
            onInsert(snippet);
            setInserted(true);
            setTimeout(() => setInserted(false), 2000);
        }
        if (onSave) {
            onSave(snippet);
        }
    };

    // Export SVG file directly
    const handleExportSvg = () => {
        if (!svgRef.current) return;
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `orbit_diagram_${Date.now()}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
    };

    const selectedShape = shapes.find(s => s.id === selectedShapeId);

    return (
        <div className={`p-4 bg-surface rounded-2xl border border-line space-y-3 ${className}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-bold text-ink">
                        {t("Interactive Flowchart & Diagram Studio (Excalidraw Style)", "استوديو المخططات والرسومات التفاعلية")}
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    {/* Insert into Notes action */}
                    {onInsert && (
                        <button
                            type="button"
                            onClick={handleInsertDiagram}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                inserted
                                    ? 'bg-ok text-white'
                                    : 'bg-primary text-on-primary hover:opacity-90'
                            }`}
                            title={t("Insert this diagram directly into lesson content", "إدراج هذا المخطط مباشرة داخل محتوى المحاضرة")}
                        >
                            {inserted ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            <span>{inserted ? t("Inserted!", "تم الإدراج!") : t("Insert into Lesson Notes", "إدراج في ملاحظات المحاضرة")}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleExportSvg}
                        className="px-2.5 py-1.5 rounded-lg border border-line hover:bg-surfaceMuted text-xs font-medium text-ink transition flex items-center gap-1 cursor-pointer"
                        title={t("Export Canvas as SVG image file", "تصدير اللوحة كملف صورة SVG")}
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t("Export SVG", "تصدير SVG")}</span>
                    </button>

                    <div className="h-4 w-px bg-line mx-0.5" />

                    <div className="flex items-center gap-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setMode('visual')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                mode === 'visual'
                                    ? 'bg-surfaceMuted text-ink font-bold border border-line'
                                    : 'text-inkMuted hover:text-ink'
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("Visual Studio", "الاستوديو البصري")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('mermaid')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                mode === 'mermaid'
                                    ? 'bg-surfaceMuted text-ink font-bold border border-line'
                                    : 'text-inkMuted hover:text-ink'
                            }`}
                        >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>{t("Mermaid Code", "كود Mermaid")}</span>
                        </button>
                    </div>
                </div>
            </div>

            {mode === 'visual' ? (
                <div className="space-y-3">
                    {/* Visual Canvas Toolbar - Shapes Palette */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-surfaceMuted/50 rounded-xl border border-line text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-inkMuted me-1">{t("Shapes:", "الأشكال:")}</span>

                            <button
                                type="button"
                                onClick={() => handleAddShape('rect')}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-primary/50 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
                                title={t("Process Step (Rectangle)", "خطوة تنفيذية (مستطيل)")}
                            >
                                <Square className="w-3.5 h-3.5 text-primary" />
                                <span>{t("Process", "خطوة")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddShape('diamond')}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-primary/50 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
                                title={t("Decision Condition (Diamond)", "قرار / شرط (معين)")}
                            >
                                <Diamond className="w-3.5 h-3.5 text-blue-500" />
                                <span>{t("Decision", "قرار")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddShape('circle')}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-primary/50 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
                                title={t("Terminal Node (Circle)", "عقدة / طرف (دائرة)")}
                            >
                                <Circle className="w-3.5 h-3.5 text-purple-500" />
                                <span>{t("Node", "عقدة")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddShape('cylinder')}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-primary/50 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
                                title={t("Database Storage (Cylinder)", "قاعدة بيانات (أسطوانة)")}
                            >
                                <Database className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{t("Database", "بيانات")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddShape('cloud')}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-primary/50 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
                                title={t("Cloud Service / API", "سحابة / خدمة خارجية")}
                            >
                                <Cloud className="w-3.5 h-3.5 text-cyan-500" />
                                <span>{t("Cloud", "سحابة")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddShape('parallelogram')}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-primary/50 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
                                title={t("Data Input/Output (Parallelogram)", "مدخلات / مخرجات بيانات")}
                            >
                                <MoveRight className="w-3.5 h-3.5 text-amber-500" />
                                <span>{t("I/O Data", "مدخلات")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddShape('text')}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-primary/50 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
                                title={t("Text Annotation", "ملاحظة نصية")}
                            >
                                <Type className="w-3.5 h-3.5 text-slate-400" />
                                <span>{t("Text", "نص")}</span>
                            </button>

                            {/* Freehand Pencil Tool */}
                            <button
                                type="button"
                                onClick={() => setActiveTool(activeTool === 'pen' ? 'select' : 'pen')}
                                className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
                                    activeTool === 'pen'
                                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                                        : 'bg-surface border-line hover:border-primary/50 text-ink'
                                }`}
                                title={t("Freehand Draw / Whiteboard Pen", "قلم الرسم الحر (وايت بورد)")}
                            >
                                <PenTool className="w-3.5 h-3.5" />
                                <span>{t("Draw", "رسم")}</span>
                            </button>
                        </div>

                        {/* Selected Shape Inspector or Clear Button */}
                        <div className="flex items-center gap-2">
                            {selectedShape ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={selectedShape.text}
                                        onChange={(e) => handleShapeTextChange(selectedShape.id, e.target.value)}
                                        placeholder={t("Element label...", "نص العنصر...")}
                                        className="bg-canvas border border-line rounded px-2 py-1 text-xs text-ink w-36 focus:outline-none focus:border-primary"
                                    />

                                    <div className="flex items-center gap-1">
                                        {['#BC5C29', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4'].map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => handleShapeColorChange(selectedShape.id, c)}
                                                style={{ backgroundColor: c }}
                                                className={`w-4 h-4 rounded-full border transition cursor-pointer ${selectedShape.color === c ? 'ring-2 ring-ink scale-110' : 'opacity-70'}`}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleDeleteSelected}
                                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition cursor-pointer"
                                        title={t("Delete Selected", "حذف العنصر المحدد")}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleClearCanvas}
                                    className="px-2.5 py-1 rounded-lg border border-line hover:bg-destructive/10 text-destructive text-[11px] font-medium transition cursor-pointer"
                                    title={t("Clear all shapes from canvas", "مسح كافة العناصر من اللوحة")}
                                >
                                    {t("Clear Canvas", "مسح اللوحة")}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SVG Interactive Drawing Surface */}
                    <div
                        className={`w-full h-88 bg-canvas/70 rounded-xl border border-line overflow-hidden relative select-none ${
                            activeTool === 'pen' ? 'cursor-crosshair' : 'cursor-default'
                        }`}
                        onMouseDown={handleSvgMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={stopDragOrDraw}
                        onMouseLeave={stopDragOrDraw}
                    >
                        <svg
                            ref={svgRef}
                            className="w-full h-full"
                            style={{ minWidth: 650, minHeight: 350 }}
                        >
                            {/* Grid Background Pattern */}
                            <defs>
                                <pattern id="flowchart-grid-v2" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-line/40" />
                                </pattern>
                                <marker
                                    id="flowchart-arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="9"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#BC5C29" />
                                </marker>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#flowchart-grid-v2)" />

                            {/* Freehand Drawn Paths */}
                            {freehandPaths.map((fp, i) => (
                                <path
                                    key={`path-${i}`}
                                    d={fp.path}
                                    fill="none"
                                    stroke={fp.color || '#BC5C29'}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}

                            {/* Current active freehand stroke */}
                            {currentPath && (
                                <path
                                    d={currentPath}
                                    fill="none"
                                    stroke={currentColor}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {/* Connectors between sequential shapes */}
                            {shapes.map((s, idx) => {
                                if (idx === shapes.length - 1) return null;
                                const next = shapes[idx + 1];
                                const x1 = s.x + s.width / 2;
                                const y1 = s.y + s.height / 2;
                                const x2 = next.x + next.width / 2;
                                const y2 = next.y + next.height / 2;
                                return (
                                    <g key={`line-${s.id}-${next.id}`}>
                                        <line
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            stroke="#BC5C29"
                                            strokeWidth="2"
                                            strokeDasharray="4 2"
                                            markerEnd="url(#flowchart-arrowhead)"
                                        />
                                    </g>
                                );
                            })}

                            {/* Render Interactive Shapes */}
                            {shapes.map(s => {
                                const isSelected = s.id === selectedShapeId;
                                return (
                                    <g
                                        key={s.id}
                                        transform={`translate(${s.x}, ${s.y})`}
                                        onMouseDown={(e) => startDrag(s, e)}
                                        className="cursor-move"
                                    >
                                        {/* Diamond Decision */}
                                        {s.type === 'diamond' && (
                                            <polygon
                                                points={`${s.width/2},0 ${s.width},${s.height/2} ${s.width/2},${s.height} 0,${s.height/2}`}
                                                fill={s.color}
                                                fillOpacity="0.18"
                                                stroke={s.color}
                                                strokeWidth={isSelected ? 3 : 1.75}
                                            />
                                        )}

                                        {/* Terminal Node / Circle */}
                                        {s.type === 'circle' && (
                                            <rect
                                                width={s.width}
                                                height={s.height}
                                                rx={s.height / 2}
                                                fill={s.color}
                                                fillOpacity="0.18"
                                                stroke={s.color}
                                                strokeWidth={isSelected ? 3 : 1.75}
                                            />
                                        )}

                                        {/* Cylinder / Database */}
                                        {s.type === 'cylinder' && (
                                            <g>
                                                <rect
                                                    y="8"
                                                    width={s.width}
                                                    height={s.height - 16}
                                                    fill={s.color}
                                                    fillOpacity="0.18"
                                                    stroke={s.color}
                                                    strokeWidth={isSelected ? 3 : 1.75}
                                                />
                                                <ellipse
                                                    cx={s.width / 2}
                                                    cy="8"
                                                    rx={s.width / 2}
                                                    ry="7"
                                                    fill={s.color}
                                                    fillOpacity="0.25"
                                                    stroke={s.color}
                                                    strokeWidth={isSelected ? 3 : 1.75}
                                                />
                                                <ellipse
                                                    cx={s.width / 2}
                                                    cy={s.height - 8}
                                                    rx={s.width / 2}
                                                    ry="7"
                                                    fill={s.color}
                                                    fillOpacity="0.25"
                                                    stroke={s.color}
                                                    strokeWidth={isSelected ? 3 : 1.75}
                                                />
                                            </g>
                                        )}

                                        {/* Parallelogram / Data I/O */}
                                        {s.type === 'parallelogram' && (
                                            <polygon
                                                points={`16,0 ${s.width},0 ${s.width - 16},${s.height} 0,${s.height}`}
                                                fill={s.color}
                                                fillOpacity="0.18"
                                                stroke={s.color}
                                                strokeWidth={isSelected ? 3 : 1.75}
                                            />
                                        )}

                                        {/* Cloud */}
                                        {s.type === 'cloud' && (
                                            <path
                                                d={`M 20 ${s.height * 0.7} A 15 15 0 0 1 45 ${s.height * 0.3} A 22 22 0 0 1 ${s.width - 45} ${s.height * 0.3} A 16 16 0 0 1 ${s.width - 15} ${s.height * 0.7} A 12 12 0 0 1 ${s.width - 25} ${s.height - 4} L 25 ${s.height - 4} Z`}
                                                fill={s.color}
                                                fillOpacity="0.18"
                                                stroke={s.color}
                                                strokeWidth={isSelected ? 3 : 1.75}
                                            />
                                        )}

                                        {/* Standard Rectangle Process */}
                                        {(s.type === 'rect' || !['diamond', 'circle', 'cylinder', 'parallelogram', 'cloud', 'text'].includes(s.type)) && (
                                            <rect
                                                width={s.width}
                                                height={s.height}
                                                rx="10"
                                                fill={s.color}
                                                fillOpacity="0.18"
                                                stroke={s.color}
                                                strokeWidth={isSelected ? 3 : 1.75}
                                            />
                                        )}

                                        {/* Text Note */}
                                        {s.type === 'text' && (
                                            <rect
                                                width={s.width}
                                                height={s.height}
                                                rx="4"
                                                fill="transparent"
                                                stroke={isSelected ? s.color : 'transparent'}
                                                strokeWidth="1.5"
                                                strokeDasharray="2 2"
                                            />
                                        )}

                                        <text
                                            x={s.width / 2}
                                            y={s.height / 2 + 4}
                                            textAnchor="middle"
                                            fill="currentColor"
                                            className="text-[11.5px] font-bold text-ink select-none pointer-events-none"
                                        >
                                            {s.text}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            ) : (
                /* Mermaid Code Mode */
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-inkMuted block">
                            {t("Write Mermaid diagram code below:", "اكتب كود Mermaid لإنشاء الفلوشارت نصياً:")}
                        </label>
                        <textarea
                            value={mermaidCode}
                            onChange={(e) => setMermaidCode(e.target.value)}
                            rows={7}
                            dir="ltr"
                            className="w-full text-xs font-mono bg-canvas border border-line rounded-xl p-3 text-ink focus:outline-none focus:border-primary resize-y"
                        />
                    </div>

                    <div className="space-y-2">
                        <MermaidDiagram code={mermaidCode} title={t("Live Flowchart Preview", "معاينة المخطط الهيكلي المباشر")} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default FlowchartCanvas;
