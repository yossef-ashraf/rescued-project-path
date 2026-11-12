'use client';

import React, { useState } from 'react';
import { Sigma, ExternalLink, RefreshCw, Layers, FileText, Check } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';

export function MathPlotterBlock({
    initialEquation = 'x^2',
    onInsert = null,
    className = ''
}) {
    const { t, lang } = useApp();
    const [equation, setEquation] = useState(initialEquation);
    const [viewMode, setViewMode] = useState('svg_plotter'); // 'svg_plotter' | 'geogebra_embed'
    const [scale, setScale] = useState(25); // pixels per unit
    const [inserted, setInserted] = useState(false);

    // Preset functions with pure localization
    const presets = [
        { labelEn: 'Parabola: x²', labelAr: 'قطع مكافئ: x²', eq: 'x^2' },
        { labelEn: 'Linear: 2x + 1', labelAr: 'دالة خطية: 2x + 1', eq: '2*x + 1' },
        { labelEn: 'Sine: sin(x)', labelAr: 'دالة جيبية: sin(x)', eq: 'sin(x)' },
        { labelEn: 'Cubic: x³ - 3x', labelAr: 'دالة تكعيبية: x³ - 3x', eq: 'x^3 - 3*x' },
        { labelEn: 'Reciprocal: 1/x', labelAr: 'دالة مقلوب: 1/x', eq: '1/x' }
    ];

    const handleInsertFormula = () => {
        const snippet = `\n$$f(x) = ${equation}$$\n`;
        if (onInsert) {
            onInsert(snippet);
            setInserted(true);
            setTimeout(() => setInserted(false), 2000);
        }
    };

    // Compute points for SVG curve
    const width = 500;
    const height = 300;
    const cx = width / 2;
    const cy = height / 2;

    const evaluateY = (xVal) => {
        try {
            if (equation === 'x^2') return Math.pow(xVal, 2);
            if (equation === '2*x + 1') return 2 * xVal + 1;
            if (equation === 'sin(x)') return Math.sin(xVal) * 3;
            if (equation === 'x^3 - 3*x') return Math.pow(xVal, 3) - 3 * xVal;
            if (equation === '1/x') return xVal === 0 ? null : 1 / xVal;

            const sanitized = equation.replace(/\^/g, '**');
            const fn = new Function('x', 'Math', `with(Math) { return ${sanitized}; }`);
            const val = fn(xVal, Math);
            return isNaN(val) ? null : val;
        } catch {
            return Math.pow(xVal, 2);
        }
    };

    // Generate SVG path points
    const points = [];
    const step = 0.1;
    for (let px = -10; px <= 10; px += step) {
        const yVal = evaluateY(px);
        if (yVal !== null && !isNaN(yVal)) {
            const svgX = cx + px * scale;
            const svgY = cy - yVal * scale;
            if (svgY >= -200 && svgY <= height + 200) {
                points.push({ x: svgX, y: svgY });
            }
        }
    }

    let pathD = '';
    if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }
    }

    return (
        <div className={`p-4 bg-surface rounded-2xl border border-line space-y-3 ${className}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header & Modes */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                    <Sigma className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-ink">
                        {t("Interactive Math & Function Plotter", "رسم الدوال والرياضيات التفاعلية")}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {onInsert && (
                        <button
                            type="button"
                            onClick={handleInsertFormula}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                inserted
                                    ? 'bg-ok text-white'
                                    : 'bg-primary text-on-primary hover:opacity-90'
                            }`}
                            title={t("Insert KaTeX equation into lesson content", "إدراج معادلة KaTeX داخل محتوى المحاضرة")}
                        >
                            {inserted ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            <span>{inserted ? t("Inserted!", "تم الإدراج!") : t("Insert Equation", "إدراج المعادلة")}</span>
                        </button>
                    )}

                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setViewMode('svg_plotter')}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                viewMode === 'svg_plotter'
                                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                                    : 'bg-surfaceMuted text-inkMuted hover:text-ink'
                            }`}
                        >
                            {t("Coordinate Plane", "المستوى الإحداثي")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('geogebra_embed')}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                viewMode === 'geogebra_embed'
                                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                                    : 'bg-surfaceMuted text-inkMuted hover:text-ink'
                            }`}
                        >
                            <span>{t("GeoGebra Classic", "مساحة GeoGebra Classic")}</span>
                            <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'svg_plotter' ? (
                <div className="space-y-3">
                    {/* Controls & Presets */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-surfaceMuted/50 rounded-xl border border-line text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{t("Function:", "الدالة:")}</span>
                            <span className="font-mono text-primary font-bold">f(x) =</span>
                            <input
                                type="text"
                                value={equation}
                                onChange={(e) => setEquation(e.target.value)}
                                dir="ltr"
                                placeholder="x^2"
                                className="w-32 bg-canvas border border-line rounded px-2.5 py-1 text-xs font-mono text-ink focus:outline-none focus:border-primary"
                            />
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {presets.map(p => (
                                <button
                                    key={p.eq}
                                    type="button"
                                    onClick={() => setEquation(p.eq)}
                                    className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                                        equation === p.eq
                                            ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                                            : 'bg-surface hover:bg-surfaceMuted text-inkMuted border border-line'
                                    }`}
                                >
                                    {lang === 'ar' ? p.labelAr : p.labelEn}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SVG Coordinate Grid */}
                    <div className="w-full bg-canvas/70 rounded-xl border border-line overflow-hidden flex justify-center py-2 select-none">
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            className="w-full max-w-[540px] h-[300px]"
                        >
                            {/* Grid Lines */}
                            <defs>
                                <pattern id="math-grid" width={scale} height={scale} patternUnits="userSpaceOnUse">
                                    <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-line/40" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#math-grid)" />

                            {/* X Axis */}
                            <line x1="0" y1={cy} x2={width} y2={cy} stroke="currentColor" strokeWidth="1.5" className="text-inkSecondary" />
                            {/* Y Axis */}
                            <line x1={cx} y1="0" x2={cx} y2={height} stroke="currentColor" strokeWidth="1.5" className="text-inkSecondary" />

                            {/* Axis Marks and Numbers */}
                            {[-8, -6, -4, -2, 2, 4, 6, 8].map(n => (
                                <g key={`x-${n}`}>
                                    <line x1={cx + n * scale} y1={cy - 3} x2={cx + n * scale} y2={cy + 3} stroke="currentColor" strokeWidth="1" className="text-inkMuted" />
                                    <text x={cx + n * scale} y={cy + 14} textAnchor="middle" className="text-[9px] fill-current text-inkMuted select-none font-mono">
                                        {n}
                                    </text>
                                </g>
                            ))}

                            {[-4, -2, 2, 4].map(n => (
                                <g key={`y-${n}`}>
                                    <line x1={cx - 3} y1={cy - n * scale} x2={cx + 3} y2={cy - n * scale} stroke="currentColor" strokeWidth="1" className="text-inkMuted" />
                                    <text x={cx - 8} y={cy - n * scale + 3} textAnchor="end" className="text-[9px] fill-current text-inkMuted select-none font-mono">
                                        {n}
                                    </text>
                                </g>
                            ))}

                            {/* Function Curve Path */}
                            {pathD && (
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#BC5C29"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-inkMuted px-1">
                        <span>{t("Coordinate origin is (0,0) at center • Drag to explore", "نقطة الأصل (0,0) في المركز • المعاينة تفاعلية")}</span>
                        <span className="font-mono text-primary font-bold">f(x) = {equation}</span>
                    </div>
                </div>
            ) : (
                /* GeoGebra Classic Embed */
                <div className="space-y-2">
                    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-line bg-canvas">
                        <iframe
                            src="https://www.geogebra.org/classic"
                            title="GeoGebra Classic Workspace"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-inkMuted px-1">
                        <span>{t("Interactive Geometry & Algebra Workspace (GeoGebra Reference GPL-3.0)", "بيئة الرياضيات والهندسة التفاعلية (مرجع GeoGebra)")}</span>
                        <a
                            href="https://www.geogebra.org/classic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                        >
                            <span>{t("Open in Full Window", "فتح في نافذة كاملة")}</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MathPlotterBlock;
