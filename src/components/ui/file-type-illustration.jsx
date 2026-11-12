'use client';

import React from 'react';

const BADGE_STYLES = {
    TXT: { label: 'TXT', color: '#64748B', variant: 'doc' },
    DOC: { label: 'DOC', color: '#2563EB', variant: 'doc' },
    DOCX: { label: 'DOC', color: '#2563EB', variant: 'doc' },
    PDF: { label: 'PDF', color: '#EF4444', variant: 'doc' },
    MD: { label: 'MD', color: '#334155', variant: 'md' },
    MDX: { label: 'MDX', color: '#334155', variant: 'md' },
    XLS: { label: 'XLS', color: '#059669', variant: 'xls' },
    XLSX: { label: 'XLS', color: '#059669', variant: 'xls' },
    CSV: { label: 'CSV', color: '#0D9488', variant: 'csv' },
    ZIP: { label: 'ZIP', color: '#9333EA', variant: 'zip' },
    RAR: { label: 'ZIP', color: '#9333EA', variant: 'zip' },
    '7Z': { label: 'ZIP', color: '#9333EA', variant: 'zip' },
    TAR: { label: 'TAR', color: '#B45309', variant: 'zip' },
    GZ: { label: 'TAR', color: '#B45309', variant: 'zip' },
    PPT: { label: 'PPT', color: '#EA580C', variant: 'ppt' },
    PPTX: { label: 'PPTX', color: '#EA580C', variant: 'ppt' },
    JSON: { label: 'JSON', color: '#EAB308', variant: 'json' },
    CSS: { label: 'CSS', color: '#2563EB', variant: 'css' },
    SCSS: { label: 'CSS', color: '#2563EB', variant: 'css' },
    CODE: { label: 'CODE', color: '#EA580C', variant: 'code' },
    PNG: { label: 'PNG', color: '#475569', variant: 'img' },
    JPG: { label: 'JPG', color: '#15803D', variant: 'img' },
    JPEG: { label: 'JPG', color: '#15803D', variant: 'img' },
    IMG: { label: 'IMG', color: '#DB2777', variant: 'img' },
    VIDEO: { label: 'VIDEO', color: '#15803D', variant: 'video' },
    LINK: { label: 'LINK', color: '#BC5C29', variant: 'link' },
    NOTE: { label: 'NOTE', color: '#D97706', variant: 'note' }
};

export function resolveFileIllustrationType({ item, fileType, fileName, fileUrl }) {
    const rawType = String(fileType || item?.file_type || '').trim().toLowerCase();
    const rawName = String(fileName || item?.file_name || '').trim().toLowerCase();
    const rawUrl = String(fileUrl || item?.file_url || '').trim().toLowerCase();

    if (rawType === 'note' || rawUrl.startsWith('data:text/')) {
        return BADGE_STYLES.NOTE;
    }

    const extractExt = (str) => {
        if (!str) return '';
        const clean = str.split('?')[0].split('#')[0];
        const parts = clean.split('.');
        return parts.length > 1 ? parts.pop().toUpperCase() : '';
    };

    const typeUpper = rawType.toUpperCase();
    if (BADGE_STYLES[typeUpper]) {
        return BADGE_STYLES[typeUpper];
    }

    const nameExt = extractExt(rawName);
    if (nameExt && BADGE_STYLES[nameExt]) {
        return BADGE_STYLES[nameExt];
    }

    const urlExt = extractExt(rawUrl);
    if (urlExt && BADGE_STYLES[urlExt]) {
        return BADGE_STYLES[urlExt];
    }

    const codeExts = new Set([
        'JS', 'JSX', 'TS', 'TSX', 'PY', 'HTML', 'HTM', 'SH', 'BASH', 'SQL',
        'JAVA', 'C', 'CPP', 'CS', 'GO', 'RS', 'PHP', 'RB', 'YAML', 'YML', 'XML', 'TOML'
    ]);
    if (codeExts.has(typeUpper) || codeExts.has(nameExt) || codeExts.has(urlExt) || rawType === 'code') {
        return BADGE_STYLES.CODE;
    }

    const imgExts = new Set(['WEBP', 'GIF', 'SVG', 'BMP', 'ICO', 'AVIF']);
    if (imgExts.has(typeUpper) || imgExts.has(nameExt) || imgExts.has(urlExt) || rawType === 'image') {
        return BADGE_STYLES.IMG;
    }

    const videoExts = new Set(['MP4', 'MKV', 'WEBM', 'MOV', 'AVI', 'M4V']);
    if (
        videoExts.has(typeUpper) ||
        videoExts.has(nameExt) ||
        videoExts.has(urlExt) ||
        rawType === 'video' ||
        rawUrl.includes('youtube.com') ||
        rawUrl.includes('youtu.be') ||
        rawUrl.includes('vimeo.com')
    ) {
        return BADGE_STYLES.VIDEO;
    }

    if (
        rawType === 'link' ||
        (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
            !rawUrl.includes('/api/files') &&
            !rawUrl.includes('/uploads/')
    ) {
        return BADGE_STYLES.LINK;
    }

    if (rawType === 'pdf' || rawUrl.includes('.pdf')) {
        return BADGE_STYLES.PDF;
    }

    return BADGE_STYLES.DOC;
}

export function FileTypeIllustration({ item, fileType, fileName, fileUrl, className = '' }) {
    const resolved = resolveFileIllustrationType({ item, fileType, fileName, fileUrl });
    const { label, color, variant } = resolved;

    return (
        <div
            className={`w-20 h-24 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-700/80 shadow-xs p-2.5 flex flex-col justify-between relative select-none mx-auto transition-transform duration-200 group-hover:scale-105 ${className}`}
        >
            <div className="flex-1 flex flex-col justify-start overflow-hidden">
                {variant === 'doc' && (
                    <div className="space-y-1.5 pt-0.5">
                        <div className="w-7 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <div className="flex items-center gap-1">
                            <div className="w-5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="w-5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="w-3 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="w-3 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="w-5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="w-4 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                        <div className="w-4 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                )}

                {variant === 'md' && (
                    <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 leading-none">#</span>
                            <div className="w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                        <div className="w-6 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-11 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-8 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-4 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                )}

                {variant === 'note' && (
                    <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black text-amber-500 leading-none">#</span>
                            <div className="w-8 h-1 rounded-full bg-amber-300 dark:bg-amber-500/60" />
                        </div>
                        <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-8 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-11 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-6 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                )}

                {variant === 'xls' && (
                    <div className="space-y-1 pt-0.5">
                        <div className="grid grid-cols-3 gap-1">
                            <div className="h-2 rounded-[2px] bg-zinc-300 dark:bg-zinc-600" />
                            <div className="h-2 rounded-[2px] bg-zinc-300 dark:bg-zinc-600" />
                            <div className="h-2 rounded-[2px] bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                        {[0, 1, 2].map(row => (
                            <div key={row} className="grid grid-cols-3 gap-1">
                                <div className="h-2 rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
                                <div className="h-2 rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
                                <div className="h-2 rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
                            </div>
                        ))}
                        <div className="grid grid-cols-3 gap-1">
                            <div className="h-2 rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                    </div>
                )}

                {variant === 'csv' && (
                    <div className="space-y-1.5 pt-0.5">
                        <div className="grid grid-cols-3 gap-1">
                            <div className="h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            <div className="h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            <div className="h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                        {[0, 1, 2].map(row => (
                            <div key={row} className="grid grid-cols-3 gap-1">
                                <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                                <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                                <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                        ))}
                        <div className="w-3.5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                )}

                {variant === 'zip' && (
                    <div className="flex flex-col items-center justify-start h-full pt-0.5">
                        {[0, 1, 2, 3, 4, 5, 6].map(i => (
                            <div
                                key={i}
                                className={`flex items-center ${i % 2 === 0 ? '-translate-x-1' : 'translate-x-1'}`}
                            >
                                <div className="w-3 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 border border-zinc-200 dark:border-zinc-700" />
                            </div>
                        ))}
                    </div>
                )}

                {variant === 'ppt' && (
                    <div className="space-y-1.5 pt-0.5">
                        <div className="h-8 w-full rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 p-1">
                            <div className="w-3 h-3 rounded-full bg-orange-300 dark:bg-orange-400/80" />
                            <div className="w-7 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="w-4 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                        <div className="w-6 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                )}

                {variant === 'json' && (
                    <div className="space-y-1 pt-0.5 font-mono text-[8px] font-bold text-zinc-400 dark:text-zinc-500">
                        <div className="leading-none">{'{'}</div>
                        <div className="pl-2 space-y-1">
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                <div className="w-5 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                                <div className="w-3 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3.5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                                <div className="w-5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                        </div>
                        <div className="leading-none">{'}'}</div>
                    </div>
                )}

                {variant === 'css' && (
                    <div className="space-y-1 pt-0.5 font-mono text-[8px] font-bold text-zinc-400 dark:text-zinc-500">
                        <div className="leading-none">{'{'}</div>
                        <div className="pl-2 space-y-1">
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-1 rounded-full bg-sky-400 dark:bg-sky-500" />
                                <div className="w-5 h-1 rounded-full bg-sky-400 dark:bg-sky-500" />
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-5 h-1 rounded-full bg-sky-400 dark:bg-sky-500" />
                                <div className="w-3 h-1 rounded-full bg-sky-400 dark:bg-sky-500" />
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3.5 h-1 rounded-full bg-sky-400 dark:bg-sky-500" />
                                <div className="w-5 h-1 rounded-full bg-sky-400 dark:bg-sky-500" />
                            </div>
                        </div>
                        <div className="leading-none">{'}'}</div>
                    </div>
                )}

                {variant === 'code' && (
                    <div className="space-y-1.5 pt-0.5 font-mono text-[7px] font-bold text-zinc-400 dark:text-zinc-500">
                        <div className="flex items-center gap-0.5">
                            <span>{'<'}</span>
                            <div className="w-4 h-1 rounded-full bg-emerald-400" />
                            <span>{'>'}</span>
                        </div>
                        <div className="flex items-center gap-0.5 pl-1.5">
                            <span>{'<'}</span>
                            <div className="w-3.5 h-1 rounded-full bg-sky-400" />
                            <span>{'>'}</span>
                        </div>
                        <div className="flex items-center gap-0.5 pl-1.5">
                            <span>{'</'}</span>
                            <div className="w-3.5 h-1 rounded-full bg-sky-400" />
                            <span>{'>'}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <span>{'<'}</span>
                            <div className="w-2 h-1 rounded-full bg-emerald-400" />
                            <span>{'/>'}</span>
                        </div>
                    </div>
                )}

                {variant === 'img' && (
                    <div className="pt-0.5">
                        <div className="h-11 w-full rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 p-1.5">
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-300 dark:bg-amber-400/80" />
                            <div className="w-4 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            <div className="w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                    </div>
                )}

                {variant === 'video' && (
                    <div className="pt-0.5">
                        <div className="h-11 w-full rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 p-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" viewBox="0 0 24 24">
                                <polygon points="6,4 20,12 6,20" />
                            </svg>
                            <div className="w-5 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            <div className="w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                    </div>
                )}

                {variant === 'link' && (
                    <div className="space-y-1.5 pt-0.5">
                        <div className="h-6 w-full rounded-md bg-[#BC5C29]/10 border border-[#BC5C29]/25 flex items-center gap-1 px-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#BC5C29]" />
                            <div className="w-7 h-1 rounded-full bg-[#BC5C29]/60" />
                        </div>
                        <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-8 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-6 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                )}
            </div>

            <span
                className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase tracking-wider shadow-xs"
                style={{ backgroundColor: color }}
            >
                {label}
            </span>
        </div>
    );
}

export default FileTypeIllustration;
